import { insertOfflineRecord, updateOfflineRecord } from '../../lib/offlineMutations';
export const useFirstAidData = () => {
  const res = useLiveQuery(`SELECT * FROM first_aid_logs WHERE is_deleted = false ORDER BY date DESC;`);
  const logs = res?.rows || [];
  return {
    data: logs,
    firstAidLogs: logs,
    isLoading: res === undefined,
    error: res?.error || null,
    addFirstAidRecord: async (record: any) => {
        return await insertOfflineRecord('first_aid_logs', record);
    },
    updateFirstAidRecord: async (id: string, updates: any) => {
        return await updateOfflineRecord('first_aid_logs', id, updates);
    }
  };
};
