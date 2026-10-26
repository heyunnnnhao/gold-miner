import { useEffect, useState, type ReactNode } from 'react';
import { STAT_DESC, STAT_NAMES, xpToNext, type StatKey } from '@/config/progression';
import type { TalentId } from '@/content/ids';
import { R } from '@/game/registries';
import type { PlayerState } from '@/game/state';
import { allocateStat, pickTalent } from '@/stores/actions/run-actions';
import { audio } from './audio';
import { dispatchAndSave } from './flow';

export function PlayerBadge({ id }: { id: string }) {
  return <span className={`badge ${id}`}>{id.toUpperCase()}</span>;
}

export function Money({ value }: { value: number }) {
  return <span className="gold">${value.toLocaleString()}</span>;
}

export function XpBar({ player }: { player: PlayerState }) {
  const need = xpToNext(player.lv);
  return (
    <div>
      <div className="row small muted">
        <span>
          Lv {player.lv} · 经验 {Math.floor(player.xp)} / {need}
        </span>
      </div>
      <div className="bar">
        <i style={{ width: `${Math.min(100, (player.xp / need) * 100)}%` }} />
      </div>
    </div>
  );
}

/** Stat point allocation for one player. */
export function StatAllocator({ player }: { player: PlayerState }) {
  return (
    <div>
      <div className="row" style={{ marginBottom: 6 }}>
        <strong>属性</strong>
        <span className="spacer" />
        <span className={player.statPoints > 0 ? 'gold' : 'muted'}>可用点数 {player.statPoints}</span>
      </div>
      {(Object.keys(STAT_NAMES) as StatKey[]).map((k) => (
        <div className="stat-row" key={k}>
          <span>{STAT_NAMES[k]}</span>
          <strong>{player.stats[k]}</strong>
          <span className="small muted">{STAT_DESC[k]}</span>
          <button
            className="btn small secondary"
            disabled={player.statPoints <= 0}
            onClick={() => {
              audio.play('click');
              dispatchAndSave((r) => allocateStat(r, player.id, k));
            }}
          >
            +1
          </button>
        </div>
      ))}
    </div>
  );
}

export function TalentPicker({ player }: { player: PlayerState }) {
  const choices = player.talentChoices[0];
  if (!choices) return null;
  return (
    <div className="banner">
      <div style={{ marginBottom: 8 }}>
        <strong className="gold">选择一个天赋</strong>
        {player.talentChoices.length > 1 && <span className="muted small"> （还有 {player.talentChoices.length - 1} 次）</span>}
      </div>
      <div className="talent-pick">
        {choices.map((id: TalentId) => {
          const t = R.talents.get(id);
          return (
            <button
              key={id}
              className="card"
              style={{ cursor: 'pointer', textAlign: 'left' }}
              onClick={() => {
                audio.play('levelup');
                dispatchAndSave((r) => pickTalent(r, player.id, id));
              }}
            >
              <span className="name">{t.name}</span>
              <span className="desc">{t.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TalentList({ player }: { player: PlayerState }) {
  if (player.talents.length === 0) return <span className="muted small">暂无天赋（Lv5/10/15/20 解锁）</span>;
  return (
    <div className="row">
      {player.talents.map((t) => (
        <span key={t} className="badge" title={R.talents.get(t).desc}>
          {R.talents.get(t).name}
        </span>
      ))}
    </div>
  );
}

/** Small error toast that hides itself. */
export function useToast(): [ReactNode, (msg: string | null) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2200);
    return () => clearTimeout(t);
  }, [msg]);
  const show = (m: string | null) => {
    if (m) audio.play('error');
    setMsg(m);
  };
  return [msg ? <div className="toast">{msg}</div> : null, show];
}
