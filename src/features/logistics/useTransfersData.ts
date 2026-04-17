import { useLiveQuery } from '@electric-sql/pglite-react';
import { transfersCollection } from '../../lib/database';

export const useTransfersData = () => {
  const res = useLiveQuery(`SELECT * FROM animal_transfers WHERE is_deleted = false ORDER BY date DESC;`);

  return {
    data: res?.rows || [],
    transfers: res?.rows || [],
    isLoading: res === undefined,
    error: res?.error || null,
    addTransfer: async (transfer: any) => {
      await transfersCollection.insert({ ...transfer, id: transfer.id || crypto.randomUUID(), isDeleted: false });
    },
    updateTransfer: async (transfer: any) => {
      await transfersCollection.update(transfer.id, transfer);
    },
    deleteTransfer: async (id: string) => {
      await transfersCollection.delete(id);
    }
  };
};
