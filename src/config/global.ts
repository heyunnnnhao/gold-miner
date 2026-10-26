export const GLOBAL = {
  /** seconds per level */
  levelTime: 60,
  duoTargetMul: 1.6,
  duoSpawnMul: 1.5,
  /** total map value ≈ solo target × this */
  valueBudgetRatio: 1.8,
  hotbarSize: 9,
  startingBombs: 0,
  startingWallet: 0,
} as const;

export const shopSlots = (level: number): number => Math.min(3 + Math.floor(level / 4), 6);

/** Logical canvas size; all gameplay coordinates use this space. */
export const WORLD = {
  width: 1280,
  height: 720,
  groundY: 150,
  /** top of the area where entities spawn */
  mineTop: 210,
  mineBottom: 700,
} as const;
