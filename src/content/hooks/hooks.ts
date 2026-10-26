import type { HookDef } from '@/game/defs';

const plain = { extendMul: 1, retractMul: 1, radiusMul: 1 };

// A hook = stats + a list of traits. New hooks (including trait combos) are one entry each.
// Prices: equipment is a long-term investment, from the saw (cheapest) up to the scope (most expensive).
export const HOOKS: HookDef[] = [
  {
    id: 'basic',
    name: '铁钩',
    desc: '朴实无华的初始抓钩',
    price: 0,
    stats: plain,
    traits: [],
    sellable: false,
  },
  {
    id: 'saw',
    name: '锯齿钩',
    desc: '伸出时锯死路径上的小动物，钩子不停',
    price: 2000,
    stats: plain,
    traits: ['killPath'],
    sellable: true,
  },
  {
    id: 'claw',
    name: '巨爪',
    desc: '判定半径 ×1.6，伸出 ×0.9',
    price: 3000,
    stats: { extendMul: 0.9, retractMul: 1, radiusMul: 1.6 },
    traits: [],
    sellable: true,
  },
  {
    id: 'swift',
    name: '疾风钩',
    desc: '伸出 ×1.5，回收 ×1.3',
    price: 3500,
    stats: { extendMul: 1.5, retractMul: 1.3, radiusMul: 1 },
    traits: [],
    sellable: true,
  },
  {
    id: 'pierce',
    name: '穿石钩',
    desc: '伸出时直接穿过石头，只抓值钱的东西',
    price: 4000,
    stats: plain,
    traits: ['pierceRock'],
    sellable: true,
  },
  {
    id: 'appraiser',
    name: '鉴宝钩',
    desc: '钻石和神秘袋价值 +30%',
    price: 4500,
    stats: plain,
    traits: ['appraise'],
    sellable: true,
  },
  {
    id: 'magnet',
    name: '磁力钩',
    desc: '每次抓取都会吸附周围的小金块一起带回',
    price: 5500,
    stats: { extendMul: 1, retractMul: 0.95, radiusMul: 1 },
    traits: ['magnetPull'],
    sellable: true,
  },
  {
    id: 'scope',
    name: '瞄准钩',
    desc: '摆动时显示虚线引导线，判定半径 ×1.15',
    price: 8000,
    stats: { extendMul: 1, retractMul: 1, radiusMul: 1.15 },
    traits: ['aimLine'],
    sellable: true,
  },
];
