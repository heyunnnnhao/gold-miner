import { WORLD } from '@/config/global';
import { HOOK_PHYSICS } from '@/config/hook-physics';
import { STAT_EFFECTS, type StatKey } from '@/config/progression';
import { ModStack } from '@/core/mods';
import type { HookDef, ModCtx, PlayerRuntime, Stat } from '../defs';
import { R } from '../registries';
import type { PlayerState, RunState } from '../state';

export function equippedHookDef(run: RunState, player: PlayerState): HookDef {
  const inst = run.hooks.find((h) => h.uid === player.equippedHook);
  return R.hooks.get(inst?.defId ?? 'basic');
}

/**
 * Builds a player's runtime and its player-layer modifiers (hook stats + attributes).
 * Talents are applied by the session afterwards because they need the session context.
 */
export function createPlayerRuntime(run: RunState, state: PlayerState, minerX: number, index: number): PlayerRuntime {
  const def = equippedHookDef(run, state);
  const mods = new ModStack<Stat, ModCtx>();
  mods.mul('extendSpeed', def.stats.extendMul, { source: 'hook' });
  mods.mul('retractSpeed', def.stats.retractMul, { source: 'hook' });
  mods.mul('grabRadius', def.stats.radiusMul, { source: 'hook' });

  for (const key of Object.keys(STAT_EFFECTS) as StatKey[]) {
    const points = state.stats[key];
    if (points <= 0) continue;
    for (const eff of STAT_EFFECTS[key]) {
      if ('mul' in eff) mods.mul(eff.stat, 1 + eff.mul * points, { source: `stat:${key}` });
      else mods.add(eff.stat, (v) => v + eff.add * points, { source: `stat:${key}` });
    }
  }

  return {
    id: state.id,
    state: structuredClone(state),
    mods,
    minerX,
    magnet: false,
    xpGained: 0,
    earned: 0,
    hook: {
      owner: state.id,
      def,
      state: 'swing',
      pivot: { x: minerX, y: WORLD.groundY + HOOK_PHYSICS.pivotOffsetY },
      angle: 0,
      // offset the second player's swing so the two hooks don't move in lockstep
      phase: index * Math.PI * 0.5,
      length: HOOK_PHYSICS.restLength,
      grabbed: [],
    },
  };
}
