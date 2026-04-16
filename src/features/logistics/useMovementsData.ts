import { useLiveQuery } from '@tanstack/react-db';
import { movementsCollection } from '../../lib/database';

export const useMovementsData = () => {
  const res = useLiveQuery(`SELECT * FROM animal_movements WHERE is_deleted = false ORDER BY date DESC;`);

  return {
    data: res?.rows || [],
    movements: res?.rows || [],
    isLoading: res === undefined,
    error: res?.error || null,
    addMovement: async (movement: any) => {
      await movementsCollection.insert({ ...movement, id: movement.id || crypto.randomUUID(), isDeleted: false });
    }
  };
};
