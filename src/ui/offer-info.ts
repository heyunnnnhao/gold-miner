import type { BuffId, HookId, ItemId } from '@/content/ids';
import { R } from '@/game/registries';
import type { ShopOffer } from '@/game/state';

export type OfferInfo = { icon: string; name: string; desc: string; tag: string };

export function offerInfo(o: ShopOffer): OfferInfo {
  switch (o.kind) {
    case 'bomb':
      return { icon: '💣', name: '炸弹', desc: '回收时炸掉钩上的物体（全队共享）', tag: '炸弹' };
    case 'item': {
      const d = R.items.get(o.ref as ItemId);
      return { icon: d.icon, name: d.name, desc: d.desc, tag: '主动道具' };
    }
    case 'buff': {
      const d = R.buffs.get(o.ref as BuffId);
      return { icon: d.icon, name: d.name, desc: d.desc, tag: '被动 · 下一关' };
    }
    case 'hook': {
      const d = R.hooks.get(o.ref as HookId);
      return { icon: '🪝', name: d.name, desc: d.desc, tag: '抓钩' };
    }
  }
}
