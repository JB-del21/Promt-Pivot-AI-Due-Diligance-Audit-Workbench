-- PROMPT & PIVOT Enterprise Audit Schema (PostgreSQL / Supabase / Neon)

-- 1. Audit Szcenáriók Tábla
CREATE TABLE IF NOT EXISTS audit_scenarios (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Egyéni Audit Riportok & Verifikált SHA-256 Hash-ek
CREATE TABLE IF NOT EXISTS audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous Auditor',
  user_role VARCHAR(100) NOT NULL DEFAULT 'Junior Analyst',
  device_type VARCHAR(50) NOT NULL DEFAULT 'web', -- 'web' | 'android' | 'emulator'
  total_score INT NOT NULL,
  audit_status VARCHAR(50) NOT NULL, -- 'Senior' | 'Associate' | 'Junior' | 'UNQUALIFIED'
  raw_audit_json JSONB NOT NULL, -- RFC 8785 szerinti kanonikus JSON
  sha256_hash VARCHAR(64) NOT NULL UNIQUE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Beültetett Hibák Észlelési Eredményei (Hőtérkép Alapadatok)
CREATE TABLE IF NOT EXISTS fault_audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES audit_reports(id) ON DELETE CASCADE,
  fault_id VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'CAUGHT' | 'PARTIAL' | 'BLIND_SPOT'
  user_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexek a villámgyors hőtérkép es verifikációs lekérdezésekhez
CREATE INDEX IF NOT EXISTS idx_reports_scenario ON audit_reports(scenario_id);
CREATE INDEX IF NOT EXISTS idx_reports_hash ON audit_reports(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_fault_results_report ON fault_audit_results(report_id);
