import { useLiveQuery } from '@electric-sql/pglite-react';
import { useMemo } from 'react';

export const useMedicalData = (animalId?: string) => {
  const query = animalId 
    ? `SELECT * FROM medical_records WHERE animal_id = $1 AND is_deleted = false ORDER BY date DESC;`
    : `SELECT * FROM medical_records WHERE is_deleted = false ORDER BY date DESC;`;
  const params = animalId ? [animalId] : [];
  
  const res = useLiveQuery(query, params);

  const medicalRecords = useMemo(() => {
    return (res?.rows || []).map((r: any) => ({
      ...r,
      // Aggressive camelCase bridging for UI compatibility
      animalId: r.animal_id || r.animalId,
      recordType: r.record_type || r.type || r.recordType,
      recordDate: r.record_date || r.date || r.recordDate,
      administeredBy: r.administered_by || r.administeredBy,
      createdAt: r.created_at || r.createdAt,
      updatedAt: r.updated_at || r.updatedAt
    }));
  }, [res?.rows]);

  return {
    data: medicalRecords,
    medicalRecords,
    isLoading: res === undefined,
    isError: !!res?.error,
    error: res?.error || null
  };
};
