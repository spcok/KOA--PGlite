import { useLiveQuery } from '@tanstack/react-db';
import { maintenanceCollection } from '../../lib/database';
import { MaintenanceLog } from '../../types';

export const useMaintenanceData = () => {
  const res = useLiveQuery(`SELECT * FROM maintenance_logs WHERE is_deleted = false ORDER BY created_at DESC;`);
  
  const logs = useMemo(() => {
    return (res?.rows || []).map((l: any) => ({
      ...l,
      dateLogged: l.date_logged // Bridge to UI
    }));
  }, [res?.rows]);

  return {
    data: logs,
    maintenanceLogs: logs,
    maintenance: logs, // Preserving alias
    logs: logs, // Preserving alias
    isLoading: res === undefined,
    error: res?.error || null,
    addMaintenanceLog: async (log: Partial<MaintenanceLog>) => { /* ... existing ... */ },
    updateMaintenanceLog: async (id: string, updates: Partial<MaintenanceLog>) => { /* ... existing ... */ },
    deleteMaintenanceLog: async (id: string) => { /* ... existing ... */ }
  };
};
