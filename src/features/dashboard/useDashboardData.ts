import { useLiveQuery } from '@electric-sql/pglite-react';
import { useMemo, useEffect } from 'react';

export const useDashboardData = () => {
  const animalsRes = useLiveQuery(`SELECT id FROM animals WHERE is_deleted = false;`);
  
  // FIXED: Changed "status" to "completed" to match your actual schema
  const tasksRes = useLiveQuery(`SELECT id FROM tasks WHERE is_deleted = false AND completed = false;`);
  
  const alertsRes = useLiveQuery(`SELECT id FROM medical_records WHERE is_deleted = false AND note_type = 'Alert';`);
  const incidentsRes = useLiveQuery(`SELECT id FROM incidents WHERE is_deleted = false AND status != 'Resolved';`);
  
  // Log any hidden SQL errors to the console
  useEffect(() => {
    if (animalsRes?.error) console.error("Dashboard Error (Animals):", animalsRes.error);
    if (tasksRes?.error) console.error("Dashboard Error (Tasks):", tasksRes.error);
    if (alertsRes?.error) console.error("Dashboard Error (Alerts):", alertsRes.error);
    if (incidentsRes?.error) console.error("Dashboard Error (Incidents):", incidentsRes.error);
  }, [animalsRes, tasksRes, alertsRes, incidentsRes]);

  // Relaxed Boot Guard: Only show loading if ALL queries are undefined
  const isLoading = animalsRes === undefined && tasksRes === undefined && alertsRes === undefined && incidentsRes === undefined;

  const stats = useMemo(() => {
    return {
      totalAnimals: animalsRes?.rows?.length ?? 0,
      activeTasks: tasksRes?.rows?.length ?? 0,
      medicalAlerts: alertsRes?.rows?.length ?? 0,
      openIncidents: incidentsRes?.rows?.length ?? 0
    };
  }, [animalsRes, tasksRes, alertsRes, incidentsRes]);

  return { stats, isLoading, isError: false };
};