import { WORLD } from '@/config/global';
import { HOOK_PHYSICS } from '@/config/hook-physics';
import { MODES } from '@/game/modes';
import { installedModules } from '@/game/player/player';
import type { RunState } from '@/game/state';
import { ModuleDetail } from './details';
import { Tip } from './Tooltip';

/** Where the module chips sit relative to the miner's reel (the hook pivot), in world px. */
const OFFSET = { x: 50, y: -34 };

/**
 * Emoji chips for the modules on each miner's hook, drawn next to the miner.
 * Hover (PC) or long-press (touch) shows the module's name and effect.
 */
export function ModuleBadges({ run }: { run: RunState }) {
  const pivotY = WORLD.groundY + HOOK_PHYSICS.pivotOffsetY;
  return (
    <>
      {MODES[run.mode].miners.map((m) => {
        const player = run.players.find((p) => p.id === m.player);
        const modules = player ? installedModules(run, player) : [];
        if (modules.length === 0) return null;
        return (
          <div
            key={m.player}
            className="module-badges"
            style={{
              left: `${((m.x + OFFSET.x) / WORLD.width) * 100}%`,
              top: `${((pivotY + OFFSET.y) / WORLD.height) * 100}%`,
            }}
            // a tap on a chip must not drop the hook
            onPointerDown={(e) => e.stopPropagation()}
          >
            {modules.map((d) => (
              <Tip key={d.id} placement="bottom" content={<ModuleDetail id={d.id} />}>
                <span className="module-badge" aria-label={d.name}>
                  {d.icon}
                </span>
              </Tip>
            ))}
          </div>
        );
      })}
    </>
  );
}
