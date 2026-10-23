-- PROMPT & PIVOT Enterprise Audit Schema (PostgreSQL / Supabase / Neon)

-- 1. Audit Szcenáriók Tábla
CREATE TABLE IF NOT EXISTS audit_scenarios (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Egyéni Audit Riportok & Szerveroldalon Újraszámított SHA-256 Hash-ek
CREATE TABLE IF NOT EXISTS audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(128) NOT NULL DEFAULT 'default-tenant',
  scenario_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous Auditor',
  user_role VARCHAR(100) NOT NULL DEFAULT 'Junior Analyst',
  device_type VARCHAR(50) NOT NULL DEFAULT 'web', -- 'web' | 'android' | 'emulator'
  total_score INT NOT NULL,
  audit_status VARCHAR(50) NOT NULL, -- 'SENIOR' | 'ASSOCIATE' | 'JUNIOR' | 'UNQUALIFIED'
  audit_mode VARCHAR(20) NOT NULL DEFAULT 'STRICT', -- 'STRICT' | 'GUIDED'
  raw_audit_json JSONB NOT NULL, -- RFC 8785 szerinti kanonikus JSON
  sha256_hash VARCHAR(128) NOT NULL UNIQUE, -- Supports full 71-char SHA256:... prefix
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ALTER TABLE for existing deployments:
ALTER TABLE audit_reports ALTER COLUMN sha256_hash TYPE VARCHAR(128);

-- 3. Beültetett Hibák Észlelési Eredményei (Hőtérkép Alapadatok)
CREATE TABLE IF NOT EXISTS fault_audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES audit_reports(id) ON DELETE CASCADE,
  fault_id VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'CAUGHT' | 'PARTIAL' | 'BLIND_SPOT'
  user_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexek a villámgyors hőtérkép és tenant-szintű lekérdezésekhez
CREATE INDEX IF NOT EXISTS idx_reports_scenario ON audit_reports(scenario_id);
CREATE INDEX IF NOT EXISTS idx_reports_tenant ON audit_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reports_hash ON audit_reports(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_fault_results_report ON fault_audit_results(report_id);

-- v7.1: cross-instance benchmark quota. Apply migration before enabling protected APIs.
CREATE TABLE IF NOT EXISTS benchmark_rate_limits (
  tenant_id VARCHAR(128) NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count BETWEEN 1 AND 10),
  PRIMARY KEY (tenant_id, window_start)
);
