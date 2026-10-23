export type ErrorType = 'NUMERIC_MISMATCH' | 'LOGICAL_CONTRADICTION' | 'FABRICATED_SOURCE';

export interface NumericTolerance {
  expected: number;
  min: number;
  max: number;
  unit: string;
}

export interface InjectedErrorValidation {
  /** Keywords or key concepts that must be present in the user's justification */
  required_keywords: string[];
  /** Expected numerical range or exact string for the correction */
  expected_correction: string;
  /** Optional numeric tolerance parser for quantitative errors */
  numeric_tolerance?: NumericTolerance;
  /** Explanation of what an acceptable auditor justification must contain */
  rationale_criteria: string;
}

export interface InjectedError {
  id: string;
  type: ErrorType;
  target_phrase: string;
  conflicts_with_phrase?: string;
  explanation: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  points: number;
  validation: InjectedErrorValidation;
}

export interface ScenarioMeta {
  title: string;
  domain: string;
  difficulty: 'Kezdő' | 'Középhaladó' | 'Haladó / M&A';
  time_limit_sec: number;
  summary: string;
}

export interface Scenario {
  scenario_id: string;
  meta: ScenarioMeta;
  context: {
    target_name: string;
    arr?: string;
    opex?: string;
    gmv?: string;
    marketing_spend?: string;
    headcount?: number;
    churn_metric?: string;
    accounting_methodology_note?: string;
    additional_kpis: Record<string, string>;
  };
  document_markdown: string;
  injected_errors: InjectedError[];
  benchmark_notes: string[];
}

export interface UserAnnotation {
  id: string;
  scenarioId: string;
  target_phrase: string;
  startIndex?: number;
  endIndex?: number;
  selectedType: ErrorType;
  justification: string;
  proposedCorrection: string;
  timestamp: number;
}

export interface MatchScoreBreakdown {
  phraseMatchScore: number;    // Up to 35% of item points
  categoryScore: number;       // Up to 25% of item points
  justificationScore: number;  // Up to 25% of item points
  correctionScore: number;     // Up to 15% of item points
}

export interface MatchDetail {
  errorId?: string;
  injectedError?: InjectedError;
  userAnnotation?: UserAnnotation;
  status: 'TRUE_POSITIVE' | 'PARTIAL_MATCH' | 'FALSE_POSITIVE' | 'MISSED_ERROR';
  scoreAwarded: number;
  scoreBreakdown: MatchScoreBreakdown;
  feedbackNotes: string;
  justificationFeedback?: string;
  correctionFeedback?: string;
}

export interface EvaluationResult {
  totalScore: number;
  maxPossibleScore: number;
  discoveryScore: number;   // Points from finding and categorizing
  analysisScore: number;    // Points from justification and correction
  truePositivesCount: number;
  partialMatchesCount: number;
  falsePositivesCount: number;
  missedErrorsCount: number;
  precision: number; // 0 - 100
  recall: number;    // 0 - 100
  auditorReliability: 'Senior szintű elemzői teljesítmény' | 'Gyakorlott auditor (Associate szint)' | 'Fokozott kockázat / Hiányos indoklás';
  detailedMatches: MatchDetail[];
  canonicalHash: string; // True SHA-256 digest
  canonicalPayload: string; // Canonical stringified JSON used for verification
  submittedAt: string;
  elapsedSeconds: number;
  scenarioId: string;
}

export const ERROR_TYPE_LABELS: Record<ErrorType, { label: string; shortLabel: string; desc: string; color: string; bg: string; border: string }> = {
  NUMERIC_MISMATCH: {
    label: 'Adathiba / Számítási hiba',
    shortLabel: 'Adathiba',
    desc: 'Matematikai, pénzügyi vagy statisztikai elszámolás (pl. hibás árrés, EBITDA vagy szorzó).',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/40',
  },
  LOGICAL_CONTRADICTION: {
    label: 'Logikai ellentmondás / Belső rés',
    shortLabel: 'Ellentmondás',
    desc: 'A dokumentum két állítása üti egymást (pl. kockázatmentesség vs. magas kulcsemberi fluktuáció).',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
  },
  FABRICATED_SOURCE: {
    label: 'Nem létező forrás / Hallucináció',
    shortLabel: 'Fiktív forrás',
    desc: 'Kitalált tanulmányra, indexre, szabályozásra vagy nem létező benchmarking jelentésre hivatkozás.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/40',
  },
};
