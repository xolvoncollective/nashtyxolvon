import { run, get } from './database';

/**
 * Standardized Database Persistence Utilities
 * Centralizes INSERT, UPDATE, UPSERT, and DELETE operations.
 */

export function insert(table: string, data: Record<string, any>) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');

  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  return run(sql, values);
}

export function update(table: string, id: string | number, data: Record<string, any>) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  
  if (keys.length === 0) return { changes: 0 };

  const setClause = keys.map(k => `${k} = ?`).join(', ');
  
  // Explicitly check if updated_at is provided, else add it automatically
  let sql;
  if (keys.includes('updated_at')) {
    sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  } else {
    sql = `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  }
  
  return run(sql, [...values, id]);
}

/**
 * Upsert based on checking existence first, to avoid complex ON CONFLICT rules
 * when unique indexes are not perfectly mapped to matchKeys.
 */
export function upsert(
  table: string, 
  matchData: Record<string, any>, 
  updateData: Record<string, any>, 
  insertData: Record<string, any>
) {
  const matchKeys = Object.keys(matchData);
  const matchValues = Object.values(matchData);
  const matchClause = matchKeys.map(k => {
    if (matchData[k] === null) return `${k} IS NULL`;
    return `${k} = ?`;
  }).join(' AND ');
  
  // Filter out nulls for the parameterized values
  const queryParams = matchValues.filter(v => v !== null);

  const existing = get(`SELECT id FROM ${table} WHERE ${matchClause}`, queryParams) as any;

  if (existing) {
    return update(table, existing.id, updateData);
  } else {
    return insert(table, insertData);
  }
}

export function softDelete(table: string, id: string | number) {
  const sql = `UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  return run(sql, [id]);
}

export function restore(table: string, id: string | number) {
  const sql = `UPDATE ${table} SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  return run(sql, [id]);
}
