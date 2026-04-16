import { useLiveQuery } from '@electric-sql/pglite-react';
import { safetyDrillsCollection } from '../../lib/database';
import { SafetyDrill } from '../../types';

export const useSafetyDrillData = () => {
  const res = useLiveQuery(`SELECT * FROM safety_drills WHERE is_deleted = false ORDER BY date DESC;`);
  
  const drills = res?.rows || [];

  return {
    data: drills,
    drills,
    safetyDrills: drills,
    logs: drills,
    isLoading: res === undefined,
    error: res?.error || null,
    addDrill: async (drill: Partial<SafetyDrill>) => {
      await safetyDrillsCollection.insert({ ...drill, id: drill.id || crypto.randomUUID(), isDeleted: false } as SafetyDrill);
    },
    updateDrill: async (id: string, updates: Partial<SafetyDrill>) => {
      await safetyDrillsCollection.update(id, updates);
    },
    deleteDrill: async (id: string) => {
      await safetyDrillsCollection.delete(id);
    }
  };
};
