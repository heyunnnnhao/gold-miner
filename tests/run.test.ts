import { describe, expect, it } from 'vitest';
import { finishLevel } from '@/game/run';
import {
  allocateStat,
  buyOffer,
  enterPrep,
  enterShop,
  equipHook,
  pickTalent,
  sellHook,
  startNextLevel,
  swapHooks,
} from '@/stores/actions/run-actions';
import type { RunState } from '@/game/state';
import { parseSave, SAVE_VERSION } from '@/persistence/schema';
import { makeRun } from './helpers';

const unwrap = (r: ReturnType<typeof buyOffer>): RunState => {
  if (!r.ok) throw new Error(r.error);
  return r.run;
};

const passedResult = (run: RunState, xp: number) => ({
  level: run.level,
  target: 650,
  earned: 800,
  wallet: 800,
  passed: true,
  players: run.players.map((p) => ({ id: p.id, xp, earned: 800, levelsGained: [] })),
});

describe('finishLevel', () => {
  it('applies xp, stat points and talent picks', () => {
    const run = makeRun();
    run.players[0]!.lv = 4;
    const next = finishLevel(run, { wallet: 800, bombs: 0, items: {}, hotbar: run.hotbar, earned: 800 }, passedResult(run, 800));
    const p = next.players[0]!;
    expect(p.lv).toBe(5);
    expect(p.statPoints).toBe(3);
    expect(p.talentChoices[0]).toHaveLength(3);
    expect(next.phase).toBe('result');
    expect(next.wallet).toBe(800);
  });

  it('goes to game over on failure', () => {
    const run = makeRun();
    const next = finishLevel(run, { wallet: 10, bombs: 0, items: {}, hotbar: run.hotbar, earned: 10 }, { ...passedResult(run, 0), passed: false });
    expect(next.phase).toBe('over');
  });
});

describe('shop and prep actions', () => {
  const shopRun = () => unwrap(enterShop({ ...makeRun({ wallet: 5000 }), phase: 'result' }));

  it('generates the same shop for the same run and level', () => {
    expect(shopRun().shop).toEqual(shopRun().shop);
    expect(shopRun().shop!.offers.filter((o) => o.kind === 'item' || o.kind === 'buff')).toHaveLength(3);
  });

  it('buys bombs, hooks and enforces wallet and stock', () => {
    let run = shopRun();
    const bomb = run.shop!.offers.find((o) => o.kind === 'bomb')!;
    run = unwrap(buyOffer(run, 'bomb'));
    expect(run.bombs).toBe(1);
    expect(run.wallet).toBe(5000 - bomb.price);
    run = unwrap(buyOffer(run, 'bomb'));
    run = unwrap(buyOffer(run, 'bomb'));
    expect(buyOffer(run, 'bomb').ok).toBe(false);
    run = unwrap(buyOffer(run, 'hook:swift'));
    expect(run.hooks.map((h) => h.defId)).toContain('swift');
    const poor = { ...run, wallet: 0 };
    expect(buyOffer(poor, 'hook:saw').ok).toBe(false);
  });

  it('items go into the hotbar', () => {
    let run = shopRun();
    const item = run.shop!.offers.find((o) => o.kind === 'item');
    if (!item) return;
    run = unwrap(buyOffer(run, item.id));
    expect(run.hotbar).toContain(item.ref);
  });

  it('hooks are exclusive per player; equipping a held hook trades', () => {
    let run = unwrap(enterShop({ ...makeRun({ wallet: 5000 }, 'duo'), phase: 'result' }));
    run = unwrap(buyOffer(run, 'hook:claw'));
    const claw = run.hooks.find((h) => h.defId === 'claw')!.uid;
    run = unwrap(equipHook(run, 'p1', claw));
    run = unwrap(equipHook(run, 'p2', claw));
    expect(run.players[1]!.equippedHook).toBe(claw);
    expect(run.players[0]!.equippedHook).toBe('basic-p2');
    run = unwrap(swapHooks(run));
    expect(run.players[0]!.equippedHook).toBe(claw);
    expect(sellHook(run, claw).ok).toBe(false);
    expect(sellHook(run, 'basic-p1').ok).toBe(false);
  });

  it('stat allocation, talents and next level', () => {
    let run = { ...shopRun() };
    run.players = [{ ...run.players[0]!, statPoints: 1, talentChoices: [['veteran', 'rock-expert', 'demolition']] }];
    run = unwrap(allocateStat(run, 'p1', 'str'));
    expect(run.players[0]!.stats.str).toBe(1);
    expect(allocateStat(run, 'p1', 'str').ok).toBe(false);
    run = unwrap(enterPrep(run));
    expect(startNextLevel(run).ok).toBe(false);
    run = unwrap(pickTalent(run, 'p1', 'veteran'));
    run = unwrap(startNextLevel(run));
    expect(run.level).toBe(2);
    expect(run.phase).toBe('level');
  });
});

describe('save schema', () => {
  it('round-trips a run and drops unknown content', () => {
    const run = makeRun({ items: { hourglass: 2 } });
    const raw = JSON.parse(JSON.stringify({ version: SAVE_VERSION, savedAt: 'x', run: { ...run, buffs: ['nope', 'clover'] } }));
    const file = parseSave(raw);
    expect(file.run.items.hourglass).toBe(2);
    expect(file.run.buffs).toEqual(['clover']);
  });

  it('rejects malformed data', () => {
    expect(() => parseSave({ version: SAVE_VERSION, savedAt: 'x', run: { level: 'a' } })).toThrow();
  });
});
