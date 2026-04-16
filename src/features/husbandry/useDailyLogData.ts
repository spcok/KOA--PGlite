import { useLiveQuery } from '@electric-sql/pglite-react';
import { useMemo } from 'react';

export const useDailyLogData = (viewDate: string, activeTab: string) => {
  // 1. Fetch BOTH tables required by the DailyLog UI
  const animalsRes = useLiveQuery(`SELECT * FROM animals WHERE is_deleted = false ORDER BY name ASC;`);
  const logsRes = useLiveQuery(`SELECT * FROM daily_logs ORDER BY created_at DESC;`);

  const isEngineLoading = animalsRes === undefined || logsRes === undefined;
  const rawAnimals = animalsRes?.rows || [];
  const safeLogs = logsRes?.rows || [];

  // THE FIX: Filter animals exactly like we did in the Dashboard to prevent UI row mismatches
  const safeAnimals = useMemo(() => {
    if (activeTab === 'all' || !activeTab) {
      return rawAnimals.map((a: any) => ({ ...a, imageUrl: a.image_url || a.imageUrl }));
    }
    const searchTarget = activeTab.toUpperCase().replace(/S$/, '');
    return rawAnimals
      .filter((a: any) => {
        if (!a.category) return false;
        return a.category.toUpperCase().includes(searchTarget);
      })
      .map((a: any) => ({
        ...a,
        imageUrl: a.image_url || a.imageUrl // Bridges PGlite snake_case to UI camelCase
      }));
  }, [rawAnimals, activeTab]);

  // 3. Mutation Placeholders (Prevents component crash when destructuring/saving)
  const addLogEntry = async (entry: any) => { 
    console.warn('Mutation Pending:', entry); 
  };
  const updateLogEntry = async (id: string, entry: any) => { 
    console.warn('Mutation Pending:', id, entry); 
  };

  // 4. Return EXACTLY what DailyLog.tsx is asking for
  return {
    animals: safeAnimals,
    dailyLogs: safeLogs,
    isLoading: isEngineLoading,
    addLogEntry,
    updateLogEntry
  };
};
