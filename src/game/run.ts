import { GLOBAL } from '@/config/global';
import type { Mode } from '@/config/levels';
import { STAT_POINTS_PER_LEVEL, TALENT_CHOICES, TALENT_LEVELS, addXp } from '@/config/progression';
import { createRng } from '@/core/rng';
import type { TalentId } from '@/content/ids';
import { MODES } from './modes';
import { R } from './registries';
import type { Economy } from './defs';
import type { LevelResult, PlayerId, PlayerState, RunState } from './state';

export const starterHookUid = (id: PlayerId): string => `basic-${id}`;

export function createPlayer(id: PlayerId): PlayerState {
  return {
    id,
    lv: 1,
    xp: 0,
    statPoints: 0,
    stats: { str: 0, agi: 0, acc: 0, luk: 0 },
    talents: [],
    talentChoices: [],
    equippedHook: starterHookUid(id),
  };
}

export function createRun(mode: Mode, seed: number): RunState {
  const ids = MODES[mode].miners.map((m) => m.player);
  return {
    mode,
    level: 1,
    wallet: GLOBAL.startingWallet,
    bombs: GLOBAL.startingBombs,
    items: {},
    buffs: [],
    hotbar: Array.from({ length: GLOBAL.hotbarSize }, () => null),
    hooks: ids.map((id) => ({ uid: starterHookUid(id), defId: 'basic' as const })),
    players: ids.map(createPlayer),
    runSeed: seed,
    phase: 'level',
    shop: null,
    lastResult: null,
    totalEarned: 0,
  };
}

/** Draws talent choices the player doesn't own and isn't already being offered. */
export function rollTalentChoices(run: RunState, player: PlayerState, atLevel: number): TalentId[] {
  const taken = new Set<TalentId>([...player.talents, ...player.talentChoices.flat()]);
  const pool = R.talents.all().filter((t) => !taken.has(t.id));
  const rng = createRng(run.runSeed).fork(`talent-${player.id}-${atLevel}`);
  const out: TalentId[] = [];
  while (out.length < TALENT_CHOICES && pool.length > 0) {
    const i = rng.int(0, pool.length - 1);
    out.push(pool[i]!.id);
    pool.splice(i, 1);
  }
  return out;
}

/** Applies a finished level to the run: economy, xp / level-ups / talent picks, next phase. */
export function finishLevel(run: RunState, econ: Economy, result: LevelResult): RunState {
  const next: RunState = structuredClone(run);
  next.wallet = econ.wallet;
  next.bombs = econ.bombs;
  next.items = { ...econ.items };
  next.buffs = [];
  next.totalEarned += result.earned;
  next.phase = result.passed ? 'result' : 'over';
  next.shop = null;

  const players: LevelResult['players'] = [];
  for (const pr of result.players) {
    const p = next.players.find((x) => x.id === pr.id);
    if (!p) continue;
    const up = addXp(p.lv, p.xp, pr.xp);
    p.lv = up.lv;
    p.xp = up.xp;
    p.statPoints += up.gainedLevels.length * STAT_POINTS_PER_LEVEL;
    for (const lv of up.gainedLevels) {
      if ((TALENT_LEVELS as readonly number[]).includes(lv)) {
        const choices = rollTalentChoices(next, p, lv);
        if (choices.length > 0) p.talentChoices.push(choices);
      }
    }
    players.push({ ...pr, levelsGained: up.gainedLevels });
  }
  next.lastResult = { ...result, players };
  return next;
}
