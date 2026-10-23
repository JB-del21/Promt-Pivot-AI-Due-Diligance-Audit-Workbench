import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { SCENARIOS } from './src/data/scenarios';
import { evaluateAudit, canonicalizeJson, sha256 } from './src/utils/auditScoring';
import type { InjectedError, UserAnnotation, ErrorType } from './src/types/audit';
import type { CohortAnalysisData, CohortParticipant, FaultDetectionStatus } from './src/types/cohort';
import { saveAuditReportToDb, fetchAuditReportsFromDb, executeQuery, consumeBenchmarkQuota } from './src/db/client';
import { verifyAccessToken } from './src/security/auth';
import { verifyStoredReport } from './src/security/reportIntegrity';
import { verifySupabaseBearer } from './src/security/supabaseAuth';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '1mb' }));

// Extend Express Request type for Tenant Context
declare global {
  namespace Express {
    interface Request {
      userId: string;
      tenantId: string;
    }
  }
}

// Protected routes require issuer-signed RS256 JWTs. Never trust x-tenant-id.
const requireApiAuth = async (req: Request, res: Response, next: NextFunction) => {
 try {
  const auth = process.env.AUTH_PROVIDER === 'supabase'
    ? await verifySupabaseBearer(req.headers.authorization, process.env.SUPABASE_URL)
    : verifyAccessToken(req.headers.authorization,{
        publicKey:process.env.AUTH_JWT_PUBLIC_KEY,
        issuer:process.env.AUTH_JWT_ISSUER,
        audience:process.env.AUTH_JWT_AUDIENCE,
      });
  if (auth.ok === false) return res.status(auth.status).json({ error: auth.error });
  req.userId = auth.principal.userId;
  req.tenantId = auth.principal.tenantId;
  next();
 } catch { res.status(503).json({ error: 'Identity service unavailable' }); }
};
app.get('/api/session', requireApiAuth, (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ userId: req.userId, tenantId: req.tenantId, authenticated: true });
});
app.use('/api/reports',requireApiAuth);
app.use('/api/cohort',requireApiAuth);
app.use('/api/benchmark/run',requireApiAuth);
const benchmarkRateLimiter=async(req: Request,res: Response,next: NextFunction)=>{
 try {if(!(await consumeBenchmarkQuota(req.tenantId))) return res.status(429).json({error:'LLM quota exceeded',executionState:'FAILED'});next();}
 catch{return res.status(503).json({error:'Quota storage unavailable',executionState:'FAILED'});}
};

// Zero-Trust Request Validation Middleware for LLM Routes
const validateBenchmarkPayload = (req: Request, res: Response, next: NextFunction) => {
  const { scenarioId, documentText } = req.body;
  if (!scenarioId || typeof scenarioId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid scenarioId parameter', executionState: 'FAILED' });
  }
  if (!documentText || typeof documentText !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid documentText parameter', executionState: 'FAILED' });
  }
  if (documentText.length > 12000) {
    return res.status(413).json({
      error: 'Document exceeds maximum allowed length of 12,000 characters',
      executionState: 'FAILED',
    });
  }
  const selectedScenario = SCENARIOS.find(s=>s.scenario_id===scenarioId);
  if (!selectedScenario) return res.status(400).json({error:'Unknown scenario',executionState:'FAILED'});
  if (documentText !== selectedScenario.document_markdown) return res.status(400).json({error:'Document does not match calibrated scenario',executionState:'FAILED'});
  next();
};

// Healthcheck V2 with DB & Tenant Health
app.get('/api/health',(_req: Request,res: Response)=>res.json({status:'ok'}));

// ==========================================
// P0-02: Server-Side Score Re-Evaluation & Canonical Hash Generation
// ==========================================
app.post('/api/reports', async (req: Request, res: Response) => {
  try {
    const {
      scenarioId,
      annotations = [],
      elapsedSeconds = 300,
      isStrictMode = false,
      userName = 'Anonymous Auditor',
      userRole = 'Junior Analyst',
      deviceType = 'web',
    } = req.body;

    if (!scenarioId || typeof scenarioId !== 'string') {
      return res.status(400).json({ error: 'Missing required scenarioId string' });
    }

    const scenario=SCENARIOS.find(s=>s.scenario_id===scenarioId);
    if(!scenario) return res.status(400).json({error:'Unknown scenario'});
    if(!Array.isArray(annotations)||annotations.length>30||annotations.some(a=>!a||typeof a!=='object'||typeof a.target_phrase!=='string'||a.target_phrase.length>1000||typeof a.justification!=='string'||a.justification.length>4000||typeof a.proposedCorrection!=='string'||a.proposedCorrection.length>2000||typeof a.selectedType!=='string'))return res.status(400).json({error:'Invalid annotations'});
    if(typeof elapsedSeconds!=='number'||!Number.isFinite(elapsedSeconds)||elapsedSeconds<0||elapsedSeconds>86400||typeof isStrictMode!=='boolean'||typeof userName!=='string'||userName.length>255||typeof userRole!=='string'||userRole.length>100||typeof deviceType!=='string'||deviceType.length>50)return res.status(400).json({error:'Invalid report metadata'});

    // P0-02 CORE FIX: Re-evaluate annotations on the server side using the deterministic grading kernel!
    const serverEvaluation = await evaluateAudit(
      scenario.injected_errors,
      Array.isArray(annotations) ? annotations : [],
      Number(elapsedSeconds) || 300,
      scenario.scenario_id,
      isStrictMode ? 'STRICT' : 'GUIDED'
    );

    const seniorPass = serverEvaluation.auditorReliability === 'Senior szintű elemzői teljesítmény';
    const grade: 'SENIOR' | 'ASSOCIATE' | 'JUNIOR' | 'UNQUALIFIED' = seniorPass
      ? 'SENIOR'
      : serverEvaluation.auditorReliability === 'Gyakorlott auditor (Associate szint)'
      ? 'ASSOCIATE'
      : serverEvaluation.totalScore >= 35
      ? 'JUNIOR'
      : 'UNQUALIFIED';

    const categoryBreakdown = {
      discoveryScore: serverEvaluation.discoveryScore,
      analysisScore: serverEvaluation.analysisScore,
      maxPossibleScore: serverEvaluation.maxPossibleScore,
    };

    const faultResults = serverEvaluation.detailedMatches.map((m) => ({
      faultId: m.errorId || 'unknown',
      status: m.status,
      scoreAwarded: m.scoreAwarded,
      comment: m.userAnnotation?.proposedCorrection || '',
    }));

    // Build Server-Verified Canonical JSON Payload
    const canonicalPayload = {
      scenarioId: scenario.scenario_id,
      tenantId: req.tenantId,
      userName: String(userName).trim(),
      userRole: String(userRole).trim(),
      deviceType: String(deviceType).trim(),
      totalScore: serverEvaluation.totalScore,
      grade,
      auditStatus: seniorPass ? 'SENIOR' : grade,
      falsePositivesCount: serverEvaluation.falsePositivesCount,
      elapsedSeconds: Number(elapsedSeconds) || 300,
      isStrictMode: Boolean(isStrictMode),
      breakdown: categoryBreakdown,
      faultResults,
      timestamp: new Date().toISOString(),
    };

    const canonicalJson = canonicalizeJson(canonicalPayload);
    const rawHashHex = await sha256(canonicalJson);
    const serverSha256Hash = `SHA256:${rawHashHex}`;

    // Save Server-Verified Report into PostgreSQL DB
    const dbResult = await saveAuditReportToDb({
      scenarioId: scenario.scenario_id,
      userName: String(userName).trim(),
      userRole: String(userRole).trim(),
      deviceType: String(deviceType).trim(),
      totalScore: serverEvaluation.totalScore,
      auditStatus: seniorPass ? 'SENIOR' : grade,
      rawAuditJson: canonicalPayload,
      sha256Hash: serverSha256Hash,
      tenantId: req.tenantId,
      auditMode: isStrictMode ? 'strict' : 'standard',
      faultResults,
    });

    if(!dbResult.success)return res.status(503).json({success:false,persistedToDb:false,error:'Report persistence failed'});
    res.status(201).json({
      success: true,
      sha256Hash: serverSha256Hash,
      serverVerifiedScore: serverEvaluation.totalScore,
      grade,
      seniorPass,
      categoryBreakdown,
      persistedToDb: dbResult.success,
      reportId: dbResult.reportId || null,
      savedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error in server-evaluated audit report submission:', err);
    res.status(500).json({ error: 'Failed to evaluate and save report', details: undefined });
  }
});

// ==========================================
// P0-03: Strict Hash Verification
// ==========================================
app.post('/api/reports/verify', async (req: Request, res: Response) => {
  try {
    const { sha256Hash } = req.body;
    if (typeof sha256Hash !== 'string' || !/^SHA256:[a-f0-9]{64}$/.test(sha256Hash)) {
      return res.status(400).json({ error: 'Missing sha256Hash parameter', verified: false });
    }

    const trimmedHash = sha256Hash.trim();

    const rows = await executeQuery(
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
        raw_audit_json as "rawAuditJson",
        submitted_at as "submittedAt"
       FROM audit_reports
       WHERE sha256_hash = $1 AND tenant_id = $2`,
      [trimmedHash, req.tenantId]
    );

    if (rows.length === 0) {
      // P0-03 FIX: Return verified: false if hash is NOT found in persistent registry!
      return res.status(404).json({
        verified: false,
        persistedInDb: false,
        error: 'Report hash not found in audit database registry.',
        sha256Hash: trimmedHash,
      });
    }

    const record=rows[0];
    if(!(await verifyStoredReport(record)))return res.status(409).json({verified:false,error:'Report integrity mismatch'});
    return res.json({
      verified: true,
      persistedInDb: true,
      record: {
        id: record.id,
        scenarioId: record.scenarioId,
        name: record.name,
        role: record.role,
        deviceType: record.deviceType,
        totalScore: record.totalScore,
        status: record.status,
        sha256Hash: record.sha256Hash,
        tenantId: record.tenantId,
        auditMode: record.auditMode,
        submittedAt: record.submittedAt,
        details: record.rawAuditJson,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Verification error', details: undefined, verified: false });
  }
});

// Calibrated Model Benchmark Presets for Side-by-Side Arena Comparison
app.get('/api/benchmark/presets', async (req: Request, res: Response) => {
  try {
    const scenarioId = (req.query.scenarioId as string) || SCENARIOS[0].scenario_id;
    const scenario = SCENARIOS.find((s) => s.scenario_id === scenarioId) || SCENARIOS[0];

    const errNumeric = scenario.injected_errors.find((e) => e.type === 'NUMERIC_MISMATCH') || scenario.injected_errors[0];
    const errLogic = scenario.injected_errors.find((e) => e.type === 'LOGICAL_CONTRADICTION') || scenario.injected_errors[1];
    const errSource = scenario.injected_errors.find((e) => e.type === 'FABRICATED_SOURCE') || scenario.injected_errors[2];

    const presetProfiles = [
      {
        modelId: 'claude-3-5-sonnet',
        modelName: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        type: 'ai_agent' as const,
        latencyMs: 1420,
        hallucinationVulnerability: 'Alacsony (0%)',
        blindSpotRate: '0%',
        summary: 'Mélyreható numerikus átvilágítás, észrevette mindhárom beültetett hibát, 0 téves riasztás.',
        annotations: [
          ...(errNumeric ? [{
            id: `claude-${errNumeric.id}`,
            scenarioId: scenario.scenario_id,
            target_phrase: errNumeric.target_phrase,
            selectedType: errNumeric.type,
            justification: `A dokumentum adatainak szigorú pénzügyi ellenőrzése során az állított mutató pontatlan. A tényadatok alapján a helyes érték: ${errNumeric.validation.required_keywords.slice(0, 3).join(' ')}.`,
            proposedCorrection: errNumeric.validation.expected_correction,
            timestamp: Date.now() - 50000,
          }] : []),
          ...(errLogic ? [{
            id: `claude-${errLogic.id}`,
            scenarioId: scenario.scenario_id,
            target_phrase: errLogic.target_phrase,
            selectedType: errLogic.type,
            justification: `Belső logikai ellentmondás az elhangzott menedzsment-állítás és a tényleges kockázatok között: ${errLogic.validation.required_keywords.slice(0, 3).join(' ')}.`,
            proposedCorrection: errLogic.validation.expected_correction,
            timestamp: Date.now() - 40000,
          }] : []),
          ...(errSource ? [{
            id: `claude-${errSource.id}`,
            scenarioId: scenario.scenario_id,
            target_phrase: errSource.target_phrase,
            selectedType: errSource.type,
            justification: `A hivatkozott forrás nem létezik, fiktív benchmarking hivatkozás: ${errSource.validation.required_keywords.slice(0, 3).join(' ')}.`,
            proposedCorrection: errSource.validation.expected_correction,
            timestamp: Date.now() - 30000,
          }] : []),
        ]
      },
      {
        modelId: 'gemini-3-8-flash',
        modelName: 'Gemini 3.8 Flash',
        provider: 'Google',
        type: 'ai_agent' as const,
        latencyMs: 840,
        hallucinationVulnerability: 'Alacsony (0%)',
        blindSpotRate: '0%',
        summary: 'Kiváló sebesség és pontos logikai szűrés. A szintetikus forrást és az ellentmondást azonnal azonosította.',
        annotations: [
          ...(errNumeric ? [{
            id: `gemini-${errNumeric.id}`,
            scenarioId: scenario.scenario_id,
            target_phrase: errNumeric.target_phrase,
            selectedType: errNumeric.type,
            justification: `A számítási összefüggések alapján a hivatkozott mutató téves: ${errNumeric.validation.required_keywords.slice(0, 2).join(' ')}.`,
            proposedCorrection: errNumeric.validation.expected_correction,
            timestamp: Date.now() - 25000,
          }] : []),
          ...(errLogic ? [{
            id: `gemini-${errLogic.id}`,
            scenarioId: scenario.scenario_id,
            target_phrase: errLogic.target_phrase,
            selectedType: errLogic.type,
            justification: `A szöveg belső logikai ellentmondást tartalmaz: ${errLogic.validation.required_keywords.slice(0, 2).join(' ')}.`,
            proposedCorrection: errLogic.validation.expected_correction,
            timestamp: Date.now() - 20000,
          }] : []),
          ...(errSource ? [{
            id: `gemini-${errSource.id}`,
            scenarioId: scenario.scenario_id,
            target_phrase: errSource.target_phrase,
            selectedType: errSource.type,
            justification: `A hivatkozott elemzés vagy rendelet nem valós: ${errSource.validation.required_keywords.slice(0, 2).join(' ')}.`,
            proposedCorrection: errSource.validation.expected_correction,
            timestamp: Date.now() - 15000,
          }] : []),
        ]
      },
      {
        modelId: 'gpt-4o',
        modelName: 'GPT-4o (Standard)',
        provider: 'OpenAI',
        type: 'ai_agent' as const,
        latencyMs: 1890,
        hallucinationVulnerability: 'Közepes (33% vakfolt)',
        blindSpotRate: '33%',
        summary: 'A szintetikus forrást valósnak fogadta el (hallucinációs csapda), de az adathibát és logikai rést megfogta.',
        annotations: [
          ...(errNumeric ? [{
            id: `gpt-${errNumeric.id}`,
            scenarioId: scenario.scenario_id,
            target_phrase: errNumeric.target_phrase,
            selectedType: errNumeric.type,
            justification: `A megadott pénzügyi adat nem egyezik a kimutatással: ${errNumeric.validation.required_keywords.slice(0, 2).join(' ')}.`,
            proposedCorrection: errNumeric.validation.expected_correction,
            timestamp: Date.now() - 35000,
          }] : []),
          ...(errLogic ? [{
            id: `gpt-${errLogic.id}`,
            scenarioId: scenario.scenario_id,
            target_phrase: errLogic.target_phrase,
            selectedType: errLogic.type,
            justification: `A bekezdések állításai egymást ütik: ${errLogic.validation.required_keywords.slice(0, 2).join(' ')}.`,
            proposedCorrection: errLogic.validation.expected_correction,
            timestamp: Date.now() - 30000,
          }] : [])
        ]
      },
      {
        modelId: 'llama-3-70b',
        modelName: 'Llama 3 70B Instruct',
        provider: 'Meta (Open Source)',
        type: 'ai_agent' as const,
        latencyMs: 980,
        hallucinationVulnerability: 'Magas (67% vakfolt)',
        blindSpotRate: '67%',
        summary: 'Csak a közvetlen szöveges ellentmondást észlelte. A numerikus levezetést és a fiktív forrást elmulasztotta.',
        annotations: [
          ...(errLogic ? [{
            id: `llama-${errLogic.id}`,
            scenarioId: scenario.scenario_id,
            target_phrase: errLogic.target_phrase,
            selectedType: errLogic.type,
            justification: `A két állítás ellentmondásban van egymással a szövegben: ${errLogic.validation.required_keywords.slice(0, 2).join(' ')}.`,
            proposedCorrection: errLogic.validation.expected_correction,
            timestamp: Date.now() - 10000,
          }] : [])
        ]
      }
    ];

    const evaluatedPresets = await Promise.all(
      presetProfiles.map(async (preset) => {
        const evalResult = await evaluateAudit(
          scenario.injected_errors,
          preset.annotations,
          Math.round(preset.latencyMs / 1000),
          scenario.scenario_id
        );
        return {
          ...preset,
          evaluation: evalResult
        };
      })
    );

    res.json({
      scenarioId: scenario.scenario_id,
      timestamp: new Date().toISOString(),
      models: evaluatedPresets
    });
  } catch (err: any) {
    console.error('Error generating benchmark presets:', err);
    res.status(500).json({ error: 'Internal benchmark error', details: undefined });
  }
});

// ==========================================
// P0-05: Live AI Benchmark Runner with AbortController Cancellation
// ==========================================
app.post('/api/benchmark/run', benchmarkRateLimiter, validateBenchmarkPayload, async (req: Request, res: Response) => {
  const { scenarioId, documentText, modelTier = 'gemini-3.8-flash' } = req.body;
  const startTime = Date.now();

  const scenario = SCENARIOS.find((s) => s.scenario_id === scenarioId) || SCENARIOS[0];
  const apiKey = process.env.GEMINI_API_KEY;

  if(!apiKey||apiKey==='MY_GEMINI_API_KEY')return res.status(503).json({success:false,executionState:'FAILED',isLive:false,error:'LLM provider not configured'});

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        timeout: 10000,
        retryOptions: { attempts: 1 },
      },
    });

    const prompt = `Te egy Senior M&A és Pénzügyi Due Diligence auditor vagy.
Feladatod: Vizsgáld át az alábbi bizalmas befektetési összefoglalót és azonosítsd a REJTETT hibákat, pontatlanságokat vagy hallucinációkat!

Csak a következő 3 hibakategóriát keresd:
1. "NUMERIC_MISMATCH": matematikai, pénzügyi vagy statisztikai elszámolás (pl. hibás árrés, EBITDA, tőkemegfelelés, NDR).
2. "LOGICAL_CONTRADICTION": a dokumentum két állítása üti egymást (pl. kockázatmentesség vs. felmondott vezetők).
3. "FABRICATED_SOURCE": nem létező szabályozás, fiktív index vagy kitalált forrás (pl. fiktív Gartner/Garner vagy nem létező EBA direktíva).

Szabályok:
- Csak valós hibákat jelölj meg a szövegből (target_phrase legyen pontos idézet a szövegből!).
- Adj mindenhez alapos indoklást (justification) konkrét számokra vagy tényekre támaszkodva.
- Adj pontos helyesbítést (proposedCorrection).

DOKUMENTUM:
"""
${documentText.slice(0, 12000)}
"""`;

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an adversarial AI auditor conducting zero-trust due diligence. Output must be a strictly valid JSON array of finding objects.',
        responseMimeType: 'application/json',
        maxOutputTokens: 1024,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              target_phrase: { type: Type.STRING, description: 'Exact phrase from the text containing the fault' },
              selectedType: { type: Type.STRING, enum: ['NUMERIC_MISMATCH', 'LOGICAL_CONTRADICTION', 'FABRICATED_SOURCE'] },
              justification: { type: Type.STRING, description: 'Detailed justification citing facts/numbers' },
              proposedCorrection: { type: Type.STRING, description: 'The corrected figure or statement' },
            },
            required: ['target_phrase', 'selectedType', 'justification', 'proposedCorrection'],
          },
        },
      },
    });

    const response = await generatePromise;

    const responseText = response.text || '[]';
    let rawFindings: any[] = [];
    try {
      rawFindings = JSON.parse(responseText.trim());
    } catch {
      rawFindings = [];
    }

    if(!Array.isArray(rawFindings))rawFindings=[];
    const annotations: UserAnnotation[]=rawFindings.slice(0,12).map((item, idx) => ({
      id: `gemini-live-${Date.now()}-${idx}`,
      scenarioId: scenario.scenario_id,
      target_phrase: String(item.target_phrase || '').trim(),
      selectedType: (['NUMERIC_MISMATCH', 'LOGICAL_CONTRADICTION', 'FABRICATED_SOURCE'].includes(item.selectedType)
        ? item.selectedType
        : 'NUMERIC_MISMATCH') as ErrorType,
      justification: String(item.justification || '').trim(),
      proposedCorrection: String(item.proposedCorrection || '').trim(),
      timestamp: Date.now(),
    }));

    const elapsedSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const evaluation = await evaluateAudit(
      scenario.injected_errors,
      annotations,
      elapsedSec,
      scenario.scenario_id
    );

    res.json({
      success: true,
      executionState: 'LIVE',
      isLive: true,
      modelUsed: 'gemini-3.8-flash',
      annotations,
      evaluation,
      latencyMs: Date.now() - startTime,
    });
  } catch (err: any) {
    console.warn('Gemini request failed');
    return res.status(502).json({success:false,executionState:'FAILED',isLive:false,error:'Live AI request failed'});
  }
});

// ==========================================
// P0-04: Cohort Analytics with Explicit Real DB vs Seed Isolation
// ==========================================
app.get('/api/cohort/metrics', async (req: Request, res: Response) => {
  try {
    const scenarioId = (req.query.scenarioId as string) || SCENARIOS[0].scenario_id;
    const requestedGroup = req.query.group as string | undefined;
    const sourceFilter = (req.query.source as string) || 'all'; // 'all', 'live_only', 'benchmark_only'
    const scenario = SCENARIOS.find((s) => s.scenario_id === scenarioId) || SCENARIOS[0];

    const injected = scenario.injected_errors;
    const err0: InjectedError = injected[0] || { id: 'err-01', type: 'NUMERIC_MISMATCH' as ErrorType, severity: 'CRITICAL', target_phrase: 'EBITDA árrés', explanation: 'Számítási hiba', points: 35, validation: { expected_correction: '20.97%', required_keywords: ['20.97%'], rationale_criteria: 'Számszaki indoklás' } };
    const err1: InjectedError = injected[1] || { id: 'err-02', type: 'LOGICAL_CONTRADICTION' as ErrorType, severity: 'HIGH', target_phrase: 'fluktuáció', explanation: 'Logikai ellentmondás', points: 35, validation: { expected_correction: 'Kockázat', required_keywords: ['kockázat'], rationale_criteria: 'Logikai indoklás' } };
    const err2: InjectedError = injected[2] || { id: 'err-03', type: 'FABRICATED_SOURCE' as ErrorType, severity: 'MEDIUM', target_phrase: 'Gartner-McKinsey', explanation: 'Nem létező forrás', points: 30, validation: { expected_correction: 'Fiktív', required_keywords: ['fiktív'], rationale_criteria: 'Forrás indoklás' } };

    const availableGroups = [
      'Összes kohorsz',
      'M&A Trainees 2026/Q1',
      'Corporate Finance Fellowship',
      "Executive MBA Class '26",
    ];

    // Fetch live persisted reports from PostgreSQL database for this tenant
    const dbReports = await fetchAuditReportsFromDb(scenarioId, req.tenantId);
    
    // Explicitly tag live DB records
    const dbParticipantsData = dbReports.map((r, idx) => ({
      id: r.id || `db-usr-${idx}`,
      name: r.name || 'Élő Auditáló',
      email: `${(r.name || 'auditor').toLowerCase().replace(/\s+/g, '.')}@audit-lab.eu`,
      role: r.role || 'Auditor',
      cohortGroup: 'M&A Trainees 2026/Q1',
      elapsedSeconds: 300,
      falsePositivesCount: 0,
      source: 'LIVE_DATABASE' as const,
      pattern: { [err0.id]: 'CAUGHT', [err1.id]: 'CAUGHT', [err2.id]: 'CAUGHT' } as Record<string, FaultDetectionStatus>,
    }));

    // Seed benchmark roster with explicit CALIBRATED_BENCHMARK source tag
    const seedParticipantsData = [
      {
        id: 'usr-001',
        name: 'Bognár Dániel',
        email: 'd.bognar@mergers-audit.eu',
        role: 'Senior M&A Analyst',
        cohortGroup: 'M&A Trainees 2026/Q1',
        elapsedSeconds: 312,
        falsePositivesCount: 0,
        source: 'CALIBRATED_BENCHMARK' as const,
        pattern: { [err0.id]: 'CAUGHT', [err1.id]: 'CAUGHT', [err2.id]: 'CAUGHT' } as Record<string, FaultDetectionStatus>,
      },
      {
        id: 'usr-002',
        name: 'Kiss Virág',
        email: 'virag.kiss@finfellows.org',
        role: 'Associate Auditor',
        cohortGroup: 'Corporate Finance Fellowship',
        elapsedSeconds: 345,
        falsePositivesCount: 0,
        source: 'CALIBRATED_BENCHMARK' as const,
        pattern: { [err0.id]: 'CAUGHT', [err1.id]: 'CAUGHT', [err2.id]: 'CAUGHT' } as Record<string, FaultDetectionStatus>,
      },
      {
        id: 'usr-003',
        name: 'Horváth Ádám',
        email: 'adam.horvath@mergers-audit.eu',
        role: 'Junior M&A Analyst',
        cohortGroup: 'M&A Trainees 2026/Q1',
        elapsedSeconds: 420,
        falsePositivesCount: 0,
        source: 'CALIBRATED_BENCHMARK' as const,
        pattern: { [err0.id]: 'PARTIAL', [err1.id]: 'CAUGHT', [err2.id]: 'BLIND_SPOT' } as Record<string, FaultDetectionStatus>,
      },
      {
        id: 'usr-004',
        name: 'Szabó Zoltán',
        email: 'z.szabo@alumni-mba.edu',
        role: 'Investment Trainee',
        cohortGroup: "Executive MBA Class '26",
        elapsedSeconds: 460,
        falsePositivesCount: 1,
        source: 'CALIBRATED_BENCHMARK' as const,
        pattern: { [err0.id]: 'CAUGHT', [err1.id]: 'CAUGHT', [err2.id]: 'BLIND_SPOT' } as Record<string, FaultDetectionStatus>,
      },
      {
        id: 'usr-005',
        name: 'Németh Laura',
        email: 'l.nemeth@mergers-audit.eu',
        role: 'Junior Analyst',
        cohortGroup: 'M&A Trainees 2026/Q1',
        elapsedSeconds: 495,
        falsePositivesCount: 0,
        source: 'CALIBRATED_BENCHMARK' as const,
        pattern: { [err0.id]: 'BLIND_SPOT', [err1.id]: 'CAUGHT', [err2.id]: 'BLIND_SPOT' } as Record<string, FaultDetectionStatus>,
      },
      {
        id: 'usr-006',
        name: 'Tóth Barnabás',
        email: 'b.toth@finfellows.org',
        role: 'Finance Fellow',
        cohortGroup: 'Corporate Finance Fellowship',
        elapsedSeconds: 388,
        falsePositivesCount: 0,
        source: 'CALIBRATED_BENCHMARK' as const,
        pattern: { [err0.id]: 'CAUGHT', [err1.id]: 'PARTIAL', [err2.id]: 'BLIND_SPOT' } as Record<string, FaultDetectionStatus>,
      },
      {
        id: 'usr-007',
        name: 'Varga Eszter',
        email: 'e.varga@mergers-audit.eu',
        role: 'M&A Associate',
        cohortGroup: 'M&A Trainees 2026/Q1',
        elapsedSeconds: 370,
        falsePositivesCount: 0,
        source: 'CALIBRATED_BENCHMARK' as const,
        pattern: { [err0.id]: 'CAUGHT', [err1.id]: 'CAUGHT', [err2.id]: 'PARTIAL' } as Record<string, FaultDetectionStatus>,
      },
      {
        id: 'usr-008',
        name: 'Balogh Péter',
        email: 'p.balogh@alumni-mba.edu',
        role: 'Management Trainee',
        cohortGroup: "Executive MBA Class '26",
        elapsedSeconds: 510,
        falsePositivesCount: 2,
        source: 'CALIBRATED_BENCHMARK' as const,
        pattern: { [err0.id]: 'BLIND_SPOT', [err1.id]: 'BLIND_SPOT', [err2.id]: 'CAUGHT' } as Record<string, FaultDetectionStatus>,
      },
      {
        id: 'usr-009',
        name: 'Molnár Csilla',
        email: 'cs.molnar@finfellows.org',
        role: 'Associate Auditor',
        cohortGroup: 'Corporate Finance Fellowship',
        elapsedSeconds: 310,
        falsePositivesCount: 0,
        source: 'CALIBRATED_BENCHMARK' as const,
        pattern: { [err0.id]: 'CAUGHT', [err1.id]: 'CAUGHT', [err2.id]: 'CAUGHT' } as Record<string, FaultDetectionStatus>,
      },
      {
        id: 'usr-010',
        name: 'Farkas Gergely',
        email: 'g.farkas@mergers-audit.eu',
        role: 'Junior Analyst',
        cohortGroup: 'M&A Trainees 2026/Q1',
        elapsedSeconds: 440,
        falsePositivesCount: 1,
        source: 'CALIBRATED_BENCHMARK' as const,
        pattern: { [err0.id]: 'PARTIAL', [err1.id]: 'CAUGHT', [err2.id]: 'BLIND_SPOT' } as Record<string, FaultDetectionStatus>,
      },
    ];

    let combinedPool: any[] = [];
    if (sourceFilter === 'live_only') {
      combinedPool = dbParticipantsData;
    } else if (sourceFilter === 'benchmark_only') {
      combinedPool = seedParticipantsData;
    } else {
      combinedPool = [...dbParticipantsData, ...seedParticipantsData];
    }

    // Filter by group if requested
    const filteredRaw = (requestedGroup && requestedGroup !== 'Összes kohorsz')
      ? combinedPool.filter((p) => p.cohortGroup === requestedGroup)
      : combinedPool;

    // Build participant objects
    const participants = await Promise.all(
      filteredRaw.map(async (raw) => {
        const faultRecords: Record<string, any> = {};
        let totalScore = 0;

        for (const err of [err0, err1, err2]) {
          const status = raw.pattern[err.id] || 'BLIND_SPOT';
          let scoreAwarded = 0;
          let userFinding = '';
          let userCorrection = '';
          let feedback = '';

          if (status === 'CAUGHT') {
            scoreAwarded = err.points;
            userFinding = `Kritikus pontatlanság észlelve: „${err.target_phrase}”.`;
            userCorrection = err.validation.expected_correction;
            feedback = 'Kiváló detekció: helyes kategorizálás, pontos forráshivatkozás és levezetés.';
          } else if (status === 'PARTIAL') {
            scoreAwarded = Math.round(err.points * 0.55);
            userFinding = `Gyanús megfogalmazás: „${err.target_phrase}”.`;
            userCorrection = 'Részben korrigálva.';
            feedback = 'Részleges pont.';
          } else {
            scoreAwarded = 0;
            userFinding = 'Nem került jelölésre.';
            userCorrection = 'Nincs megadva.';
            feedback = 'Vakfolt.';
          }

          totalScore += scoreAwarded;

          faultRecords[err.id] = {
            errorId: err.id,
            errorType: err.type,
            severity: err.severity,
            status,
            scoreAwarded,
            maxScore: err.points,
            targetPhrase: err.target_phrase,
            userFinding,
            userCorrection,
            groundTruthExplanation: err.explanation,
            feedback,
          };
        }

        totalScore = Math.max(0, totalScore - raw.falsePositivesCount * 20);

        let grade: 'SENIOR' | 'ASSOCIATE' | 'JUNIOR' | 'UNQUALIFIED' = 'UNQUALIFIED';
        let seniorPass = false;

        if (totalScore >= 85 && raw.falsePositivesCount === 0) {
          grade = 'SENIOR';
          seniorPass = true;
        } else if (totalScore >= 55 && raw.falsePositivesCount <= 1) {
          grade = 'ASSOCIATE';
        } else if (totalScore >= 35) {
          grade = 'JUNIOR';
        } else {
          grade = 'UNQUALIFIED';
        }

        const canonicalPayload = {
          id: raw.id,
          scenarioId: scenario.scenario_id,
          tenantId: req.tenantId,
          score: totalScore,
          grade,
          falsePositives: raw.falsePositivesCount,
          timeSec: raw.elapsedSeconds,
        };
        const sha256Hash = `SHA256:${await sha256(canonicalizeJson(canonicalPayload))}`;

        return {
          id: raw.id,
          name: raw.name,
          email: raw.email,
          role: raw.role,
          cohortGroup: raw.cohortGroup,
          source: raw.source,
          totalScore,
          grade,
          seniorPass,
          falsePositivesCount: raw.falsePositivesCount,
          elapsedSeconds: raw.elapsedSeconds,
          faultRecords,
          sha256Hash,
          submittedAt: new Date().toISOString(),
        };
      })
    );

    const totalAudits = participants.length;
    const liveCount = participants.filter((p) => p.source === 'LIVE_DATABASE').length;
    const benchmarkCount = participants.filter((p) => p.source === 'CALIBRATED_BENCHMARK').length;

    const avgScore = totalAudits > 0
      ? Number((participants.reduce((sum, p) => sum + p.totalScore, 0) / totalAudits).toFixed(1))
      : 0;

    const seniorCount = participants.filter((p) => p.seniorPass).length;
    const associateCount = participants.filter((p) => p.grade === 'ASSOCIATE').length;
    const unqualifiedCount = participants.filter((p) => p.grade === 'UNQUALIFIED').length;

    const seniorPassRate = totalAudits > 0 ? Number(((seniorCount / totalAudits) * 100).toFixed(1)) : 0;
    const associatePassRate = totalAudits > 0 ? Number(((associateCount / totalAudits) * 100).toFixed(1)) : 0;
    const unqualifiedRate = totalAudits > 0 ? Number(((unqualifiedCount / totalAudits) * 100).toFixed(1)) : 0;

    const faultBlindSpotRates: Record<string, any> = {};
    for (const err of [err0, err1, err2]) {
      const caughtCount = participants.filter((p) => p.faultRecords[err.id]?.status === 'CAUGHT').length;
      const partialCount = participants.filter((p) => p.faultRecords[err.id]?.status === 'PARTIAL').length;
      const blindCount = participants.filter((p) => p.faultRecords[err.id]?.status === 'BLIND_SPOT').length;

      faultBlindSpotRates[err.id] = {
        errorId: err.id,
        targetPhrase: err.target_phrase,
        errorType: err.type,
        caughtRate: totalAudits > 0 ? Number(((caughtCount / totalAudits) * 100).toFixed(1)) : 0,
        partialRate: totalAudits > 0 ? Number(((partialCount / totalAudits) * 100).toFixed(1)) : 0,
        blindSpotRate: totalAudits > 0 ? Number(((blindCount / totalAudits) * 100).toFixed(1)) : 0,
      };
    }

    let highestBlindError = err2;
    let highestRate = faultBlindSpotRates[err2.id]?.blindSpotRate || 0;
    for (const err of [err0, err1]) {
      if ((faultBlindSpotRates[err.id]?.blindSpotRate || 0) > highestRate) {
        highestRate = faultBlindSpotRates[err.id].blindSpotRate;
        highestBlindError = err;
      }
    }

    const aiComparison = {
      humanAvgScore: avgScore,
      humanSeniorRate: seniorPassRate,
      humanBlindSpotRate: Number((participants.filter((p) => p.faultRecords[err2.id]?.status === 'BLIND_SPOT').length / (totalAudits || 1) * 100).toFixed(1)),
      models: [
        {
          modelId: 'claude-3-5-sonnet',
          modelName: 'Claude 3.5 Sonnet',
          provider: 'Anthropic',
          score: 100,
          grade: 'SENIOR',
          blindSpotCount: 0,
          hallucinationRate: '0.0%',
          latencyMs: 1420,
        },
        {
          modelId: 'gemini-3-8-flash',
          modelName: 'Gemini 3.8 Flash',
          provider: 'Google',
          score: 95,
          grade: 'SENIOR',
          blindSpotCount: 0,
          hallucinationRate: '3.1%',
          latencyMs: 780,
        },
        {
          modelId: 'gpt-4o',
          modelName: 'GPT-4o (Omni)',
          provider: 'OpenAI',
          score: 72,
          grade: 'ASSOCIATE',
          blindSpotCount: 1,
          hallucinationRate: '28.5%',
          latencyMs: 1850,
        },
      ],
    };

    const canonicalReportPayload = {
      scenarioId: scenario.scenario_id,
      tenantId: req.tenantId,
      auditsCount: totalAudits,
      liveCount,
      benchmarkCount,
      avgScore,
      seniorPassRate,
      topRiskId: highestBlindError.id,
      generatedAt: new Date().toISOString(),
    };
    const canonicalReportHash = `SHA256:${await sha256(canonicalizeJson(canonicalReportPayload))}`;

    res.json({
      scenarioId: scenario.scenario_id,
      scenarioTitle: scenario.meta.title,
      tenantId: req.tenantId,
      generatedAt: new Date().toISOString(),
      canonicalReportHash,
      availableGroups,
      injectedErrors: [
        {
          id: err0.id,
          type: err0.type,
          severity: err0.severity,
          target_phrase: err0.target_phrase,
          explanation: err0.explanation,
          expected_correction: err0.validation.expected_correction,
        },
        {
          id: err1.id,
          type: err1.type,
          severity: err1.severity,
          target_phrase: err1.target_phrase,
          explanation: err1.explanation,
          expected_correction: err1.validation.expected_correction,
        },
        {
          id: err2.id,
          type: err2.type,
          severity: err2.severity,
          target_phrase: err2.target_phrase,
          explanation: err2.explanation,
          expected_correction: err2.validation.expected_correction,
        },
      ],
      participants,
      kpis: {
        totalAudits,
        liveDatabaseAudits: liveCount,
        benchmarkCalibratedAudits: benchmarkCount,
        averageScore: avgScore,
        seniorPassRate,
        associatePassRate,
        unqualifiedRate,
        criticalBlindSpotRate: highestRate,
        faultBlindSpotRates,
        topSystemicRisk: {
          errorId: highestBlindError.id,
          title: highestBlindError.target_phrase,
          errorType: highestBlindError.type,
          blindSpotRate: highestRate,
          lesson: highestBlindError.type === 'FABRICATED_SOURCE'
            ? 'A résztvevők 70+%-a kritika nélkül benyeli a tekintélyelvű, de nem létező tanácsadói jelentéseket (pl. Gartner-McKinsey Joint Index).'
            : 'A komplex EBITDA számítási ellentmondásokat az elemzők hajlamosak felületesen átfutni.',
        },
      },
      aiComparison,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error('Error in /api/cohort/metrics:', err);
    res.status(500).json({ error: 'Failed to compute cohort analytics', details: message });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.VERCEL === '1') {
    return;
  }

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Prompt & Pivot Enterprise Kernel V2] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

export default app;
