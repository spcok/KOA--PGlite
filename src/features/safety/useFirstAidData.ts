import { useLiveQuery } from '@electric-sql/pglite-react';

export const useFirstAidData = () => {
  const res = useLiveQuery(`SELECT * FROM first_aid_logs WHERE is_deleted = false ORDER BY date DESC;`);
  
  return {
    data: res?.rows || [],
    firstAidLogs: res?.rows || [],
    isLoading: res === undefined,
    error: res?.error || null
  };
};
