import { useLiveQuery } from '@electric-sql/pglite-react';
import { useMemo } from 'react';

export const useDashboardData = () => {
  // 1. Correct queries using verified column names
  const animalsRes = useLiveQuery(`SELECT id FROM animals WHERE is_deleted = false;`);
  const tasksRes = useLiveQuery(`SELECT id FROM tasks WHERE is_deleted = false AND completed = false;`);
  const alertsRes = useLiveQuery(`SELECT id FROM medical_records WHERE is_deleted = false AND note_type = 'Alert';`);
  const incidentsRes = useLiveQuery(`SELECT id FROM incidents WHERE is_deleted = false AND status != 'Resolved';`);
  
  // 2. Release the lock only when all queries successfully execute
  const isLoading = animalsRes === undefined || tasksRes === undefined || alertsRes === undefined || incidentsRes === undefined;

  const stats = useMemo(() => {
    if (isLoading) {
      return { totalAnimals: 0, activeTasks: 0, medicalAlerts: 0, openIncidents: 0 };
    }

    return {
      totalAnimals: animalsRes?.rows?.length ?? 0,
      activeTasks: tasksRes?.rows?.length ?? 0,
      medicalAlerts: alertsRes?.rows?.length ?? 0,
      openIncidents: incidentsRes?.rows?.length ?? 0
    };
  }, [animalsRes, tasksRes, alertsRes, incidentsRes, isLoading]);

  return { stats, isLoading, isError: false };
};