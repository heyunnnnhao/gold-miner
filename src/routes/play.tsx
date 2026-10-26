import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useSelector } from '@tanstack/react-store';
import { useEffect, useRef, type PointerEvent } from 'react';
import type { Action } from '@/config/keys';
import { GameHost } from '@/game/host';
import { finishLevel } from '@/game/run';
import { deleteSave, saveRun } from '@/persistence/queries';
import { attachBridge } from '@/stores/bridge';
import { getRun, runStore, setRun } from '@/stores/run';
import { patchSessionView, sessionStore } from '@/stores/session';
import { settingsStore } from '@/stores/settings';
import { audio } from '@/ui/audio';
import { requirePhase } from '@/ui/flow';
import { useIsPc } from '@/ui/device';
import { Hud } from '@/ui/Hud';

export const Route = createFileRoute('/play')({
  beforeLoad: requirePhase('level'),
  component: PlayPage,
});

declare global {
  interface Window {
    __gm?: { host: GameHost; addGold(n: number): void; end(): void };
  }
}

function PlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<GameHost | null>(null);
  const navigate = useNavigate();
  const paused = useSelector(sessionStore, (s) => s.paused);
  const timeUp = useSelector(sessionStore, (s) => s.timeUp);
  const wallet = useSelector(runStore, (r) => r?.wallet ?? 0);
  const target = useSelector(sessionStore, (s) => s.target);
  const passed = wallet >= target;
  const pc = useIsPc();

  useEffect(() => {
    const run = getRun();
    const canvas = canvasRef.current;
    if (!run || !canvas) return;
    let bridge: ReturnType<typeof attachBridge> | null = null;

    const host = new GameHost({
      canvas,
      run,
      keymap: settingsStore.state.keymap,
      onSession(s) {
        bridge = attachBridge(s);
        s.events.on('sfx', (e) => audio.play(e.name));
        s.events.on('level:end', () => {
          patchSessionView({ timeUp: true, paused: false });
          audio.play('timeup');
        });
      },
      onFrame: () => bridge?.flush(),
      onPauseChange: (p) => patchSessionView({ paused: p }),
      onEnd(s) {
        const current = getRun();
        if (!current || !s.result) return;
        bridge?.flush();
        const next = finishLevel(current, s.econ, s.result);
        setRun(next);
        if (next.phase === 'over') {
          void deleteSave();
          void navigate({ to: '/game-over' });
        } else {
          void saveRun(next);
          void navigate({ to: '/result' });
        }
      },
    });
    hostRef.current = host;
    host.start();
    const unsubKeys = settingsStore.subscribe((st) => host.setKeymap(st.keymap));

    if (import.meta.env.DEV) {
      window.__gm = { host, addGold: (n) => host.session.addGold(n), end: () => host.forceEnd() };
    }

    return () => {
      host.destroy();
      bridge?.detach();
      unsubKeys.unsubscribe();
      hostRef.current = null;
      patchSessionView({ active: false, paused: false, timeUp: false });
      if (window.__gm?.host === host) delete window.__gm;
    };
  }, [navigate]);

  const press = (a: Action) => hostRef.current?.press(a);

  /** Touch devices only: tapping the left half drops P1's hook, the right half P2's (solo: anywhere). */
  const tapField = (e: PointerEvent<HTMLDivElement>) => {
    const { paused: isPaused, timeUp: isOver } = sessionStore.state;
    const host = hostRef.current;
    if (!host || isPaused || isOver) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const right = e.clientX - rect.left > rect.width / 2;
    host.press(host.session.players.length > 1 && right ? 'p2.drop' : 'p1.drop');
  };

  const quit = () => {
    hostRef.current?.destroy();
    void navigate({ to: '/' });
  };

  return (
    <div className="play-root">
      <div className="rotate-hint">横屏体验更佳 ↻</div>
      <div className="frame" onPointerDown={pc ? undefined : tapField}>
        <canvas ref={canvasRef} />
        <Hud press={press} />
        {timeUp && (
          <div className="overlay" style={{ background: 'rgba(10,5,2,0.35)' }}>
            <div className={`timeup ${passed ? '' : 'fail'}`}>{passed ? '过关！' : '时间到'}</div>
          </div>
        )}
        {paused && !timeUp && (
          <div className="overlay">
            <div className="panel">
              <h2>暂停</h2>
              <button className="btn" onClick={() => hostRef.current?.setPaused(false)}>
                继续 (Esc)
              </button>
              <button className="btn secondary" onClick={quit}>
                返回菜单（本关进度不保存）
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
