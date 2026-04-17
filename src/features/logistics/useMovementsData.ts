import { useLiveQuery } from '@electric-sql/pglite-react';
import { insertOfflineRecord, updateOfflineRecord } from '../../lib/offlineMutations';

export const useMovementsData = () => {
  const res = useLiveQuery(`SELECT * FROM animal_movements WHERE is_deleted = false ORDER BY date DESC;`);

  return {
    data: res?.rows || [],
    movements: res?.rows || [],
    isLoading: res === undefined,
    error: res?.error || null,
    addMovement: async (movement: any) => {
        return await insertOfflineRecord('internal_movements', movement);
    },
    updateMovement: async (id: string, updates: any) => {
        return await updateOfflineRecord('internal_movements', id, updates);
    }
  };
};
