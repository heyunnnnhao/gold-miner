import type { BagOutcome, MineralDef } from '@/game/defs';

type Roll = { weight: (luck: number) => number; roll: (level: number, r: () => number) => BagOutcome };

const ROLLS: Roll[] = [
  {
    weight: (l) => Math.max(3, 20 - l * 1.5),
    roll: (_, r) => ({ kind: 'dud', amount: 1 + Math.floor(r() * 10) }),
  },
  { weight: () => 35, roll: (n, r) => ({ kind: 'coins', amount: 30 + Math.floor(r() * 120) + n * 10 }) },
  {
    weight: (l) => 10 + l * 1.5,
    roll: (n, r) => ({ kind: 'coins', amount: 250 + Math.floor(r() * 350) + n * 30 }),
  },
  { weight: (l) => 15 + l * 0.5, roll: () => ({ kind: 'bomb' }) },
  { weight: (l) => 10 + l * 0.5, roll: () => ({ kind: 'strength' }) },
];

export const mysteryBag: MineralDef = {
  id: 'mystery-bag',
  name: '神秘袋',
  // nominal value used by the level budget; the real outcome is rolled on spawn
  value: 150,
  weight: 2,
  radius: 20,
  tags: ['bag'],
  sprite: 'bag',
  color: '#c49a6c',
  spawnWeight: () => 2.5,
  depth: [0.15, 1],
  onSpawn(e, s) {
    // rolled at spawn so the x-ray item shows the true content; luck = best of all players
    const luck = Math.max(...s.players.map((p) => s.compute('bagLuck', 0, { player: p })));
    const pick = s.rng.bag.weighted(ROLLS, (r) => r.weight(luck));
    e.bag = pick.roll(s.level, s.rng.bag.next);
  },
  settleValue(e, s) {
    const bag = e.bag;
    if (!bag) return 0;
    switch (bag.kind) {
      case 'coins':
      case 'dud':
        return bag.amount;
      case 'bomb':
        s.addBombs(1);
        s.floatText(e.pos, '炸弹 +1', '#ff7a59');
        return 0;
      case 'strength':
        s.mods.mul('retractSpeed', 1.5, { source: 'bag-strength' });
        s.floatText(e.pos, '大力！', '#7ad7ff');
        return 0;
    }
  },
};

export function bagLabel(bag: BagOutcome): string {
  switch (bag.kind) {
    case 'coins':
    case 'dud':
      return `$${bag.amount}`;
    case 'bomb':
      return '💣';
    case 'strength':
      return '💪';
  }
}
