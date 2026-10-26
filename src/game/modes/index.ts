import { GLOBAL } from '@/config/global';
import type { Mode } from '@/config/levels';
import type { PlayerId } from '../state';

export interface ModeConfig {
  id: Mode;
  name: string;
  miners: { player: PlayerId; x: number }[];
  targetMul: number;
  spawnMul: number;
}

export const solo: ModeConfig = {
  id: 'solo',
  name: '单人',
  miners: [{ player: 'p1', x: 640 }],
  targetMul: 1,
  spawnMul: 1,
};

export const duo: ModeConfig = {
  id: 'duo',
  name: '双人',
  miners: [
    { player: 'p1', x: 420 },
    { player: 'p2', x: 860 },
  ],
  targetMul: GLOBAL.duoTargetMul,
  spawnMul: GLOBAL.duoSpawnMul,
};

export const MODES: Record<Mode, ModeConfig> = { solo, duo };
