import { useLiveQuery } from '@electric-sql/pglite-react';
import { useMemo, useEffect } from 'react';

export const useDashboardData = (activeTab: string, viewDate: string) => {
  // Use SELECT * to allow filtering in JS
  const animalsRes = useLiveQuery(`SELECT * FROM animals WHERE is_deleted = false OR is_deleted IS NULL;`);
  
  const isLoading = animalsRes === undefined;
  
  const filteredAnimals = useMemo(() => {
    if (!animalsRes?.rows) return [];
    return animalsRes.rows.filter((a: any) => {
        if (activeTab === 'ARCHIVED') return a.is_deleted === true;
        return a.category === activeTab && (a.is_deleted === false || a.is_deleted === null);
    });
  }, [animalsRes, activeTab]);

  return { 
    filteredAnimals,
    animalStats: { total: filteredAnimals.length },
    taskStats: { pendingTasks: [], pendingHealth: [] },
    isLoading,
    isError: false,
    sortOption: 'custom',
    setSortOption: () => {},
    cycleSort: () => {},
    isOrderLocked: true,
    toggleOrderLock: () => {}
  };
};