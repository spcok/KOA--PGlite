import { useMemo, useState } from 'react';
import { useLiveQuery } from '@electric-sql/pglite-react';

export const useDashboardData = (activeTab: string, viewDate: string) => {
  // 1. Fetch Raw SQL Data
  const animalsResult = useLiveQuery(`SELECT * FROM animals WHERE is_deleted = false ORDER BY name ASC;`) || {};
  const logsResult = useLiveQuery(`SELECT * FROM daily_logs ORDER BY created_at DESC LIMIT 100;`) || {};
  const tasksResult = useLiveQuery(`SELECT * FROM tasks WHERE completed = false ORDER BY due_date ASC;`) || {};

  // 2. Strict Loading State Guard
  const isEngineLoading = animalsResult.rows === undefined || tasksResult.rows === undefined;

  // 3. Guaranteed Safe Arrays
  const animals = animalsResult.rows || [];
  const logs = logsResult.rows || [];
  const tasks = tasksResult.rows || [];

  // 4. Component State
  const [filter, setFilter] = useState('All');
  const [logFilter, setLogFilter] = useState('All');
  const [sortOption, setSortOption] = useState('custom');
  const [isOrderLocked, toggleOrderLock] = useState(true);

  // 5. Strict Category & Sorting Adapter
  const filteredAnimals = useMemo(() => {
    // PREVENT CRASH: Do not attempt to process until the engine provides data
    if (isEngineLoading) return [];
    
    let processed = [...animals];

    // Map UI Tab to Supabase Block-Capital Enum
    if (activeTab && activeTab !== 'ARCHIVED' && activeTab !== 'all') {
      // "Owl" -> "OWL" -> "OWLS"
      const searchTarget = activeTab.toUpperCase().replace(/S$/, ''); 
      processed = processed.filter((a: any) => {
        if (!a.category) return false;
        return a.category.toUpperCase().includes(searchTarget);
      });
    }

    // Apply Sorting
    if (sortOption === 'alpha-asc') {
      processed.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortOption === 'alpha-desc') {
      processed.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortOption === 'location-asc') {
      processed.sort((a, b) => (a.location || '').localeCompare(b.location || ''));
    } else if (sortOption === 'location-desc') {
      processed.sort((a, b) => (b.location || '').localeCompare(a.location || ''));
    } else if (sortOption === 'custom') {
      processed.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }

    return processed;
  }, [animals, activeTab, sortOption, isEngineLoading]);

  // 6. Strict Metrics Adapter
  const animalStats = useMemo(() => {
    if (isEngineLoading) return { total: 0, weighed: 0, fed: 0 };
    
    // Calculate metrics from the logs array safely
    const weighedToday = logs.filter((l: any) => l.log_type === 'Weight' && l.log_date === viewDate).length;
    const fedToday = logs.filter((l: any) => l.log_type === 'Feeding' && l.log_date === viewDate).length;

    return { 
      total: animals.length, 
      weighed: weighedToday, 
      fed: fedToday 
    };
  }, [animals, logs, viewDate, isEngineLoading]);

  // 7. Output exactly what Dashboard.tsx expects
  return {
    filteredAnimals,
    animalStats,
    taskStats: { pendingTasks: tasks, pendingHealth: [] },
    isLoading: isEngineLoading,
    error: animalsResult.error || null,
    sortOption,
    setSortOption,
    isOrderLocked,
    toggleOrderLock,
    cycleSort: () => {},
    filter,
    setFilter,
    logFilter,
    setLogFilter
  };
};
