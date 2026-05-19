import { scrollToSection } from './scrollToSection';

export type ExhibitorPortalNavTarget = 'dashboard' | 'profile' | 'catalogue' | 'orders' | 'registrations';

/** Scroll to dashboard or portal tab (profile, catalogue, orders, registrations). */
export function navigateExhibitorPortal(target: ExhibitorPortalNavTarget): void {
  if (target === 'dashboard') {
    scrollToSection('dashboard');
    return;
  }
  scrollToSection('portal');
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent('exhibitor-portal-select-tab', { detail: target }));
  }, 200);
}

export const EXHIBITOR_DASHBOARD_SUBMENU: { target: ExhibitorPortalNavTarget; label: string }[] = [
  { target: 'profile', label: 'My Profile' },
  { target: 'catalogue', label: 'My Catalogue' },
  { target: 'orders', label: 'Customer Orders' },
  { target: 'registrations', label: 'My Registrations' },
];
