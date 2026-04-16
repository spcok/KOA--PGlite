import { useLiveQuery } from '@electric-sql/pglite-react';

export const useAnimalProfileData = (animalId: string) => {
  const res = useLiveQuery(`SELECT * FROM animals WHERE id = $1 LIMIT 1;`, [animalId]);
  
  const animal = res?.rows[0] ? {
    ...res.rows[0],
    imageUrl: res.rows[0].image_url || res.rows[0].imageUrl // Bridge snake_case to camelCase
  } : null;

  return {
    animal,
    isLoading: res === undefined,
    error: res?.error || null,
  };
};
