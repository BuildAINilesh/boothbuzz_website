import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  EXHIBITOR_DASHBOARD_SUBMENU,
  navigateExhibitorPortal,
  type ExhibitorPortalNavTarget,
} from '../utils/exhibitorPortalNav';

type ExhibitorDashboardNavProps = {
  variant: 'desktop' | 'mobile';
  onNavigate?: () => void;
};

const DESKTOP_MENU_ITEMS: { target: ExhibitorPortalNavTarget; label: string }[] = [
  { target: 'dashboard', label: 'Dashboard overview' },
  ...EXHIBITOR_DASHBOARD_SUBMENU,
];

export const ExhibitorDashboardNav: React.FC<ExhibitorDashboardNavProps> = ({ variant, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelScheduledClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelScheduledClose();
    closeTimerRef.current = setTimeout(() => setOpen(false), 280);
  };

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  useEffect(() => () => cancelScheduledClose(), []);

  const go = (target: ExhibitorPortalNavTarget) => {
    navigateExhibitorPortal(target);
    setOpen(false);
    onNavigate?.();
  };

  if (variant === 'mobile') {
    return (
      <div ref={rootRef} className="mt-2 space-y-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary flex items-center justify-center gap-1.5"
          aria-expanded={open}
          aria-haspopup="true"
        >
          My Dashboard
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low/80 overflow-hidden">
            {DESKTOP_MENU_ITEMS.map((item, i) => (
              <button
                key={item.target}
                type="button"
                onClick={() => go(item.target)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-container-lowest ${
                  i === 0
                    ? 'font-semibold text-on-surface border-b border-outline-variant/10'
                    : 'font-medium text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative hidden sm:block"
      onMouseEnter={() => {
        cancelScheduledClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          cancelScheduledClose();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold font-headline text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
        aria-expanded={open}
        aria-haspopup="true"
      >
        My Dashboard
        <ChevronDown
          className={`h-4 w-4 opacity-90 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-[60] min-w-[14rem] pt-1"
          onMouseEnter={cancelScheduledClose}
          onMouseLeave={scheduleClose}
        >
          {/* Invisible bridge so moving from button to menu does not close the dropdown */}
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest py-1 shadow-xl shadow-black/10" role="menu">
            {DESKTOP_MENU_ITEMS.map((item, i) => (
              <button
                key={item.target}
                type="button"
                role="menuitem"
                onClick={() => go(item.target)}
                className={`block w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-surface-container-low/80 ${
                  i === 0
                    ? 'font-semibold text-on-surface border-b border-outline-variant/10'
                    : 'font-medium text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
