import { GLOBAL, WORLD } from '@/config/global';
import { creatureCount, soloTarget, unlockedAt, type Mode } from '@/config/levels';
import { circlesOverlap, type Vec2 } from '@/core/math';
import type { Rng } from '@/core/rng';
import type { CreatureId, MineralId } from '@/content/ids';
import type { MineralDef } from '../defs';
import { MODES } from '../modes';
import { R } from '../registries';

export type SpawnSpec =
  | { kind: 'mineral'; defId: MineralId; pos: Vec2 }
  | { kind: 'creature'; defId: CreatureId; pos: Vec2 };

export type GeneratedLevel = { spawns: SpawnSpec[]; value: number; budget: number };

const PADDING = 8;
const PLACE_TRIES = 30;
const MAX_ATTEMPTS = 5;
/** keep a little space right under each miner so the first drop doesn't always hit a rock */
const RESERVED_DEPTH = 110;
const RESERVED_HALF_WIDTH = 28;

/** Gold this level adds on top of the previous cumulative goal. */
export const levelIncrement = (n: number): number => (n <= 1 ? soloTarget(1) : soloTarget(n) - soloTarget(n - 1));

/**
 * Map value budget: (cumulative) solo target × valueBudgetRatio, × duoSpawnMul in duo.
 * From mid levels on the mine fills up before the budget is reached, so time becomes the real limit.
 */
export const levelBudget = (n: number, mode: Mode): number =>
  Math.round(soloTarget(n) * GLOBAL.valueBudgetRatio * MODES[mode].spawnMul);

type Placed = { pos: Vec2; radius: number };

function tryPlace(rng: Rng, radius: number, depth: readonly [number, number], placed: Placed[], minerXs: number[]): Vec2 | null {
  const span = WORLD.mineBottom - WORLD.mineTop;
  const yMin = Math.max(WORLD.mineTop + radius, WORLD.mineTop + depth[0] * span);
  const yMax = Math.min(WORLD.mineBottom - radius, WORLD.mineTop + depth[1] * span);
  for (let i = 0; i < PLACE_TRIES; i++) {
    const pos = { x: rng.range(radius + 12, WORLD.width - radius - 12), y: rng.range(yMin, Math.max(yMin, yMax)) };
    if (placed.some((p) => circlesOverlap(pos, radius + PADDING, p.pos, p.radius))) continue;
    if (
      pos.y - radius < WORLD.mineTop + RESERVED_DEPTH &&
      minerXs.some((x) => Math.abs(pos.x - x) < RESERVED_HALF_WIDTH + radius)
    )
      continue;
    return pos;
  }
  return null;
}

function generateOnce(n: number, mode: Mode, rng: Rng): GeneratedLevel {
  const budget = levelBudget(n, mode);
  const minerXs = MODES[mode].miners.map((m) => m.x);
  const unlocked = unlockedAt(n);
  const minerals = unlocked.minerals.map((id) => R.minerals.get(id));
  const valuable = minerals.filter((d) => !d.filler && d.spawnWeight(n) > 0);
  const fillers = minerals.filter((d): d is MineralDef & { filler: NonNullable<MineralDef['filler']> } => !!d.filler);
  const placed: Placed[] = [];
  const spawns: SpawnSpec[] = [];
  let value = 0;

  // fillers (rocks, bones, TNT) first: from mid levels the value budget fills the whole mine,
  // so placing them last would silently drop them
  for (const def of fillers) {
    const count = Math.max(0, def.filler.count(n));
    for (let i = 0; i < count; i++) {
      const pos = tryPlace(rng, def.radius, def.depth, placed, minerXs);
      if (!pos) continue;
      placed.push({ pos, radius: def.radius });
      spawns.push({ kind: 'mineral', defId: def.id, pos });
    }
  }
  let guard = 0;
  while (value < budget && guard++ < 200 && valuable.length > 0) {
    const def = rng.weighted(valuable, (d) => d.spawnWeight(n));
    const pos = tryPlace(rng, def.radius, def.depth, placed, minerXs);
    if (!pos) continue;
    placed.push({ pos, radius: def.radius });
    spawns.push({ kind: 'mineral', defId: def.id, pos });
    value += def.value;
  }

  const creatures = unlocked.creatures.map((id) => R.creatures.get(id));
  const nCreatures = creatures.length > 0 ? creatureCount(n) : 0;
  for (let i = 0; i < nCreatures; i++) {
    const def = rng.weighted(creatures, (d) => d.spawnWeight(n));
    // creatures walk, so only keep them apart from each other and off the top rows
    const pos = {
      x: rng.range(80, WORLD.width - 80),
      y: rng.range(WORLD.mineTop + 120, WORLD.mineBottom - def.radius - 10),
    };
    spawns.push({ kind: 'creature', defId: def.id, pos });
  }
  return { spawns, value, budget };
}

/**
 * Deterministic for a given rng. Retries with a sub-seed when the placed value
 * falls short of 1.2 × the gold needed, and keeps the richest attempt.
 */
export function generateLevel(n: number, mode: Mode, rng: Rng): GeneratedLevel {
  const needed = levelIncrement(n) * MODES[mode].targetMul * 1.2;
  let best: GeneratedLevel | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = generateOnce(n, mode, rng.fork(attempt));
    if (!best || result.value > best.value) best = result;
    if (result.value >= needed) return result;
  }
  return best!;
}
