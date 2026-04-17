import { PGlite } from '@electric-sql/pglite';
import { live } from '@electric-sql/pglite/live';

export const localDB = new PGlite('idb://koa-pglite-master', {
  extensions: { live },
});

export const initLocalSchema = async () => {
  try {
    console.log('🐘 [Database] Initializing PGlite Schema...');
    await localDB.exec(`
      BEGIN;
      -- Core & Admin
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, email TEXT NOT NULL, role TEXT, initials TEXT NOT NULL, pin TEXT, job_position TEXT, signature_data TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS operational_lists (id UUID PRIMARY KEY, category TEXT, type TEXT, value TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS directory_contacts (id UUID PRIMARY KEY, name TEXT, role TEXT, organization TEXT, phone TEXT, email TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS organisations (id TEXT PRIMARY KEY, org_name TEXT, address TEXT, contact_email TEXT, contact_phone TEXT, zla_license_number TEXT, logo_url TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS role_permissions (id UUID PRIMARY KEY, role TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS zla_documents (id UUID PRIMARY KEY, category TEXT NOT NULL, name TEXT NOT NULL, file_url TEXT, upload_date TIMESTAMPTZ, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS bug_reports (id UUID PRIMARY KEY, user_name TEXT, role TEXT, message TEXT, url TEXT, is_online BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);

      -- Animals & Dashboard
      CREATE TABLE IF NOT EXISTS animals (id UUID PRIMARY KEY, name TEXT NOT NULL, species TEXT NOT NULL, category TEXT NOT NULL, sex TEXT, location TEXT NOT NULL, image_url TEXT, hazard_rating TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS archived_animals (id UUID PRIMARY KEY, name TEXT NOT NULL, species TEXT NOT NULL, category TEXT NOT NULL, archive_reason TEXT, archive_type TEXT, archived_at TIMESTAMPTZ, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS tasks (id UUID PRIMARY KEY, title TEXT NOT NULL, type TEXT, assigned_to TEXT, due_date TEXT NOT NULL, completed BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);

      -- Husbandry
      CREATE TABLE IF NOT EXISTS daily_logs (id UUID PRIMARY KEY, animal_id UUID, log_type TEXT, log_date TEXT, value TEXT, notes TEXT, user_initials TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS daily_rounds (id UUID PRIMARY KEY, section TEXT, shift TEXT, status TEXT, completed_by TEXT, completed_at TIMESTAMPTZ, notes TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);

      -- Medical
      CREATE TABLE IF NOT EXISTS medical_records (id UUID PRIMARY KEY, animal_id UUID, diagnosis TEXT, treatment_plan TEXT, note_type TEXT, date TEXT, staff_initials TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS clinical_notes (id UUID PRIMARY KEY, animal_id UUID, type TEXT, notes TEXT, author TEXT, date TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS mar_charts (id UUID PRIMARY KEY, animal_id UUID, medication TEXT, dosage TEXT, frequency TEXT, start_date TEXT, end_date TEXT, status TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS quarantine_records (id UUID PRIMARY KEY, animal_id UUID, start_date TEXT, end_date TEXT, reason TEXT, status TEXT, staff_initials TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);

      -- Safety & Facilities
      CREATE TABLE IF NOT EXISTS incidents (id UUID PRIMARY KEY, type TEXT, severity TEXT, date TEXT, time TEXT, location TEXT, description TEXT, status TEXT, reported_by TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS first_aid_logs (id UUID PRIMARY KEY, date TEXT, time TEXT, type TEXT, person_name TEXT, location TEXT, description TEXT, treatment TEXT, outcome TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS maintenance_logs (id UUID PRIMARY KEY, task_type TEXT, enclosure_id UUID, description TEXT, status TEXT, date_logged TEXT, date_completed TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS safety_drills (id UUID PRIMARY KEY, title TEXT, location TEXT, date TEXT, status TEXT, description TEXT, priority TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);

      -- Staff
      CREATE TABLE IF NOT EXISTS timesheets (id UUID PRIMARY KEY, staff_name TEXT NOT NULL, date TEXT NOT NULL, clock_in TEXT NOT NULL, clock_out TEXT, total_hours TEXT, status TEXT NOT NULL, notes TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS staff_rota (id UUID PRIMARY KEY, assigned_to TEXT, shift_type TEXT NOT NULL, date DATE NOT NULL, notes TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS holidays (id UUID PRIMARY KEY, staff_name TEXT NOT NULL, leave_type TEXT, start_date TEXT, end_date TEXT, status TEXT, notes TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);

      -- Logistics
      CREATE TABLE IF NOT EXISTS internal_movements (id UUID PRIMARY KEY, animal_id UUID, animal_name TEXT, movement_type TEXT, source_location TEXT, destination_location TEXT, log_date TEXT, notes TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS external_transfers (id UUID PRIMARY KEY, animal_id UUID, animal_name TEXT, transfer_type TEXT, institution TEXT, date TEXT, transport_method TEXT, status TEXT, notes TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);

      -- Offline Sync Tracking Queue
      CREATE TABLE IF NOT EXISTS upload_queue (id UUID PRIMARY KEY, table_name TEXT, record_id UUID, operation TEXT, payload JSONB, created_at TIMESTAMPTZ, sync_attempts INTEGER DEFAULT 0);
      
      COMMIT;
    `);
    console.log('✅ [Database] PGlite Full Parity Schema Established (Includes Auth).');
  } catch (error) {
    console.error('🛑 [Database] Schema Initialization Failed:', error);
  }
};
