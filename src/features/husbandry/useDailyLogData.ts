import { useLiveQuery } from '@electric-sql/pglite-react';
import { useMemo } from 'react';

// Support optional animalId for the Animal Profile view
export const useDailyLogData = (viewDate?: string, activeTab?: string, animalId?: string) => {
  // 1. Fetching logic
  const animalsRes = useLiveQuery(`SELECT * FROM animals WHERE is_deleted = false ORDER BY name ASC;`);
  
  // If animalId is provided (Animal Profile), filter by it. Otherwise, get all for the dashboard.
  const logsQuery = animalId 
    ? `SELECT * FROM daily_logs WHERE animal_id = $1 AND is_deleted = false ORDER BY log_date DESC;`
    : `SELECT * FROM daily_logs WHERE is_deleted = false ORDER BY created_at DESC;`;
  const logsParams = animalId ? [animalId] : [];
  const logsRes = useLiveQuery(logsQuery, logsParams);

  const isEngineLoading = animalsRes === undefined || logsRes === undefined;
  
  // 2. The Bridge: Map snake_case (DB) to camelCase (UI)
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
      .filter((a: any) => a.category?.toUpperCase().includes(searchTarget))
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
