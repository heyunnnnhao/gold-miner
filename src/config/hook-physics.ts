import { WORLD } from './global';

export const HOOK_PHYSICS = {
  /** max swing angle from vertical, degrees */
  swingAmplitude: 75,
  /** seconds per full swing cycle */
  swingPeriod: 4.5,
  extendSpeed: 420,
  /** retract speed for weight 1; actual = this × pull ÷ weight */
  retractSpeed: 420,
  emptyRetractSpeed: 900,
  /** collision radius of the claw tip */
  tipRadius: 14,
  /** rope length while swinging (from the reel, so the claw hangs just below the ground) */
  restLength: 46,
  maxLength: Math.hypot(WORLD.width / 2, WORLD.height - WORLD.groundY + 30) + 40,
  /** the swing pivot is the miner's reel, 24 px above the ground line; rope, claw and path all start here */
  pivotOffsetY: -24,
  magnetRadius: 120,
  tntRadius: 130,
} as const;
