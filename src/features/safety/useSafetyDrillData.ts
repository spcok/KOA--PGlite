import { useLiveQuery } from '@electric-sql/pglite-react';
import { insertOfflineRecord, updateOfflineRecord } from '../../lib/offlineMutations';

export const useSafetyDrillData = () => {
  const res = useLiveQuery(`SELECT * FROM safety_drills WHERE is_deleted = false ORDER BY date DESC;`);
  
  const drills = res?.rows || [];

  return {
    data: drills,
    drills,
    safetyDrills: drills,
    logs: drills,
    isLoading: res === undefined,
    error: res?.error || null,
    addSafetyDrill: async (drill: any) => {
        return await insertOfflineRecord('safety_drills', drill);
    },
    updateSafetyDrill: async (id: string, updates: any) => {
        return await updateOfflineRecord('safety_drills', id, updates);
    }
  };
};
