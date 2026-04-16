import { useLiveQuery } from '@tanstack/react-db';
import { timesheetsCollection } from '../../lib/database';
import { Timesheet } from '../../types';

export const useTimesheetData = (staffName?: string) => {
  const query = staffName 
    ? `SELECT * FROM timesheets WHERE staff_name = $1 AND is_deleted = false ORDER BY date DESC;`
    : `SELECT * FROM timesheets WHERE is_deleted = false ORDER BY date DESC;`;
  const params = staffName ? [staffName] : [];
  const res = useLiveQuery(query, params);

  return {
    data: res?.rows || [],
    timesheets: res?.rows || [],
    logs: res?.rows || [],
    isLoading: res === undefined,
    error: res?.error || null,
    
    addTimesheet: async (entry: Partial<Timesheet>) => {
      await timesheetsCollection.insert({ ...entry, id: entry.id || crypto.randomUUID(), isDeleted: false } as Timesheet);
    },
    updateTimesheet: async (id: string, updates: Partial<Timesheet>) => {
      await timesheetsCollection.update(id, updates);
    },
    deleteTimesheet: async (id: string) => {
      await timesheetsCollection.delete(id);
    }
  };
};
