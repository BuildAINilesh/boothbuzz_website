import React, { createContext, useCallback, useContext, useState } from 'react';
import { scrollToSection } from '../utils/scrollToSection';

interface ExhibitorNavigationContextValue {
  pendingExhibitorId: string | null;
  openExhibitorById: (exhibitorId: string) => void;
  clearPendingExhibitor: () => void;
}

const ExhibitorNavigationContext = createContext<ExhibitorNavigationContextValue | null>(null);

export const ExhibitorNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingExhibitorId, setPendingExhibitorId] = useState<string | null>(null);

  const openExhibitorById = useCallback((exhibitorId: string) => {
    const id = exhibitorId?.trim();
    if (!id) return;
    setPendingExhibitorId(id);
    scrollToSection('exhibitors');
  }, []);

  const clearPendingExhibitor = useCallback(() => setPendingExhibitorId(null), []);

  const value = React.useMemo(
    () => ({ pendingExhibitorId, openExhibitorById, clearPendingExhibitor }),
    [pendingExhibitorId, openExhibitorById, clearPendingExhibitor]
  );

  return (
    <ExhibitorNavigationContext.Provider value={value}>{children}</ExhibitorNavigationContext.Provider>
  );
};

export function useExhibitorNavigation() {
  const ctx = useContext(ExhibitorNavigationContext);
  if (!ctx) {
    throw new Error('useExhibitorNavigation must be used within ExhibitorNavigationProvider');
  }
  return ctx;
}
