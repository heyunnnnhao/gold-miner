import type { MineralDef } from '@/game/defs';

export const diamond: MineralDef = {
  id: 'diamond',
  name: '钻石',
  value: 600,
  weight: 1,
  radius: 11,
  tags: ['diamond', 'gem'],
  sprite: 'diamond',
  color: '#8fe3ff',
  spawnWeight: (n) => 1 + n * 0.4,
  depth: [0.5, 1],
};

export const bone: MineralDef = {
  id: 'bone',
  name: '骨头',
  value: 7,
  weight: 1,
  radius: 18,
  tags: ['bone'],
  sprite: 'bone',
  color: '#ece4d0',
  spawnWeight: () => 0,
  depth: [0, 0.8],
  filler: { count: (n) => 2 + (n % 2) },
};

/** Carried home when a TNT is hooked. */
export const debris: MineralDef = {
  id: 'debris',
  name: '碎片',
  value: 0,
  weight: 1,
  radius: 10,
  tags: ['debris'],
  sprite: 'debris',
  color: '#5b4636',
  spawnWeight: () => 0,
  depth: [0, 1],
};
