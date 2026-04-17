import { useLiveQuery } from '@electric-sql/pglite-react';
import { rotaCollection } from '../../lib/database';
import { RotaShift } from '../../types';

import { insertOfflineRecord, updateOfflineRecord } from '../../lib/offlineMutations';

export const useRotaData = (dateRange?: { start: Date; end: Date }) => {
  const res = useLiveQuery(`SELECT * FROM staff_rota WHERE is_deleted = false ORDER BY start_time ASC;`);
  
  return {
    data: res?.rows || [],
    shifts: res?.rows || [],
    isLoading: res === undefined,
    error: res?.error || null,
    
    // Mutation functions preserved (as per previous phase implementation)
    addShift: async (shift: Partial<RotaShift>) => {
      return await insertOfflineRecord('staff_rota', shift);
    },
    updateShift: async (id: string, updates: Partial<RotaShift>) => {
      return await updateOfflineRecord('staff_rota', id, updates);
    },
    deleteShift: async (id: string) => {
      await rotaCollection.delete(id);
    }
  };
};
