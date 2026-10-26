import { Registry } from '@/core/registry';
import type {
  BehaviorId,
  BuffId,
  CreatureId,
  HookId,
  HookTraitId,
  ItemId,
  MineralId,
  TalentId,
} from '@/content/ids';
import type {
  BehaviorDef,
  BuffDef,
  CreatureDef,
  HookDef,
  HookTraitDef,
  ItemDef,
  MineralDef,
  TalentDef,
} from './defs';

export const R = {
  minerals: new Registry<MineralId, MineralDef>('minerals'),
  creatures: new Registry<CreatureId, CreatureDef>('creatures'),
  behaviors: new Registry<BehaviorId, BehaviorDef>('behaviors'),
  items: new Registry<ItemId, ItemDef>('items'),
  buffs: new Registry<BuffId, BuffDef>('buffs'),
  hooks: new Registry<HookId, HookDef>('hooks'),
  hookTraits: new Registry<HookTraitId, HookTraitDef>('hookTraits'),
  talents: new Registry<TalentId, TalentDef>('talents'),
};

export function freezeRegistries(): void {
  for (const reg of Object.values(R)) reg.freeze();
}
