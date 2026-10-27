import type { ModuleDef } from '@/game/defs';

const plain = { extendMul: 1, retractMul: 1, radiusMul: 1 };

// Modules plug into a hook (3 slots). Stats multiply across installed modules, traits combine.
// Prices: the saw module is the cheapest, the scope module the most expensive.
export const MODULES: ModuleDef[] = [
  {
    id: 'saw',
    name: '锯齿模块',
    icon: '🪚',
    desc: '伸出时锯死路径上的小动物，钩子不停',
    price: 1600,
    stats: plain,
    traits: ['killPath'],
  },
  {
    id: 'claw',
    name: '巨爪模块',
    icon: '🦾',
    desc: '判定半径 ×1.6，伸出 ×0.9',
    price: 2400,
    stats: { extendMul: 0.9, retractMul: 1, radiusMul: 1.6 },
    traits: [],
  },
  {
    id: 'swift',
    name: '疾风模块',
    icon: '💨',
    desc: '伸出 ×1.5，回收 ×1.3',
    price: 2800,
    stats: { extendMul: 1.5, retractMul: 1.3, radiusMul: 1 },
    traits: [],
  },
  {
    id: 'pierce',
    name: '穿石模块',
    icon: '⛏️',
    desc: '伸出时直接穿过石头，只抓值钱的东西',
    price: 3200,
    stats: plain,
    traits: ['pierceRock'],
  },
  {
    id: 'appraiser',
    name: '鉴宝模块',
    icon: '💎',
    desc: '宝石（钻石、红宝石）和神秘袋价值 +30%',
    price: 3600,
    stats: plain,
    traits: ['appraise'],
  },
  {
    id: 'magnet',
    name: '磁力模块',
    icon: '🧲',
    desc: '每次抓取都吸附周围的小、中金块一起带回',
    price: 4400,
    stats: { extendMul: 1, retractMul: 0.95, radiusMul: 1 },
    traits: ['magnetPull'],
  },
  {
    id: 'scope',
    name: '瞄准模块',
    icon: '🎯',
    desc: '摆动时显示虚线引导线，判定半径 ×1.15',
    price: 6400,
    stats: { extendMul: 1, retractMul: 1, radiusMul: 1.15 },
    traits: ['aimLine'],
  },
];
