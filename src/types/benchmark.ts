import type { EvaluationResult, UserAnnotation, ErrorType } from './audit';

export interface BenchmarkModelProfile {
  modelId: string;
  modelName: string;
  provider: string;
  type: 'human' | 'ai_agent';
  latencyMs: number;
  hallucinationVulnerability: string;
  blindSpotRate: string;
  summary: string;
  annotations: UserAnnotation[];
  evaluation: EvaluationResult;
}

export interface CohortMetrics {
  totalAuditsConducted: number;
  seniorPassRate: string;
  criticalBlindSpotRate: {
    fabricated_sources: string;
    numeric_derivation_flaws: string;
    governance_contradictions: string;
  };
  humanVsAiComparison: {
    humanSeniorScoreAvg: number;
    aiTopScoreAvg: number;
    hallucinationRate: {
      humanAuditors: string;
      gpt4o: string;
      gemini38Flash: string;
      claude35Sonnet: string;
    };
  };
}
