import { useLiveQuery } from '@electric-sql/pglite-react';
import { useMemo } from 'react';

export const useDashboardData = () => {
  // 1. Correct queries using verified column names (is_deleted, completed)
  const animalsRes = useLiveQuery(`SELECT id FROM animals WHERE is_deleted = false;`);
  const tasksRes = useLiveQuery(`SELECT id FROM tasks WHERE is_deleted = false AND completed = false;`);
  const alertsRes = useLiveQuery(`SELECT id FROM medical_records WHERE is_deleted = false AND note_type = 'Alert';`);
  const incidentsRes = useLiveQuery(`SELECT id FROM incidents WHERE is_deleted = false AND status != 'Resolved';`);
  
  const isLoading = animalsRes === undefined || tasksRes === undefined;

  const stats = useMemo(() => {
    // Ensure we have results before calculating
    if (!animalsRes?.rows || !tasksRes?.rows) {
      return { totalAnimals: 0, activeTasks: 0, medicalAlerts: 0, openIncidents: 0 };
    }

    return {
      totalAnimals: animalsRes.rows.length,
      activeTasks: tasksRes.rows.length,
      medicalAlerts: alertsRes?.rows?.length ?? 0,
      openIncidents: incidentsRes?.rows?.length ?? 0
    };
  }, [animalsRes, tasksRes, alertsRes, incidentsRes]);

  return { stats, isLoading, isError: false };
};
