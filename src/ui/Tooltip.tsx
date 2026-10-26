import type { ReactNode } from 'react';

/** Shows `content` above (or below) the children on hover / keyboard focus. Pure CSS, no portal. */
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
  return (
    <span className={`tip-wrap ${block ? 'tip-block' : ''}`}>
      {children}
      <span className={`tip tip-${placement}`} role="tooltip">
        {content}
      </span>
    </span>
  );
}
