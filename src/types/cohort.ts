import type { ErrorType } from './audit';

export type FaultDetectionStatus = 'CAUGHT' | 'PARTIAL' | 'BLIND_SPOT';

export interface ParticipantFaultRecord {
  errorId: string;
  errorType: ErrorType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: FaultDetectionStatus;
  scoreAwarded: number; // 0 - 35
  maxScore: number;
  targetPhrase: string;
  userFinding?: string;
  userCorrection?: string;
  groundTruthExplanation: string;
  feedback: string;
}

export interface CohortParticipant {
  id: string;
  name: string;
  email: string;
  role: string;
  cohortGroup: string;
  totalScore: number; // 0 - 100
  grade: 'SENIOR' | 'ASSOCIATE' | 'JUNIOR' | 'UNQUALIFIED';
  seniorPass: boolean;
  falsePositivesCount: number;
  elapsedSeconds: number;
  faultRecords: Record<string, ParticipantFaultRecord>;
  sha256Hash: string;
  submittedAt: string;
}

export interface CohortSummaryKPIs {
  totalAudits: number;
  averageScore: number;
  seniorPassRate: number;
  associatePassRate: number;
  unqualifiedRate: number;
  criticalBlindSpotRate: number;
  faultBlindSpotRates: Record<string, {
    errorId: string;
    targetPhrase: string;
    errorType: ErrorType;
    caughtRate: number;
    partialRate: number;
    blindSpotRate: number;
  }>;
  topSystemicRisk: {
    errorId: string;
    title: string;
    errorType: ErrorType;
    blindSpotRate: number;
    lesson: string;
  };
}

export interface CohortAiComparison {
  humanAvgScore: number;
  humanSeniorRate: number;
  humanBlindSpotRate: number;
  models: Array<{
    modelId: string;
    modelName: string;
    provider: string;
    score: number;
    grade: string;
    blindSpotCount: number;
    hallucinationRate: string;
    latencyMs: number;
  }>;
}

export interface CohortAnalysisData {
  scenarioId: string;
  scenarioTitle: string;
  generatedAt: string;
  canonicalReportHash: string;
  availableGroups: string[];
  injectedErrors: Array<{
    id: string;
    type: ErrorType;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    target_phrase: string;
    explanation: string;
    expected_correction: string;
  }>;
  participants: CohortParticipant[];
  kpis: CohortSummaryKPIs;
  aiComparison: CohortAiComparison;
}
