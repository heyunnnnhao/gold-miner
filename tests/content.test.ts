import { describe, expect, it } from 'vitest';
import { R } from '@/game/registries';
import { dropStraight, emptySession, makeRun, place, tick, until } from './helpers';

const withHook = (defId: Parameters<typeof R.hooks.get>[0], patch = {}) => {
  const run = makeRun({ hooks: [{ uid: 'h1', defId }], ...patch });
  run.players[0]!.equippedHook = 'h1';
  return emptySession(run);
};

describe('hook prices', () => {
  it('saw is the cheapest upgrade and scope the most expensive', () => {
    const paid = R.hooks.all().filter((h) => h.price > 0);
    const byPrice = [...paid].sort((a, b) => a.price - b.price);
    expect(byPrice[0]!.id).toBe('saw');
    expect(byPrice.at(-1)!.id).toBe('scope');
  });
});

describe('new hooks', () => {
  it('穿石钩 passes through rocks and grabs what is behind', () => {
    const s = withHook('pierce');
    const p = s.players[0]!;
    const x = p.hook.pivot.x;
    const rock = place(s, 'rock-l', x, 320);
    const gold = place(s, 'gold-m', x, 480);
    dropStraight(s);
    until(s, () => p.hook.state === 'retract');
    expect(p.hook.grabbed).toContain(gold);
    expect(rock.grabbedBy).toBeNull();
  });

  it('磁力钩 pulls nearby small gold on every grab, without using the magnet item', () => {
    const s = withHook('magnet');
    const p = s.players[0]!;
    const x = p.hook.pivot.x;
    place(s, 'gold-m', x, 450);
    const near = place(s, 'gold-s', x + 55, 460);
    dropStraight(s);
    until(s, () => p.hook.state === 'retract');
    expect(p.hook.grabbed).toContain(near);
  });

  it('鉴宝钩 adds 30% to diamonds', () => {
    const s = withHook('appraiser');
    const p = s.players[0]!;
    const d = place(s, 'diamond', 100, 500);
    expect(s.compute('value', 600, { entity: d, player: p })).toBeCloseTo(780);
  });
});

describe('new items and buffs', () => {
  const bar = (id: string) => [id, null, null, null, null, null, null, null, null] as never;

  it('拆弹钳 removes every TNT without exploding', () => {
    const s = emptySession(makeRun({ items: { defuse: 1 }, hotbar: bar('defuse') }));
    const t = place(s, 'tnt', 300, 400);
    const gold = place(s, 'gold-l', 340, 400);
    s.update(1 / 60, ['item.1']);
    tick(s, 0.2);
    expect(t.alive).toBe(false);
    expect(gold.alive).toBe(true);
  });

  it('黄金雨 spawns small gold in the upper mine', () => {
    const s = emptySession(makeRun({ items: { 'gold-rain': 1 }, hotbar: bar('gold-rain') }));
    s.update(1 / 60, ['item.1']);
    expect(s.entities.filter((e) => e.defId === 'gold-s')).toHaveLength(6);
  });

  it('肾上腺素 speeds hooks up for 8 seconds', () => {
    const s = emptySession(makeRun({ items: { adrenaline: 1 }, hotbar: bar('adrenaline') }));
    const p = s.players[0]!;
    s.update(1 / 60, ['item.1']);
    expect(s.compute('extendSpeed', 100, { player: p })).toBeCloseTo(150);
    tick(s, 8.1);
    expect(s.compute('extendSpeed', 100, { player: p })).toBeCloseTo(100);
  });

  it('藏宝图 buries 3 extra diamonds when the level starts', () => {
    const s = emptySession(makeRun({ buffs: ['treasure-map'] }));
    // emptySession cleared the generated map before start(), so only buried diamonds remain
    expect(s.entities.filter((e) => e.defId === 'diamond')).toHaveLength(3);
  });

  it('暴利合同 adds 15% to everything', () => {
    const s = emptySession(makeRun({ buffs: ['contract'] }));
    const g = place(s, 'gold-m', 100, 400);
    expect(s.compute('value', 100, { entity: g })).toBeCloseTo(115);
  });
});
