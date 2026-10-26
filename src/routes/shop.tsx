import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useSelector } from '@tanstack/react-store';
import { levelTarget } from '@/config/levels';
import type { BuffId, ItemId } from '@/content/ids';
import type { ShopOffer } from '@/game/state';
import { buyOffer, enterPrep } from '@/stores/actions/run-actions';
import { runStore } from '@/stores/run';
import { audio } from '@/ui/audio';
import { Money, useToast } from '@/ui/components';
import { dispatchAndSave, requirePhase } from '@/ui/flow';
import { offerInfo } from '@/ui/offer-info';

export const Route = createFileRoute('/shop')({
  beforeLoad: requirePhase('shop'),
  component: ShopPage,
});

function ShopPage() {
  const run = useSelector(runStore, (r) => r);
  const navigate = useNavigate();
  const [toast, showToast] = useToast();

  // gold, items and bombs are shared, so a purchase never belongs to one player
  const buy = (offerId: string) => {
    const err = dispatchAndSave((r) => buyOffer(r, offerId));
    if (err) showToast(err);
    else audio.play('buy');
  };

  if (!run?.shop) return null;
  const nextTarget = levelTarget(run.level + 1, run.mode);
  const owned = (o: ShopOffer) =>
    o.kind === 'hook'
      ? run.hooks.filter((h) => h.defId === o.ref).length
      : o.kind === 'item'
        ? (run.items[o.ref as ItemId] ?? 0)
        : o.kind === 'bomb'
          ? run.bombs
          : run.buffs.includes(o.ref as BuffId)
            ? 1
            : 0;

  const leave = () => {
    const err = dispatchAndSave(enterPrep);
    if (err) return showToast(err);
    void navigate({ to: '/prep' });
  };

  return (
    <div className="page">
      <div className="page-narrow">
        <div className="page-header">
          <h1>🛒 商店</h1>
          <div className="row">
            <span className="muted">{run.mode === 'duo' ? '共享金币' : '金币'}</span>
            <Money value={run.wallet} />
            <span className="muted small">
              · 第 {run.level + 1} 关目标 ${nextTarget.toLocaleString()}（还差 $
              {Math.max(0, nextTarget - run.wallet).toLocaleString()}）
            </span>
          </div>
        </div>

        <div className="grid">
          {run.shop.offers.map((o) => {
            const info = offerInfo(o);
            const soldOut = o.stock !== null && o.stock <= 0;
            const cant =
              soldOut || run.wallet < o.price || (o.kind === 'buff' && run.buffs.includes(o.ref as BuffId));
            return (
              <div key={o.id} className={`card ${cant ? 'disabled' : ''}`}>
                <div className="row">
                  <span className="icon">{info.icon}</span>
                  <span className="spacer" />
                  <span className="badge">{info.tag}</span>
                </div>
                <span className="name">{info.name}</span>
                <span className="desc">{info.desc}</span>
                <div className="row">
                  <span className="price">${o.price.toLocaleString()}</span>
                  <span className="spacer" />
                  <span className="muted small">
                    {o.stock === null ? '' : `库存 ${o.stock} · `}已有 {owned(o)}
                  </span>
                </div>
                <button className="btn" disabled={cant} onClick={() => buy(o.id)}>
                  {soldOut ? '售罄' : '购买'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn big" onClick={leave}>
            完成购物 → 整备
          </button>
        </div>
      </div>
      {toast}
    </div>
  );
}
