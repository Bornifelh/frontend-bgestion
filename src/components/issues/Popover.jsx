import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Lightweight dropdown rendered in a portal (so table overflow never clips it).
 * `trigger` receives { open, toggle, ref }; children receive { close }.
 */
export default function Popover({ trigger, children, width = 240, align = 'left', disabled = false }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const anchorRef = useRef(null);
  const panelRef = useRef(null);

  const close = () => setOpen(false);
  const toggle = (e) => {
    e?.stopPropagation();
    if (!disabled) setOpen((o) => !o);
  };

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const place = () => {
      const r = anchorRef.current.getBoundingClientRect();
      const left = align === 'right' ? r.right - width : r.left;
      const maxLeft = window.innerWidth - width - 8;
      const below = window.innerHeight - r.bottom;
      const top = below < 280 && r.top > below ? null : r.bottom + 4;
      setPos({
        left: Math.max(8, Math.min(left, maxLeft)),
        top,
        bottom: top === null ? window.innerHeight - r.top + 4 : null,
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, align, width]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      {trigger({ open, toggle, ref: anchorRef })}
      {open && pos &&
        createPortal(
          <div
            ref={panelRef}
            data-popover-open=""
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-[1000] rounded-md border border-[#DFE1E6] bg-white py-1 shadow-[0_8px_16px_-4px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)]"
            style={{ left: pos.left, top: pos.top ?? undefined, bottom: pos.bottom ?? undefined, width }}
          >
            {typeof children === 'function' ? children({ close }) : children}
          </div>,
          document.body
        )}
    </>
  );
}

export function MenuItem({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[#172B4D] hover:bg-[#F1F2F4] ${
        selected ? 'bg-[#E9F2FF] shadow-[inset_2px_0_0_#0C66E4]' : ''
      }`}
    >
      {children}
    </button>
  );
}
