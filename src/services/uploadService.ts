import { supabase } from '../lib/supabase';
import { localDB } from '../lib/pglite';

export const processUploadQueue = async () => {
  // 1. Guard check: Are we online?
  if (!navigator.onLine) return;

  try {
    // 2. Fetch the oldest 10 pending items from the queue
    const queueRes = await localDB.query(`
      SELECT * FROM upload_queue 
      ORDER BY created_at ASC 
      LIMIT 10;
    `);

    if (!queueRes.rows || queueRes.rows.length === 0) return;

    console.log(`🔄 [Sync-Back] Processing ${queueRes.rows.length} pending changes...`);

    // 3. Process each item sequentially
    for (const item of queueRes.rows as any[]) {
      const { id, table_name, operation, payload, record_id } = item;
      let syncError = null;

      try {
        if (operation === 'INSERT' || operation === 'UPDATE') {
          // UPSERT handles both Insert and Update dynamically based on the ID
          const { error } = await supabase
            .from(table_name)
            .upsert({ ...payload, id: record_id });
            
          syncError = error;
        } 
        else if (operation === 'DELETE') {
          // Hard delete (if used, though we mostly use soft deletes)
          const { error } = await supabase
            .from(table_name)
            .delete()
            .eq('id', record_id);
            
          syncError = error;
        }

        // 4. If successful, remove the receipt from the local queue
        if (!syncError) {
          await localDB.query(`DELETE FROM upload_queue WHERE id = $1`, [id]);
          console.log(`✅ [Sync-Back] Success: ${operation} on ${table_name}`);
        } else {
          throw syncError;
        }

      } catch (err) {
        console.error(`❌ [Sync-Back] Failed to process queue item ${id}:`, err);
        // Increment attempt counter so we don't get stuck forever on a bad payload
        await localDB.query(`
          UPDATE upload_queue 
          SET sync_attempts = sync_attempts + 1 
          WHERE id = $1
        `, [id]);
        
        // Break the loop on the first failure to maintain chronological integrity
        break; 
      }
    }
  } catch (globalErr) {
    console.error("Critical error in processUploadQueue:", globalErr);
  }
};
