import { useLiveQuery } from '@electric-sql/pglite-react';
import { animalsCollection } from '../../lib/database';
import { Animal } from '../../types';

export const useAnimalsData = () => {
  const res = useLiveQuery(`SELECT * FROM animals WHERE is_deleted = false ORDER BY name ASC;`);
  
  const animals = (res?.rows || []).filter((animal: any) => !animal.is_deleted && !animal.archived);

  return {
    data: res?.rows || [],
    animals: animals,
    isLoading: res === undefined,
    isError: !!res?.error,
    error: res?.error || null,
    addAnimal: async (animal: Omit<Animal, 'id'>) => {
      await animalsCollection.insert({ ...animal, id: crypto.randomUUID(), isDeleted: false });
    },
    updateAnimal: async (animal: Animal) => {
      await animalsCollection.update(animal.id, animal);
    }
  };
};
