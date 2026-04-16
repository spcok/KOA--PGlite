import { useMemo } from 'react';
import { useLiveQuery } from '@tanstack/react-db';
import { medicalLogsCollection, marChartsCollection, quarantineRecordsCollection } from '../../lib/database';
import { ClinicalNote, MARChart, QuarantineRecord } from '../../types';

export const useMedicalData = (animalId?: string) => {
  const query = animalId
    ? `SELECT * FROM medical_records WHERE animal_id = $1 AND is_deleted = false ORDER BY date DESC;`
    : `SELECT * FROM medical_records WHERE is_deleted = false ORDER BY date DESC;`;
  const params = animalId ? [animalId] : [];
  const res = useLiveQuery(query, params);

  const medicalRecords = useMemo(() => {
    return (res?.rows || []).map((r: any) => ({
      ...r,
      animalId: r.animal_id,
      createdAt: r.created_at
    }));
  }, [res?.rows]);

  // FIXME: Preserve other medical sub-collections here later
  return {
    clinicalNotes: medicalRecords, // Bridge to UI expectation
    marCharts: [], // Placeholder for now
    quarantineRecords: [], // Placeholder for now
    isLoading: res === undefined,
    isError: !!res?.error,
    error: res?.error || null,
    addClinicalNote: async (note: any) => { console.warn('Mutation Pending:', note); },
    updateClinicalNote: async (note: any) => { console.warn('Mutation Pending:', note); },
    addMarChart: async (chart: any) => { console.warn('Mutation Pending:', chart); },
    addQuarantineRecord: async (record: any) => { console.warn('Mutation Pending:', record); },
    updateQuarantineRecord: async (record: any) => { console.warn('Mutation Pending:', record); },
  };
};
