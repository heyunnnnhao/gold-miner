import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const GAP = 10;
const MARGIN = 8;

/**
 * Bubble rendered into document.body with fixed positioning, so no panel, card or
 * stacking context can cover it. Flips above/below and clamps to the viewport.
 */
function Bubble({
  anchor,
  placement,
  children,
}: {
  anchor: DOMRect;
  placement: 'top' | 'bottom';
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const fitsAbove = anchor.top - GAP - height >= MARGIN;
    const fitsBelow = anchor.bottom + GAP + height <= window.innerHeight - MARGIN;
    const above = placement === 'top' ? fitsAbove || !fitsBelow : !fitsBelow && fitsAbove;
    const top = above ? anchor.top - GAP - height : anchor.bottom + GAP;
    const left = Math.min(
      Math.max(anchor.left + anchor.width / 2 - width / 2, MARGIN),
      window.innerWidth - width - MARGIN,
    );
    setPos({ left, top: Math.max(MARGIN, top) });
  }, [anchor, placement]);

  return createPortal(
    <div
      ref={ref}
      className={`tip ${pos ? 'shown' : ''}`}
      role="tooltip"
      style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: -9999 }}
    >
      {children}
    </div>,
    document.body,
  );
}

/** Shows `content` next to the children on hover / keyboard focus. */
export function Tip({
  content,
  children,
  block = false,
  placement = 'top',
}: {
  content: ReactNode;
  children: ReactNode;
  block?: boolean;
  placement?: 'top' | 'bottom';
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const show = () => ref.current && setAnchor(ref.current.getBoundingClientRect());
  const hide = () => setAnchor(null);

  // a scrolled or resized page would leave the bubble floating in the wrong place
  useEffect(() => {
    if (!anchor) return;
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [anchor]);

  return (
    <span
      ref={ref}
      className={`tip-wrap ${block ? 'tip-block' : ''}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {anchor && (
        <Bubble anchor={anchor} placement={placement}>
          {content}
        </Bubble>
      )}
    </span>
  );
}
