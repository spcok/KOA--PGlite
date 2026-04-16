import { useLiveQuery } from '@electric-sql/pglite-react';
import { useMemo } from 'react';

export const useDailyLogData = (viewDate?: string, activeTab?: string, animalId?: string) => {
  // 1. Animals Query
  const animalsRes = useLiveQuery(`SELECT * FROM animals WHERE is_deleted = false ORDER BY name ASC;`);
  
  // 2. Dynamic Logs Query (Handles both Profile and Dashboard views)
  let logsQuery = `SELECT * FROM daily_logs WHERE is_deleted = false ORDER BY created_at DESC;`;
  let logsParams: any[] = [];

  if (animalId) {
    logsQuery = `SELECT * FROM daily_logs WHERE animal_id = $1 AND is_deleted = false ORDER BY log_date DESC;`;
    logsParams = [animalId];
  } else if (viewDate) {
    // THIS FIXES THE STATIC DATE BUG
    logsQuery = `SELECT * FROM daily_logs WHERE log_date = $1 AND is_deleted = false ORDER BY created_at DESC;`;
    logsParams = [viewDate];
  }

  const logsRes = useLiveQuery(logsQuery, logsParams);
  const isEngineLoading = animalsRes === undefined || logsRes === undefined;
  
  // 3. Snake_Case Bridge
  const dailyLogs = useMemo(() => {
    return (logsRes?.rows || []).map((log: any) => ({
      ...log,
      animalId: log.animal_id,
      logType: log.log_type,
      logDate: log.log_date,
      userInitials: log.user_initials
    }));
  }, [logsRes?.rows]);

  const animals = useMemo(() => {
    const raw = animalsRes?.rows || [];
    if (!activeTab || activeTab === 'all') {
      return raw.map((a: any) => ({ ...a, imageUrl: a.image_url }));
    }
    const searchTarget = activeTab.toUpperCase().replace(/S$/, '');
    return raw
      .filter((a: any) => a.category && a.category.toUpperCase().includes(searchTarget))
      .map((a: any) => ({ ...a, imageUrl: a.image_url }));
  }, [animalsRes?.rows, activeTab]);

  return {
    animals,
    dailyLogs,
    isLoading: isEngineLoading,
    addLogEntry: async () => {}, // Placeholders
    updateLogEntry: async () => {}
  };
};
