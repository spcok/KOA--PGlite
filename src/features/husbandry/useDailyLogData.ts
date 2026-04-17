import { useLiveQuery } from '@electric-sql/pglite-react';
import { useMemo } from 'react';
import { localDB } from '../../lib/pglite';

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
    if (!logsRes?.rows) return []; // Guard against initialization phase
    return logsRes.rows.map((log: any) => ({
      ...log,
      animalId: log.animal_id,
      logType: log.log_type,
      logDate: log.log_date,
      userInitials: log.user_initials
    }));
  }, [logsRes?.rows]);

  const animals = useMemo(() => {
    if (!animalsRes?.rows) return []; // Guard against initialization phase
    const raw = animalsRes.rows;
    if (!activeTab || activeTab === 'all') {
      return raw.map((a: any) => ({ ...a, imageUrl: a.image_url }));
    }
    const searchTarget = activeTab.toUpperCase().replace(/S$/, '');
    return raw
      .filter((a: any) => a.category && a.category.toUpperCase().includes(searchTarget))
      .map((a: any) => ({ ...a, imageUrl: a.image_url }));
  }, [animalsRes?.rows, activeTab]);

  // 4. Reactive Mutations (Offline Writes)
  const addLogEntry = async (entry: any) => {
    try {
      const id = entry.id || crypto.randomUUID();
      const now = new Date().toISOString();
      
      await localDB.query(
        `INSERT INTO daily_logs 
        (id, animal_id, log_type, log_date, value, notes, user_initials, created_at, updated_at, is_deleted) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false);`,
        [
          id,
          entry.animalId,
          entry.logType,
          entry.logDate || now,
          entry.value || null,
          entry.notes || null,
          entry.userInitials || 'UNK',
          now,
          now
        ]
      );
      console.log('✅ [PGlite] Local insert successful:', id);
    } catch (error) {
      console.error('❌ [PGlite] Insert failed:', error);
      throw error;
    }
  };

  const updateLogEntry = async (id: string, entry: any) => {
    try {
      const now = new Date().toISOString();
      await localDB.query(
        `UPDATE daily_logs SET 
          log_type = COALESCE($1, log_type),
          value = COALESCE($2, value),
          notes = COALESCE($3, notes),
          updated_at = $4
        WHERE id = $5;`,
        [entry.logType, entry.value, entry.notes, now, id]
      );
      console.log('✅ [PGlite] Local update successful:', id);
    } catch (error) {
      console.error('❌ [PGlite] Update failed:', error);
      throw error;
    }
  };

  return {
    animals,
    dailyLogs,
    isLoading: isEngineLoading,
    addLogEntry,
    updateLogEntry
  };
};
