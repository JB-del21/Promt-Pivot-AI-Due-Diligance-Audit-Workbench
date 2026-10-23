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
        ? { rejectUnauthorized: true }
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
  console.log('[PostgreSQL Client] No DATABASE_URL found. Running in stateless fallback mode.');
}

/**
 * Execute a SQL query on PostgreSQL with automatic parameter binding.
 * Throws on database failure so caller can detect and handle errors.
 */
export async function executeQuery<T = any>(text: string, params?: any[]): Promise<T[]> {
  if (!pool) throw new Error('Database unavailable');
  let client: pg.PoolClient | null = null;
  try {
    client = await pool.connect();
    const res = await client.query(text, params);
    return res.rows as T[];
  } finally {
    if (client) client.release();
  }
}

/**
 * Save an audit report submission atomically into Supabase / PostgreSQL tables
 * using a single ACID transaction.
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
  tenantId: string;
  auditMode?: string;
  faultResults?: Array<{ faultId: string; status: string; comment?: string }>;
}): Promise<{ success: boolean; reportId?: string; error?: string }> {
  if (!pool) return { success: false, error: 'Database connection pool not initialized' };

  let client: pg.PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const reportInsertQuery = `
      INSERT INTO audit_reports (
        scenario_id, user_name, user_role, device_type, total_score, audit_status, raw_audit_json, sha256_hash, tenant_id, audit_mode
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id;
    `;

    const reportRes = await client.query<{ id: string }>(reportInsertQuery, [
      payload.scenarioId,
      payload.userName || 'Anonymous Auditor',
      payload.userRole || 'Junior Analyst',
      payload.deviceType || 'web',
      payload.totalScore,
      payload.auditStatus,
      JSON.stringify(payload.rawAuditJson),
      payload.sha256Hash,
      payload.tenantId,
      payload.auditMode || 'standard',
    ]);

    const reportId = reportRes.rows[0]?.id;

    if (!reportId) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Failed to obtain persisted report ID' };
    }

    if (payload.faultResults && Array.isArray(payload.faultResults)) {
      for (const fault of payload.faultResults) {
        await client.query(
          `INSERT INTO fault_audit_results (report_id, fault_id, status, user_comment)
           VALUES ($1, $2, $3, $4)`,
          [reportId, fault.faultId, fault.status, fault.comment || '']
        );
      }
    }

    await client.query('COMMIT');
    return { success: true, reportId };
  } catch (err: any) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch {}
    }
    console.error('[PostgreSQL Atomic Save Error]:', err?.message || err);
    return { success: false, error: err?.message || 'Database transaction failed' };
  } finally {
    if (client) client.release();
  }
}

/**
 * Fetch persisted audit reports for a specific scenario and tenant
 */
export async function fetchAuditReportsFromDb(scenarioId: string, tenantId: string = 'default-tenant'): Promise<any[]> {
  if (!pool) throw new Error('Database unavailable');
  return await executeQuery(
      `SELECT 
        id,
        scenario_id as "scenarioId",
        user_name as "name",
        user_role as "role",
        device_type as "deviceType",
        total_score as "totalScore",
        audit_status as "status",
        sha256_hash as "sha256Hash",
        tenant_id as "tenantId",
        audit_mode as "auditMode",
        submitted_at as "submittedAt"
      FROM audit_reports
      WHERE scenario_id = $1 AND tenant_id = $2
      ORDER BY submitted_at DESC
      LIMIT 50`,
      [scenarioId, tenantId]
    );
}

/** Shared per-tenant budget across serverless instances; fails closed when DB is unavailable. */
export async function consumeBenchmarkQuota(tenantId: string, maxPerMinute = 10): Promise<boolean> {
  const rows = await executeQuery<{ request_count: number }>(
    `INSERT INTO benchmark_rate_limits (tenant_id, window_start, request_count)
     VALUES ($1, date_trunc('minute', now()), 1)
     ON CONFLICT (tenant_id, window_start) DO UPDATE
       SET request_count = benchmark_rate_limits.request_count + 1
       WHERE benchmark_rate_limits.request_count < $2
     RETURNING request_count`, [tenantId, maxPerMinute]);
  return rows.length === 1;
}
