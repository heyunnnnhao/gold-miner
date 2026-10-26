import { attract } from '@/game/systems/hook';
import type { HookTraitDef } from '@/game/defs';

export const magnetPull: HookTraitDef = {
  id: 'magnetPull',
  name: '吸金',
  onGrab(hook, e, s) {
    const owner = s.players.find((p) => p.id === hook.owner);
    // a permanent, smaller-radius magnet that doesn't use up the magnet item
    if (owner) attract(owner, s, e.pos, false, 90);
  },
};
