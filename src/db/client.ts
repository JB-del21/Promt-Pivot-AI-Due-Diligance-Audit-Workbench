import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

let pool: pg.Pool | null = null;

if (connectionString) {
  try {
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' || connectionString.includes('supabase') || connectionString.includes('neon')
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  } catch (err) {
    console.warn('[PostgreSQL Client] Failed to initialize connection pool:', err);
    pool = null;
  }
} else {
  console.log('[PostgreSQL Client] No DATABASE_URL found. Running in stateless in-memory fallback mode.');
}

/**
 * Execute a SQL query on PostgreSQL with automatic parameter binding.
 * Returns empty array if database connection is not configured or fails.
 */
export async function executeQuery<T = any>(text: string, params?: any[]): Promise<T[]> {
  if (!pool) return [];
  let client: pg.PoolClient | null = null;
  try {
    client = await pool.connect();
    const res = await client.query(text, params);
    return res.rows as T[];
  } catch (error) {
    console.error('[PostgreSQL Error]:', error);
    return [];
  } finally {
    if (client) client.release();
  }
}

/**
 * Save an audit report submission into Supabase / PostgreSQL tables
 */
export async function saveAuditReportToDb(payload: {
  scenarioId: string;
  userName: string;
  userRole: string;
  deviceType?: string;
  totalScore: number;
  auditStatus: string;
  rawAuditJson: any;
  sha256Hash: string;
  faultResults?: Array<{ faultId: string; status: string; comment?: string }>;
}): Promise<{ success: boolean; reportId?: string; error?: string }> {
  if (!pool) return { success: false, error: 'Database connection not initialized' };

  try {
    const reportInsertQuery = `
      INSERT INTO audit_reports (
        scenario_id, user_name, user_role, device_type, total_score, audit_status, raw_audit_json, sha256_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (sha256_hash) DO UPDATE SET
        total_score = EXCLUDED.total_score,
        audit_status = EXCLUDED.audit_status
      RETURNING id;
    `;

    const rows = await executeQuery<{ id: string }>(reportInsertQuery, [
      payload.scenarioId,
      payload.userName || 'Anonymous Auditor',
      payload.userRole || 'Junior Analyst',
      payload.deviceType || 'web',
      payload.totalScore,
      payload.auditStatus,
      JSON.stringify(payload.rawAuditJson),
      payload.sha256Hash,
    ]);

    const reportId = rows[0]?.id;

    if (reportId && payload.faultResults && Array.isArray(payload.faultResults)) {
      for (const fault of payload.faultResults) {
        await executeQuery(
          `INSERT INTO fault_audit_results (report_id, fault_id, status, user_comment)
           VALUES ($1, $2, $3, $4)`,
          [reportId, fault.faultId, fault.status, fault.comment || '']
        );
      }
    }

    return { success: true, reportId };
  } catch (err: any) {
    console.error('[PostgreSQL Save Report Error]:', err);
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Fetch persisted audit reports for a specific scenario
 */
export async function fetchAuditReportsFromDb(scenarioId: string): Promise<any[]> {
  if (!pool) return [];
  return executeQuery(
    `SELECT 
      id,
      scenario_id as "scenarioId",
      user_name as "name",
      user_role as "role",
      device_type as "deviceType",
      total_score as "totalScore",
      audit_status as "status",
      sha256_hash as "sha256Hash",
      submitted_at as "submittedAt"
    FROM audit_reports
    WHERE scenario_id = $1
    ORDER BY submitted_at DESC
    LIMIT 50`,
    [scenarioId]
  );
}
