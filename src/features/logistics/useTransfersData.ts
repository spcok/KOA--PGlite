import { useLiveQuery } from '@electric-sql/pglite-react';
import { insertOfflineRecord, updateOfflineRecord } from '../../lib/offlineMutations';

export const useTransfersData = () => {
  const res = useLiveQuery(`SELECT * FROM animal_transfers WHERE is_deleted = false ORDER BY date DESC;`);

  return {
    data: res?.rows || [],
    transfers: res?.rows || [],
    isLoading: res === undefined,
    error: res?.error || null,
    addTransfer: async (transfer: any) => {
        return await insertOfflineRecord('external_transfers', transfer);
    },
    updateTransfer: async (id: string, updates: any) => {
        return await updateOfflineRecord('external_transfers', id, updates);
    },
    deleteTransfer: async (id: string) => {
      // Keep legacy for now as requested
      await transfersCollection.delete(id);
    }
  };
};
