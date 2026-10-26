import { HOOK_SELL_RATIO } from '@/config/shop';
import type { StatKey } from '@/config/progression';
import type { BuffId, ItemId, TalentId } from '@/content/ids';
import { R } from '@/game/registries';
import { generateShop } from '@/game/shop';
import type { PlayerId, RunState } from '@/game/state';

// Pure run-state transitions used by the out-of-level screens. Each validates, then returns a new state.

export type ActionResult = { ok: true; run: RunState } | { ok: false; error: string };

const ok = (run: RunState): ActionResult => ({ ok: true, run });
const fail = (error: string): ActionResult => ({ ok: false, error });

const newUid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function enterShop(run: RunState): ActionResult {
  if (run.phase !== 'result' && run.phase !== 'shop') return fail('当前不能进入商店');
  const next = structuredClone(run);
  next.phase = 'shop';
  if (!next.shop || next.shop.level !== next.level) next.shop = generateShop(next);
  return ok(next);
}

export function buyOffer(run: RunState, offerId: string): ActionResult {
  if (run.phase !== 'shop' || !run.shop) return fail('商店未开放');
  const next = structuredClone(run);
  const offer = next.shop!.offers.find((o) => o.id === offerId);
  if (!offer) return fail('商品不存在');
  if (offer.stock !== null && offer.stock <= 0) return fail('已售罄');
  if (next.wallet < offer.price) return fail('金币不足');
  if (offer.kind === 'buff' && next.buffs.includes(offer.ref as BuffId)) return fail('已拥有该效果');

  next.wallet -= offer.price;
  if (offer.stock !== null) offer.stock--;
  switch (offer.kind) {
    case 'bomb':
      next.bombs++;
      break;
    case 'item': {
      const id = offer.ref as ItemId;
      next.items[id] = (next.items[id] ?? 0) + 1;
      if (!next.hotbar.includes(id)) {
        const empty = next.hotbar.indexOf(null);
        if (empty >= 0) next.hotbar[empty] = id;
      }
      break;
    }
    case 'buff':
      next.buffs.push(offer.ref as BuffId);
      break;
    case 'hook':
      if (!R.hooks.has(offer.ref)) return fail('未知抓钩');
      next.hooks.push({ uid: newUid(), defId: offer.ref });
      break;
  }
  return ok(next);
}

export function sellHook(run: RunState, uid: string): ActionResult {
  const inst = run.hooks.find((h) => h.uid === uid);
  if (!inst) return fail('抓钩不存在');
  const def = R.hooks.get(inst.defId);
  if (!def.sellable) return fail(`${def.name}不可出售`);
  if (run.players.some((p) => p.equippedHook === uid)) return fail('请先卸下该抓钩');
  const next = structuredClone(run);
  next.hooks = next.hooks.filter((h) => h.uid !== uid);
  next.wallet += Math.round(def.price * HOOK_SELL_RATIO);
  return ok(next);
}

/** Equips a hook instance. If the other player holds it, the two players trade hooks. */
export function equipHook(run: RunState, playerId: PlayerId, uid: string): ActionResult {
  if (!run.hooks.some((h) => h.uid === uid)) return fail('抓钩不存在');
  const next = structuredClone(run);
  const me = next.players.find((p) => p.id === playerId);
  if (!me) return fail('玩家不存在');
  const holder = next.players.find((p) => p.id !== playerId && p.equippedHook === uid);
  if (holder) holder.equippedHook = me.equippedHook;
  me.equippedHook = uid;
  return ok(next);
}

export function swapHooks(run: RunState): ActionResult {
  const [a, b] = run.players;
  if (!a || !b) return fail('单人模式无需互换');
  const next = structuredClone(run);
  const [na, nb] = next.players as [typeof a, typeof b];
  [na.equippedHook, nb.equippedHook] = [nb.equippedHook, na.equippedHook];
  return ok(next);
}

export function allocateStat(run: RunState, playerId: PlayerId, stat: StatKey): ActionResult {
  const next = structuredClone(run);
  const p = next.players.find((x) => x.id === playerId);
  if (!p) return fail('玩家不存在');
  if (p.statPoints <= 0) return fail('没有可用的属性点');
  p.statPoints--;
  p.stats[stat]++;
  return ok(next);
}

export function pickTalent(run: RunState, playerId: PlayerId, talent: TalentId): ActionResult {
  const next = structuredClone(run);
  const p = next.players.find((x) => x.id === playerId);
  if (!p) return fail('玩家不存在');
  const choices = p.talentChoices[0];
  if (!choices?.includes(talent)) return fail('不可选择该天赋');
  p.talents.push(talent);
  p.talentChoices.shift();
  return ok(next);
}

export function swapHotbar(run: RunState, from: number, to: number): ActionResult {
  const size = run.hotbar.length;
  if (from < 0 || to < 0 || from >= size || to >= size) return fail('格子不存在');
  const next = structuredClone(run);
  [next.hotbar[from], next.hotbar[to]] = [next.hotbar[to] ?? null, next.hotbar[from] ?? null];
  return ok(next);
}

/** Puts an owned item into a hotbar slot (or clears the slot with null). */
export function assignHotbar(run: RunState, slot: number, item: ItemId | null): ActionResult {
  if (slot < 0 || slot >= run.hotbar.length) return fail('格子不存在');
  const next = structuredClone(run);
  if (item) {
    const existing = next.hotbar.indexOf(item);
    if (existing >= 0) next.hotbar[existing] = null;
  }
  next.hotbar[slot] = item;
  return ok(next);
}

export function enterPrep(run: RunState): ActionResult {
  if (run.phase !== 'shop' && run.phase !== 'prep') return fail('当前不能整备');
  const next = structuredClone(run);
  next.phase = 'prep';
  return ok(next);
}

export function startNextLevel(run: RunState): ActionResult {
  if (run.phase !== 'prep') return fail('请先完成整备');
  if (run.players.some((p) => p.talentChoices.length > 0)) return fail('还有未选择的天赋');
  const next = structuredClone(run);
  next.level++;
  next.phase = 'level';
  next.shop = null;
  return ok(next);
}
