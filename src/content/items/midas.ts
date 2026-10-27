import type { ItemDef } from '@/game/defs';

export const MIDAS_MUL = 8;

export const midas: ItemDef = {
  id: 'midas',
  name: '点金石',
  desc: `石头价值 ×${MIDAS_MUL}`,
  icon: '🪄',
  basePrice: 360,
  lasts: '24 秒',
  appearRate: 0.8,
  duration: 24,
  use(s) {
    s.sfx('powerup');
    return s.mods.add('value', (v, m) => (m.entity?.tags.includes('rock') ? v * MIDAS_MUL : v), {
      source: 'midas',
    });
  },
};
