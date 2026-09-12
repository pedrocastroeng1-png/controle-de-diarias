import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function CenteredDialog({ children, labelId, onClose, className = 'z-[70]' }: { children: ReactNode; labelId: string; onClose: () => void; className?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const root = container.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const siblings = [...document.body.children].filter(el => el !== root && el instanceof HTMLElement) as HTMLElement[];
    const states = siblings.map(el => el.inert);
    siblings.forEach(el => { el.inert = true; });
    document.body.style.overflow = 'hidden';
    const focusable = () => [...root.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex]')].filter(el => !el.matches(':disabled') && el.tabIndex >= 0 && el.getClientRects().length > 0);
    (focusable()[0] ?? root).focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current(); }
      if (event.key === 'Tab') {
        const items = focusable(); const first = items[0]; const last = items.at(-1);
        if (!first) { event.preventDefault(); root.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === root)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    const focus = (event: FocusEvent) => { if (!root.contains(event.target as Node)) (focusable()[0] ?? root).focus(); };
    document.addEventListener('keydown', keyboard, true);
    document.addEventListener('focusin', focus);
    return () => {
      document.removeEventListener('keydown', keyboard, true);
      document.removeEventListener('focusin', focus);
      document.body.style.overflow = overflow;
      siblings.forEach((el, i) => { el.inert = states[i]; });
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return createPortal(<div ref={container} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={labelId}
    className={`fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm ${className}`}
    onMouseDown={e => { if (e.target === e.currentTarget) close.current(); }}>{children}</div>, document.body);
}
