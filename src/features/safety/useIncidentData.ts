import { useLiveQuery } from '@electric-sql/pglite-react';
import { insertOfflineRecord, updateOfflineRecord } from '../../lib/offlineMutations';

export const useIncidentData = () => {
  const res = useLiveQuery(`SELECT * FROM incidents WHERE is_deleted = false ORDER BY date DESC;`);

  const incidents = res?.rows || [];

  return {
    data: incidents,
    incidents,
    logs: incidents,
    isLoading: res === undefined,
    error: res?.error || null,
    addIncident: async (incident: any) => {
        return await insertOfflineRecord('incidents', incident);
    },
    updateIncident: async (id: string, updates: any) => {
        return await updateOfflineRecord('incidents', id, updates);
    },
    deleteIncident: async (id: string) => {
        return await updateOfflineRecord('incidents', id, { is_deleted: true });
    }
  };
};
