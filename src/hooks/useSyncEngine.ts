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
        // 2. Fetch Animals
        const { data: remoteAnimals, error: animalError } = await supabase.from('animals').select('*').neq('is_deleted', true);
        if (animalError) throw animalError;

        // 3. Fetch Users (Auth Bedrock)
        const { data: remoteUsers, error: userError } = await supabase.from('users').select('*').neq('is_deleted', true);
        if (userError) throw userError;

        await localDB.query('BEGIN;');
        
        // Insert Animals
        if (remoteAnimals && remoteAnimals.length > 0) {
          for (const a of remoteAnimals) {
            await localDB.query(
              `INSERT INTO animals (id, name, species, category, location, is_deleted, created_at, updated_at, image_url) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
               ON CONFLICT (id) DO UPDATE SET 
                 name = EXCLUDED.name, species = EXCLUDED.species, category = EXCLUDED.category, location = EXCLUDED.location, updated_at = EXCLUDED.updated_at, image_url = EXCLUDED.image_url;`,
              [a.id, a.name || 'Unknown', a.species || 'Unknown', a.category || 'General', a.location || 'Unknown', a.is_deleted || false, a.created_at || new Date().toISOString(), a.updated_at || new Date().toISOString(), a.image_url || null]
            );
          }
        }

        // 4. Fetch Daily Rounds
        const { data: remoteRounds, error: roundError } = await supabase.from('daily_rounds').select('*').neq('is_deleted', true);
        if (roundError) console.error('Error fetching rounds:', roundError);
        
        // Insert Rounds
        if (remoteRounds && remoteRounds.length > 0) {
          for (const r of remoteRounds) {
            await localDB.query(
              `INSERT INTO daily_rounds (id, date, created_at, updated_at, notes, user_initials, is_deleted) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) 
               ON CONFLICT (id) DO UPDATE SET 
                  date = EXCLUDED.date, notes = EXCLUDED.notes, user_initials = EXCLUDED.user_initials, updated_at = EXCLUDED.updated_at;`,
              [r.id, r.date, r.created_at, r.updated_at, r.notes, r.user_initials, r.is_deleted || false]
            );
          }
        }

        // Insert Users
        if (remoteUsers && remoteUsers.length > 0) {
          for (const u of remoteUsers) {
            await localDB.query(
              `INSERT INTO users (id, email, name, role, initials, pin, is_deleted) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) 
               ON CONFLICT (id) DO UPDATE SET 
                 email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role, initials = EXCLUDED.initials, pin = EXCLUDED.pin;`,
              [u.id, u.email || 'unknown@example.com', u.name || 'Unknown', u.role || 'user', u.initials || 'UN', u.pin || null, u.is_deleted || false]
            );
          }
        }

        await localDB.query('COMMIT;');
        console.log('✅ [Sync] Hydration Complete! (Animals & Users)');
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
