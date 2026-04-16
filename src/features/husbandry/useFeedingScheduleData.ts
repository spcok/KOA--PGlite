import { useLiveQuery } from '@electric-sql/pglite-react';
import { dailyLogsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { LogEntry, LogType } from '../../types';
import { mapToCamelCase } from '../../lib/dataMapping';

export const useFeedingScheduleData = () => {
  const res = useLiveQuery(`SELECT * FROM daily_logs WHERE log_type = 'Feeding' ORDER BY created_at DESC;`);

  return {
    data: res?.rows || [],
    isLoading: res === undefined,
    isError: !!res?.error,
    error: res?.error || null,
  };
};
