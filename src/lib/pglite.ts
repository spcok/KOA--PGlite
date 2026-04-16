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
      -- Core Husbandry
      CREATE TABLE IF NOT EXISTS animals (has_no_id BOOLEAN DEFAULT FALSE, critical_husbandry_notes JSONB, target_day_temp_c TEXT, target_night_temp_c TEXT, location TEXT NOT NULL, category TEXT NOT NULL, latin_name TEXT, species TEXT NOT NULL, name TEXT NOT NULL, entity_type TEXT, weight_unit TEXT, hazard_rating TEXT, image_url TEXT, sex TEXT, acquisition_type TEXT, microchip_id TEXT, disposition_status TEXT, origin_location TEXT, destination_location TEXT, ring_number TEXT, red_list_status TEXT, description TEXT, special_requirements TEXT, misting_frequency TEXT, origin TEXT, distribution_map_url TEXT, archive_reason TEXT, is_boarding BOOLEAN DEFAULT FALSE, ambient_temp_only BOOLEAN DEFAULT FALSE, is_deleted BOOLEAN DEFAULT FALSE NOT NULL, _modified TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_at TIMESTAMPTZ, water_tipping_temp TEXT, is_quarantine BOOLEAN DEFAULT FALSE, archived_at TIMESTAMPTZ, archived BOOLEAN DEFAULT FALSE, display_order INTEGER, winter_weight_g TEXT, flying_weight_g TEXT, dam_id UUID, sire_id UUID, acquisition_date DATE, archive_type TEXT, target_humidity_max_percent TEXT, target_humidity_min_percent TEXT, id UUID NOT NULL, parent_mob_id UUID, census_count INTEGER, is_venomous BOOLEAN DEFAULT FALSE, dob DATE, is_dob_unknown BOOLEAN DEFAULT FALSE, transfer_date DATE, PRIMARY KEY (id));
      CREATE TABLE IF NOT EXISTS daily_logs (weight_unit TEXT, _modified TIMESTAMPTZ, basking_temp_c TEXT, user_initials TEXT, notes TEXT, value TEXT NOT NULL, log_date TEXT NOT NULL, log_type TEXT NOT NULL, cool_temp_c TEXT, temperature_c TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE, updated_at TIMESTAMPTZ, id UUID NOT NULL, integrity_seal TEXT, created_by TEXT, animal_id UUID NOT NULL, weight_grams TEXT, weight TEXT, health_record_type TEXT, PRIMARY KEY (id));
      CREATE TABLE IF NOT EXISTS daily_rounds (id UUID PRIMARY KEY, date TEXT NOT NULL, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, notes TEXT, user_initials TEXT, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS medical_records (id UUID PRIMARY KEY, animal_id UUID NOT NULL, type TEXT, date TEXT, notes TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS maintenance_logs (id UUID PRIMARY KEY, title TEXT, description TEXT, location TEXT, status TEXT, date_logged TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS incidents (id UUID PRIMARY KEY, title TEXT, description TEXT, date TEXT, severity TEXT, status TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS safety_drills (id UUID PRIMARY KEY, type TEXT, date TEXT, notes TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS tasks (recurring BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ, id UUID NOT NULL, updated_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE, type TEXT, _modified TIMESTAMPTZ, due_date TEXT NOT NULL, notes TEXT, title TEXT NOT NULL, completed BOOLEAN DEFAULT FALSE, animal_id UUID, assigned_to TEXT, PRIMARY KEY (id));
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
      
      -- Staff Module Tables
      CREATE TABLE IF NOT EXISTS timesheets (id UUID PRIMARY KEY, user_id UUID, date TEXT, clock_in TEXT, clock_out TEXT, notes TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS staff_rota (id UUID PRIMARY KEY, user_id UUID, start_time TEXT, end_time TEXT, role TEXT, location TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS holidays (id UUID PRIMARY KEY, user_id UUID, start_date TEXT, end_date TEXT, status TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);

      -- Logistics Module Tables
      CREATE TABLE IF NOT EXISTS animal_movements (id UUID PRIMARY KEY, animal_id UUID, from_location TEXT, to_location TEXT, date TEXT, reason TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      CREATE TABLE IF NOT EXISTS animal_transfers (id UUID PRIMARY KEY, animal_id UUID, to_institution TEXT, date TEXT, notes TEXT, created_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE);
      
      -- Auth Bedrock
      CREATE TABLE IF NOT EXISTS organisations (updated_at TIMESTAMPTZ, logo_url TEXT, org_name TEXT NOT NULL, id TEXT NOT NULL, adoption_portal TEXT, contact_phone TEXT, address TEXT, zla_license_number TEXT, official_website TEXT, contact_email TEXT, created_at TIMESTAMPTZ, PRIMARY KEY (id));
      CREATE TABLE IF NOT EXISTS role_permissions (manage_all_timesheets BOOLEAN DEFAULT FALSE, _modified TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_at TIMESTAMPTZ, id UUID, deleted_at TIMESTAMPTZ, is_deleted BOOLEAN DEFAULT FALSE, view_archived_records BOOLEAN DEFAULT FALSE, manage_roles BOOLEAN DEFAULT FALSE, manage_users BOOLEAN DEFAULT FALSE, manage_zla_documents BOOLEAN DEFAULT FALSE, approve_holidays BOOLEAN DEFAULT FALSE, request_holidays BOOLEAN DEFAULT FALSE, submit_timesheets BOOLEAN DEFAULT FALSE, resolve_maintenance BOOLEAN DEFAULT FALSE, report_maintenance BOOLEAN DEFAULT FALSE, manage_incidents BOOLEAN DEFAULT FALSE, report_incidents BOOLEAN DEFAULT FALSE, manage_external_transfers BOOLEAN DEFAULT FALSE, log_internal_movements BOOLEAN DEFAULT FALSE, manage_quarantine BOOLEAN DEFAULT FALSE, administer_medications BOOLEAN DEFAULT FALSE, prescribe_medications BOOLEAN DEFAULT FALSE, add_clinical_notes BOOLEAN DEFAULT FALSE, log_daily_rounds BOOLEAN DEFAULT FALSE, manage_tasks BOOLEAN DEFAULT FALSE, complete_tasks BOOLEAN DEFAULT FALSE, edit_daily_logs BOOLEAN DEFAULT FALSE, create_daily_logs BOOLEAN DEFAULT FALSE, delete_animals BOOLEAN DEFAULT FALSE, archive_animals BOOLEAN DEFAULT FALSE, add_animals BOOLEAN DEFAULT FALSE, manage_access_control BOOLEAN DEFAULT FALSE, view_settings BOOLEAN DEFAULT FALSE, generate_reports BOOLEAN DEFAULT FALSE, view_missing_records BOOLEAN DEFAULT FALSE, view_holidays BOOLEAN DEFAULT FALSE, view_timesheets BOOLEAN DEFAULT FALSE, view_first_aid BOOLEAN DEFAULT FALSE, view_safety_drills BOOLEAN DEFAULT FALSE, view_maintenance BOOLEAN DEFAULT FALSE, view_incidents BOOLEAN DEFAULT FALSE, view_movements BOOLEAN DEFAULT FALSE, edit_medical BOOLEAN DEFAULT FALSE, view_medical BOOLEAN DEFAULT FALSE, view_daily_rounds BOOLEAN DEFAULT FALSE, view_tasks BOOLEAN DEFAULT FALSE, view_daily_logs BOOLEAN DEFAULT FALSE, edit_animals BOOLEAN DEFAULT FALSE, view_animals BOOLEAN DEFAULT FALSE, role TEXT NOT NULL, PRIMARY KEY (id));
      CREATE TABLE IF NOT EXISTS users (id TEXT NOT NULL, _modified TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ, integrity_seal TEXT, is_deleted BOOLEAN DEFAULT FALSE, permissions JSONB, job_position TEXT, pin TEXT, email TEXT NOT NULL, initials TEXT NOT NULL, name TEXT, role TEXT, signature_data TEXT, PRIMARY KEY (id));
      COMMIT;
    `);
    console.log('✅ [Database] PGlite Full Parity Schema Established (Includes Auth).');
  } catch (error) {
    console.error('🛑 [Database] Schema Initialization Failed:', error);
  }
};
