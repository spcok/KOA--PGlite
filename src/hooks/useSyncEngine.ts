import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { localDB, initLocalSchema } from '../lib/pglite';

export function useSyncEngine() {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const runSync = async () => {
      setIsSyncing(true);
      await initLocalSchema();

      // 1. Wait for Supabase Auth JWT to settle
      let session = null;
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) { session = data.session; break; }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!session) {
        console.warn('⚠️ [Sync] Aborting: No active session.');
        setIsSyncing(false);
        return;
      }

      console.log('🔄 [Sync] Auth Verified. Hydrating Core & Auth Data...');
      
      try {
        // Helper to safely fetch and insert data
        const syncTable = async (tableName: string, insertQuery: string, mapRow: (row: any) => any[]) => {
          // Some admin tables might not have is_deleted, so we fetch all if the filtered fetch fails
          let { data, error: fetchError } = await supabase.from(tableName).select('*').eq('is_deleted', false);
          if (fetchError) {
            const fallback = await supabase.from(tableName).select('*');
            data = fallback.data;
            if (fallback.error) console.warn(`Skipping ${tableName}:`, fallback.error);
          }
          
          if (data && data.length > 0) {
            await localDB.query('BEGIN;');
            for (const row of data) {
              try {
                await localDB.query(insertQuery, mapRow(row));
              } catch (e) {
                console.warn(`Row insert failed in ${tableName}:`, e);
              }
            }
            await localDB.query('COMMIT;');
          }
        };

        // 1. Core & Admin (7 Tables)
        await syncTable('users', `INSERT INTO users (id, name, email, role, initials, pin, job_position, signature_data, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, initials = EXCLUDED.initials, pin = EXCLUDED.pin;`, (r) => [r.id, r.name, r.email, r.role, r.initials, r.pin, r.job_position, r.signature_data, r.created_at]);
        await syncTable('operational_lists', `INSERT INTO operational_lists (id, category, type, value, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, false) ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;`, (r) => [r.id, r.category, r.type, r.value, r.created_at]);
        await syncTable('directory_contacts', `INSERT INTO directory_contacts (id, name, role, organization, phone, email, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone, email = EXCLUDED.email;`, (r) => [r.id, r.name, r.role, r.organization, r.phone, r.email, r.created_at]);
        await syncTable('organisations', `INSERT INTO organisations (id, org_name, address, contact_email, contact_phone, zla_license_number, logo_url, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO UPDATE SET org_name = EXCLUDED.org_name;`, (r) => [r.id, r.org_name, r.address, r.contact_email, r.contact_phone, r.zla_license_number, r.logo_url, r.created_at]);
        await syncTable('role_permissions', `INSERT INTO role_permissions (id, role, created_at, is_deleted) VALUES ($1, $2, $3, false) ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;`, (r) => [r.id, r.role, r.created_at]);
        await syncTable('zla_documents', `INSERT INTO zla_documents (id, category, name, file_url, upload_date, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, false) ON CONFLICT (id) DO UPDATE SET file_url = EXCLUDED.file_url;`, (r) => [r.id, r.category, r.name, r.file_url, r.upload_date, r.created_at]);
        await syncTable('bug_reports', `INSERT INTO bug_reports (id, user_name, role, message, url, is_online, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING;`, (r) => [r.id, r.user_name, r.role, r.message, r.url, r.is_online, r.created_at]);

        // 2. Animals & Dashboard (3 Tables)
        await syncTable('animals', `INSERT INTO animals (id, name, species, category, sex, location, image_url, hazard_rating, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, location = EXCLUDED.location;`, (r) => [r.id, r.name, r.species, r.category, r.sex, r.location, r.image_url, r.hazard_rating, r.created_at]);
        await syncTable('archived_animals', `INSERT INTO archived_animals (id, name, species, category, archive_reason, archive_type, archived_at, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false) ON CONFLICT (id) DO UPDATE SET archive_reason = EXCLUDED.archive_reason;`, (r) => [r.id, r.name, r.species, r.category, r.archive_reason, r.archive_type, r.archived_at, r.created_at]);
        await syncTable('tasks', `INSERT INTO tasks (id, title, type, assigned_to, due_date, completed, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, false) ON CONFLICT (id) DO UPDATE SET completed = EXCLUDED.completed;`, (r) => [r.id, r.title, r.type, r.assigned_to, r.due_date, r.completed || false, r.created_at]);

        // 3. Husbandry (2 Tables)
        await syncTable('daily_logs', `INSERT INTO daily_logs (id, animal_id, log_type, log_date, value, notes, user_initials, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false) ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, notes = EXCLUDED.notes;`, (r) => [r.id, r.animal_id, r.log_type, r.log_date, r.value, r.notes, r.user_initials, r.created_at]);
        await syncTable('daily_rounds', `INSERT INTO daily_rounds (id, section, shift, status, completed_by, completed_at, notes, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;`, (r) => [r.id, r.section, r.shift, r.status, r.completed_by, r.completed_at, r.notes, r.created_at]);

        // 4. Medical (4 Tables)
        await syncTable('medical_records', `INSERT INTO medical_records (id, animal_id, diagnosis, treatment_plan, note_type, date, staff_initials, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false) ON CONFLICT (id) DO UPDATE SET diagnosis = EXCLUDED.diagnosis;`, (r) => [r.id, r.animal_id, r.diagnosis, r.treatment_plan, r.note_type || r.type, r.date, r.staff_initials, r.created_at]);
        await syncTable('clinical_notes', `INSERT INTO clinical_notes (id, animal_id, type, notes, author, date, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, false) ON CONFLICT (id) DO UPDATE SET notes = EXCLUDED.notes;`, (r) => [r.id, r.animal_id, r.type, r.notes, r.author, r.date, r.created_at]);
        await syncTable('mar_charts', `INSERT INTO mar_charts (id, animal_id, medication, dosage, frequency, start_date, end_date, status, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;`, (r) => [r.id, r.animal_id, r.medication, r.dosage, r.frequency, r.start_date, r.end_date, r.status, r.created_at]);
        await syncTable('quarantine_records', `INSERT INTO quarantine_records (id, animal_id, start_date, end_date, reason, status, staff_initials, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;`, (r) => [r.id, r.animal_id, r.start_date, r.end_date, r.reason, r.status, r.staff_initials, r.created_at]);

        // 5. Safety & Facilities (4 Tables)
        await syncTable('incidents', `INSERT INTO incidents (id, type, severity, date, time, location, description, status, reported_by, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;`, (r) => [r.id, r.type, r.severity, r.date, r.time, r.location, r.description, r.status, r.reported_by, r.created_at]);
        await syncTable('first_aid_logs', `INSERT INTO first_aid_logs (id, date, time, type, person_name, location, description, treatment, outcome, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false) ON CONFLICT (id) DO UPDATE SET outcome = EXCLUDED.outcome;`, (r) => [r.id, r.date, r.time, r.type, r.person_name || r.personName, r.location, r.description, r.treatment, r.outcome, r.created_at]);
        await syncTable('maintenance_logs', `INSERT INTO maintenance_logs (id, task_type, enclosure_id, description, status, date_logged, date_completed, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;`, (r) => [r.id, r.task_type, r.enclosure_id, r.description, r.status, r.date_logged, r.date_completed, r.created_at]);
        await syncTable('safety_drills', `INSERT INTO safety_drills (id, title, location, date, status, description, priority, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;`, (r) => [r.id, r.title, r.location, r.date, r.status, r.description, r.priority, r.created_at]);

        // 6. Staff (3 Tables)
        await syncTable('timesheets', `INSERT INTO timesheets (id, staff_name, date, clock_in, clock_out, total_hours, status, notes, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false) ON CONFLICT (id) DO UPDATE SET clock_out = EXCLUDED.clock_out;`, (r) => [r.id, r.staff_name, r.date, r.clock_in, r.clock_out, r.total_hours, r.status, r.notes, r.created_at]);
        await syncTable('staff_rota', `INSERT INTO staff_rota (id, assigned_to, shift_type, date, notes, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, false) ON CONFLICT (id) DO UPDATE SET shift_type = EXCLUDED.shift_type;`, (r) => [r.id, r.assigned_to, r.shift_type, r.date, r.notes, r.created_at]);
        await syncTable('holidays', `INSERT INTO holidays (id, staff_name, leave_type, start_date, end_date, status, notes, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;`, (r) => [r.id, r.staff_name, r.leave_type, r.start_date, r.end_date, r.status, r.notes, r.created_at]);

        // 7. Logistics (2 Tables)
        await syncTable('internal_movements', `INSERT INTO internal_movements (id, animal_id, animal_name, movement_type, source_location, destination_location, log_date, notes, created_at, is_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false) ON CONFLICT (id) DO UPDATE SET destination_location = EXCLUDED.destination_location;`, (r) => [r.id, r.animal_id, r.animal_name, r.movement_type, r.source_location, r.destination_location, r.log_date, r.notes, r.created_at]);
        await syncTable('external_transfers', `INSERT INTO external_transfers (id, animal_id, animal_name, transfer_type, institution, date, transport_method, status, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;`, (r) => [r.id, r.animal_id, r.animal_name, r.transfer_type, r.institution, r.date, r.transport_method, r.status, r.notes, r.created_at]);

        console.log('✅ [Sync] Full 25-Table Database Hydration Complete.');
      } catch (err) {
        console.error('🛑 [Sync] Hydration failed:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    runSync();
  }, []);

  return { isSyncing };
}
