/** SHA-256 checks persisted report content, not independent server attestation. */
import { timingSafeEqual } from 'node:crypto';
import { canonicalizeJson, sha256 } from '../utils/auditScoring';

export interface StoredReport {
  sha256Hash: string;
  scenarioId: string;
  tenantId: string;
  totalScore: number;
  status: string;
  auditMode: string;
  name: string;
  role: string;
  deviceType: string;
  rawAuditJson: unknown;
}

export async function verifyStoredReport(record: StoredReport): Promise<boolean> {
  if (!/^SHA256:[a-f0-9]{64}$/.test(record.sha256Hash)) return false;
  const payload = record.rawAuditJson;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const p = payload as Record<string, unknown>;
  if (p.tenantId !== record.tenantId || p.scenarioId !== record.scenarioId || p.totalScore !== record.totalScore || p.auditStatus !== record.status || p.userName !== record.name || p.userRole !== record.role || p.deviceType !== record.deviceType || (p.isStrictMode ? 'strict' : 'standard') !== record.auditMode) return false;
  try {
    const calculated = Buffer.from(await sha256(canonicalizeJson(payload)), 'hex');
    return timingSafeEqual(calculated, Buffer.from(record.sha256Hash.slice(7), 'hex'));
  } catch {
    return false;
  }
}
