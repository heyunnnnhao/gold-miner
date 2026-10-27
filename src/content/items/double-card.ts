import type { ItemDef } from '@/game/defs';

export const doubleCard: ItemDef = {
  id: 'double-card',
  name: '双倍卡',
  desc: '全体抓回的物体价值 ×2',
  icon: '🎫',
  basePrice: 450,
  lasts: '10 秒',
  appearRate: 0.7,
  duration: 10,
  use(s) {
    s.sfx('powerup');
    return s.mods.mul('value', 2, { source: 'double-card' });
  },
};
