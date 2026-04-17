import { localDB } from './pglite';

// Helper to convert camelCase keys to snake_case for PostgreSQL
const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

export const insertOfflineRecord = async (tableName: string, payload: Record<string, any>) => {
  const id = payload.id || crypto.randomUUID();
  const now = new Date().toISOString();

  // Enforce baseline fields
  const data = { ...payload, id, created_at: now, updated_at: now, is_deleted: false };

  const columns: string[] = [];
  const values: any[] = [];
  const placeholders: string[] = [];

  let i = 1;
  for (const [key, value] of Object.entries(data)) {
    columns.push(toSnakeCase(key));
    values.push(value === undefined ? null : value);
    placeholders.push(`$${i}`);
    i++;
  }

  const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')});`;

  try {
    await localDB.query('BEGIN;');
    
    // 1. Insert into the target table (UI reacts instantly)
    await localDB.query(query, values);
    
    // 2. Log the receipt for the Cloud Sync Engine
    await localDB.query(
      `INSERT INTO upload_queue (id, table_name, record_id, operation, payload, created_at) VALUES ($1, $2, $3, $4, $5, $6);`,
      [crypto.randomUUID(), tableName, id, 'INSERT', JSON.stringify(data), now]
    );
    
    await localDB.query('COMMIT;');
    console.log(`✅ [Offline Write] Created ${tableName} record:`, id);
    return data;
  } catch (error) {
    await localDB.query('ROLLBACK;');
    console.error(`❌ [Offline Write Failed] ${tableName}:`, error);
    throw error;
  }
};

export const updateOfflineRecord = async (tableName: string, id: string, payload: Record<string, any>) => {
  const now = new Date().toISOString();
  const data = { ...payload, updated_at: now };
  
  const setClauses: string[] = [];
  const values: any[] = [];
  let i = 1;

  for (const [key, value] of Object.entries(data)) {
    if (key === 'id') continue; // Don't update primary keys
    setClauses.push(`${toSnakeCase(key)} = $${i}`);
    values.push(value === undefined ? null : value);
    i++;
  }
  
  values.push(id); // ID goes last for the WHERE clause
  const query = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = $${i};`;

  try {
    await localDB.query('BEGIN;');
    await localDB.query(query, values);
    await localDB.query(
      `INSERT INTO upload_queue (id, table_name, record_id, operation, payload, created_at) VALUES ($1, $2, $3, $4, $5, $6);`,
      [crypto.randomUUID(), tableName, id, 'UPDATE', JSON.stringify(data), now]
    );
    await localDB.query('COMMIT;');
    console.log(`✅ [Offline Write] Updated ${tableName} record:`, id);
    return data;
  } catch (error) {
    await localDB.query('ROLLBACK;');
    console.error(`❌ [Offline Write Failed] ${tableName}:`, error);
    throw error;
  }
};
