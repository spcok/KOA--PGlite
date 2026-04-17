import { useLiveQuery } from '@electric-sql/pglite-react';
import { useMemo } from 'react';
import { insertOfflineRecord, updateOfflineRecord } from '../../lib/offlineMutations';

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
    addMaintenanceLog: async (log: any) => {
        return await insertOfflineRecord('maintenance_logs', log);
    },
    updateMaintenanceLog: async (id: string, updates: any) => {
        return await updateOfflineRecord('maintenance_logs', id, updates);
    }
  };
};
