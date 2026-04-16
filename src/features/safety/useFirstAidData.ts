import { useLiveQuery } from '@electric-sql/pglite-react';
export const useFirstAidData = () => {
  const res = useLiveQuery(`SELECT * FROM first_aid_logs WHERE is_deleted = false ORDER BY date DESC;`);
  const logs = res?.rows || [];
  return {
    data: logs,
    firstAidLogs: logs,
    isLoading: res === undefined,
    error: res?.error || null
  };
};
