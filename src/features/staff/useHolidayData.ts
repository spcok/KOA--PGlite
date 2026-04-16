import { useLiveQuery } from '@electric-sql/pglite-react';
import { holidaysCollection } from '../../lib/database';
import { Holiday } from '../../types';

export const useHolidayData = () => {
  const res = useLiveQuery(`SELECT * FROM holidays WHERE is_deleted = false ORDER BY start_date ASC;`);
  
  return {
    data: res?.rows || [],
    holidays: res?.rows || [],
    isLoading: res === undefined,
    error: res?.error || null,
    
    // Mutation functions preserved (as per previous phase implementation)
    addHoliday: async (holiday: Partial<Holiday>) => {
      await holidaysCollection.insert({ ...holiday, id: holiday.id || crypto.randomUUID(), isDeleted: false } as Holiday);
    },
    updateHoliday: async (id: string, updates: Partial<Holiday>) => {
      await holidaysCollection.update(id, updates);
    },
    deleteHoliday: async (id: string) => {
      await holidaysCollection.delete(id);
    }
  };
};
