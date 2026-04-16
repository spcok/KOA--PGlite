import { useLiveQuery } from '@electric-sql/pglite-react';
import { useMemo } from 'react';

export const useMedicalData = (animalId?: string) => {
  // 1. Fetch Medical Records
  const query = animalId 
    ? `SELECT * FROM medical_records WHERE animal_id = $1 AND is_deleted = false ORDER BY date DESC;`
    : `SELECT * FROM medical_records WHERE is_deleted = false ORDER BY date DESC;`;
  const params = animalId ? [animalId] : [];
  const res = useLiveQuery(query, params);

  // 2. Fetch Animals (needed to populate log.animalName)
  const animalsRes = useLiveQuery(`SELECT id, name FROM animals WHERE is_deleted = false;`);

  const isLoading = res === undefined || animalsRes === undefined;

  // 3. Aggressive Component-Specific Mapping
  const clinicalNotes = useMemo(() => {
    const rawRecords = res?.rows || [];
    const animalLookup = new Map((animalsRes?.rows || []).map((a: any) => [a.id, a.name]));

    return rawRecords.map((r: any) => ({
      ...r,
      // Core mapping
      animalId: r.animal_id || r.animalId,
      date: r.date || r.record_date || r.created_at,
      
      // UI-Specific Mapping (aligning exactly with MedicalRecords.tsx expectations)
      animalName: animalLookup.get(r.animal_id) || 'Unknown Patient',
      noteType: r.type || r.record_type || 'Clinical Note',
      staffInitials: r.administered_by || r.user_initials || 'Sys',
      noteText: r.notes || r.note_text || '',
      
      // ClinicalPane specific mappings (if present in DB, otherwise safe fallbacks)
      prescribingVet: r.prescribing_vet || null,
      vitalsWeight: r.vitals_weight || null,
      diagnosis: r.diagnosis || null,
      treatmentPlan: r.treatment_plan || null,
      urgency: r.urgency || 'Routine'
    }));
  }, [res?.rows, animalsRes?.rows]);

  return {
    data: clinicalNotes,          // Standard legacy alias
    medicalRecords: clinicalNotes, // Standard legacy alias
    clinicalNotes,                // The exact alias the component asks for
    isLoading,
    isError: !!res?.error,
    error: res?.error || null,
    
    // Mutation placeholders to prevent crash if component calls them
    addMedicalRecord: async () => { console.warn('addMedicalRecord pending'); },
    updateMedicalRecord: async () => { console.warn('updateMedicalRecord pending'); },
    deleteMedicalRecord: async () => { console.warn('deleteMedicalRecord pending'); }
  };
};
