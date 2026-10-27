import { describe, expect, it } from 'vitest';
import { R } from '@/game/registries';
import { emptySession, makeRun, place, tick } from './helpers';

type ModuleId = Parameters<typeof R.modules.get>[0];

const withModules = (ids: ModuleId[]) => {
  const modules = ids.map((defId, i) => ({ uid: `m${i}`, defId }));
  const run = makeRun({ modules });
  run.players[0]!.modules = modules.map((m) => m.uid);
  return emptySession(run);
};

const bar = (id: string) => [id, null, null, null, null, null, null, null, null] as never;

describe('new modules', () => {
  it('弹簧模块 speeds up the empty hook only', () => {
    const s = withModules(['spring']);
    const p = s.players[0]!;
    expect(s.compute('emptyRetractSpeed', 100, { player: p })).toBeCloseTo(250);
    expect(s.compute('retractSpeed', 100, { player: p })).toBeCloseTo(100);
  });

  it('绞盘模块 speeds up heavy hauls only', () => {
    const s = withModules(['winch']);
    const p = s.players[0]!;
    p.hook.grabbed = [place(s, 'gold-m', 100, 400)];
    expect(s.compute('retractSpeed', 100, { player: p })).toBeCloseTo(100);
    p.hook.grabbed = [place(s, 'gold-xl', 300, 500)];
    expect(s.compute('retractSpeed', 100, { player: p })).toBeCloseTo(160);
  });

  it('皮手套模块 adds $60 per animal and blocks hedgehog stings', () => {
    const s = withModules(['glove']);
    const p = s.players[0]!;
    const pig = s.spawnCreature('diamond-pig', { x: 100, y: 400 });
    expect(s.compute('value', 602, { entity: pig, player: p })).toBeCloseTo(662);
    R.creatures.get('hedgehog').onCaught!(s.spawnCreature('hedgehog', { x: 200, y: 400 }), s, p);
    expect(p.stun).toBe(0);
  });

  it('幸运模块 adds 20% crit rate', () => {
    const s = withModules(['lucky']);
    expect(s.compute('critRate', 0, { player: s.players[0]! })).toBeCloseTo(0.2);
  });
});

describe('new items', () => {
  it('碎石炸药 clears every rock and nothing else', () => {
    const s = emptySession(makeRun({ items: { 'rock-blast': 1 }, hotbar: bar('rock-blast') }));
    const rocks = [place(s, 'rock-s', 200, 300), place(s, 'rock-l', 400, 500)];
    const gold = place(s, 'gold-l', 600, 400);
    s.update(1 / 60, ['item.1']);
    expect(rocks.every((r) => !r.alive)).toBe(true);
    expect(gold.alive).toBe(true);
  });

  it('点金石 makes rocks worth ×8 for 24 seconds', () => {
    const s = emptySession(makeRun({ items: { midas: 1 }, hotbar: bar('midas') }));
    const rock = place(s, 'rock-l', 200, 300);
    const gold = place(s, 'gold-m', 400, 300);
    s.update(1 / 60, ['item.1']);
    expect(s.compute('value', 20, { entity: rock })).toBeCloseTo(160);
    expect(s.compute('value', 100, { entity: gold })).toBeCloseTo(100);
    tick(s, 24.1);
    expect(s.compute('value', 20, { entity: rock })).toBeCloseTo(20);
  });

  it('双倍卡 doubles every value for 10 seconds', () => {
    const s = emptySession(makeRun({ items: { 'double-card': 1 }, hotbar: bar('double-card') }));
    const gold = place(s, 'gold-m', 400, 300);
    s.update(1 / 60, ['item.1']);
    expect(s.compute('value', 100, { entity: gold })).toBeCloseTo(200);
    tick(s, 10.1);
    expect(s.compute('value', 100, { entity: gold })).toBeCloseTo(100);
  });
});
