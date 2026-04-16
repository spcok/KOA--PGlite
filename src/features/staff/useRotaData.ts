import { useLiveQuery } from '@tanstack/react-db';
import { rotaCollection } from '../../lib/database';
import { RotaShift } from '../../types';

export const useRotaData = (dateRange?: { start: Date; end: Date }) => {
  const res = useLiveQuery(`SELECT * FROM staff_rota WHERE is_deleted = false ORDER BY start_time ASC;`);
  
  return {
    data: res?.rows || [],
    shifts: res?.rows || [],
    isLoading: res === undefined,
    error: res?.error || null,
    
    addShift: async (shift: Partial<RotaShift>) => {
      await rotaCollection.insert({ ...shift, id: shift.id || crypto.randomUUID(), isDeleted: false } as RotaShift);
    },
    updateShift: async (id: string, updates: Partial<RotaShift>) => {
      await rotaCollection.update(id, updates);
    },
    deleteShift: async (id: string) => {
      await rotaCollection.delete(id);
    }
  };
};
