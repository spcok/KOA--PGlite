import { useLiveQuery } from '@electric-sql/pglite-react';
import { useMemo } from 'react';

export const useDashboardData = () => {
  // 1. Fetch the physical counts needed for the Dashboard widgets
  const animalsRes = useLiveQuery(`SELECT id FROM animals WHERE is_deleted = false;`);
  const tasksRes = useLiveQuery(`SELECT id FROM tasks WHERE is_deleted = false AND (status IS NULL OR status != 'Completed');`);
  
  // Documentation Check: res is undefined during initialization
  const isLoading = animalsRes === undefined || tasksRes === undefined;

    const stats = useMemo(() => {
        // GUARD ADDED HERE: Return empty stats if engine is still booting
        if (animalsRes === undefined || tasksRes === undefined) {
          return { totalAnimals: 0, activeTasks: 0, medicalAlerts: 0, openIncidents: 0 };
        }
        return {
          totalAnimals: animalsRes?.rows?.length ?? 0,
          activeTasks: tasksRes?.rows?.length ?? 0,
          medicalAlerts: 0, // Placeholder until sync is restored
          openIncidents: 0
        };
      }, [animalsRes, tasksRes]);

  return { stats, isLoading, isError: false };
};
