import { z } from 'zod';
import type { RunState } from '@/game/state';
import { R } from '@/game/registries';

export const SAVE_VERSION = 1;

const playerId = z.enum(['p1', 'p2']);

const playerSchema = z.object({
  id: playerId,
  lv: z.number().int().min(1),
  xp: z.number().min(0),
  statPoints: z.number().int().min(0),
  stats: z.object({ str: z.number().int(), agi: z.number().int(), acc: z.number().int(), luk: z.number().int() }),
  talents: z.array(z.string()),
  talentChoices: z.array(z.array(z.string())),
  equippedHook: z.string(),
});

const levelResultSchema = z.object({
  level: z.number(),
  target: z.number(),
  earned: z.number(),
  wallet: z.number(),
  passed: z.boolean(),
  players: z.array(z.object({ id: playerId, xp: z.number(), earned: z.number(), levelsGained: z.array(z.number()) })),
});

const runSchema = z.object({
  mode: z.enum(['solo', 'duo']),
  level: z.number().int().min(1),
  wallet: z.number(),
  bombs: z.number().int().min(0),
  items: z.record(z.string(), z.number().int().min(0)),
  buffs: z.array(z.string()),
  hotbar: z.array(z.string().nullable()),
  hooks: z.array(z.object({ uid: z.string(), defId: z.string() })),
  players: z.array(playerSchema).min(1).max(2),
  runSeed: z.number(),
  phase: z.enum(['level', 'result', 'shop', 'prep', 'over']),
  shop: z
    .object({
      level: z.number(),
      offers: z.array(
        z.object({
          id: z.string(),
          kind: z.enum(['bomb', 'item', 'buff', 'hook']),
          ref: z.string(),
          price: z.number(),
          stock: z.number().nullable(),
        }),
      ),
    })
    .nullable(),
  lastResult: levelResultSchema.nullable(),
  totalEarned: z.number(),
});

export const saveFileSchema = z.object({
  version: z.number().int(),
  savedAt: z.string(),
  run: runSchema,
});

export type SaveFile = { version: number; savedAt: string; run: RunState };

/** Upgrades older save shapes step by step: migrations[v] turns version v into v + 1. */
const migrations: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {};

/** Drops references to content that no longer exists, so removed items can't crash a load. */
function sanitize(run: z.infer<typeof runSchema>): RunState {
  const items = Object.fromEntries(Object.entries(run.items).filter(([id]) => R.items.has(id)));
  const hooks = run.hooks.filter((h) => R.hooks.has(h.defId));
  const hookUids = new Set(hooks.map((h) => h.uid));
  return {
    ...run,
    items,
    buffs: run.buffs.filter((b) => R.buffs.has(b)),
    hotbar: run.hotbar.map((id) => (id && R.items.has(id) ? id : null)),
    hooks,
    players: run.players.map((p) => ({
      ...p,
      talents: p.talents.filter((t) => R.talents.has(t)),
      talentChoices: p.talentChoices.map((c) => c.filter((t) => R.talents.has(t))).filter((c) => c.length > 0),
      equippedHook: hookUids.has(p.equippedHook) ? p.equippedHook : `basic-${p.id}`,
    })),
  } as RunState;
}

export function parseSave(raw: unknown): SaveFile {
  let data = raw as Record<string, unknown>;
  let version = typeof data?.version === 'number' ? data.version : 0;
  while (version < SAVE_VERSION) {
    const m = migrations[version];
    if (!m) throw new Error(`no migration from save version ${version}`);
    data = m(data);
    version++;
  }
  const parsed = saveFileSchema.parse(data);
  return { version: parsed.version, savedAt: parsed.savedAt, run: sanitize(parsed.run) };
}
