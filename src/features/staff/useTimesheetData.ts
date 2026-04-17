import { useLiveQuery } from '@electric-sql/pglite-react';
import { timesheetsCollection } from '../../lib/database';
import { Timesheet } from '../../types';

import { insertOfflineRecord, updateOfflineRecord } from '../../lib/offlineMutations';

export const useTimesheetData = (userId?: string) => {
  const query = userId 
    ? `SELECT * FROM timesheets WHERE user_id = $1 AND is_deleted = false ORDER BY date DESC;`
    : `SELECT * FROM timesheets WHERE is_deleted = false ORDER BY date DESC;`;
  const params = userId ? [userId] : [];
  const res = useLiveQuery(query, params);

  return {
    data: res?.rows || [],
    timesheets: res?.rows || [],
    isLoading: res === undefined,
    error: res?.error || null,
    
    // Mutations preserved for application functionality
    addTimesheet: async (entry: Partial<Timesheet>) => {
      return await insertOfflineRecord('timesheets', entry);
    },
    updateTimesheet: async (id: string, updates: Partial<Timesheet>) => {
      return await updateOfflineRecord('timesheets', id, updates);
    },
    deleteTimesheet: async (id: string) => {
      await timesheetsCollection.delete(id);
    }
  };
};
