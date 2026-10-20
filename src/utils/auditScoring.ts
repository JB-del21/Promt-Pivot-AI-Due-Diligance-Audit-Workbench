import type { InjectedError, UserAnnotation, EvaluationResult, MatchDetail } from '../types/audit';

/**
 * Normalizes text for comparison: lowercases, trims, and collapses multiple whitespace.
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Calculates string overlap ratio (Jaccard token similarity + substring check).
 */
export function checkPhraseMatch(selected: string, target: string): boolean {
  const normSelected = normalizeText(selected);
  const normTarget = normalizeText(target);

  if (normSelected.length === 0 || normTarget.length === 0) return false;

  // Direct substring in either direction
  if (normSelected.includes(normTarget) || normTarget.includes(normSelected)) {
    return true;
  }

  // Word token overlap
  const selWords = new Set(normSelected.split(' '));
  const tgtWords = new Set(normTarget.split(' '));
  let intersectionCount = 0;

  for (const w of selWords) {
    if (tgtWords.has(w) && w.length > 2) {
      intersectionCount++;
    }
  }

  const unionCount = new Set([...selWords, ...tgtWords]).size;
  const jaccard = unionCount > 0 ? intersectionCount / unionCount : 0;

  return jaccard >= 0.45;
}

/**
 * Evaluates user annotations against the ground-truth injected errors of a scenario.
 */
export function evaluateAudit(
  injectedErrors: InjectedError[],
  userAnnotations: UserAnnotation[],
  elapsedSeconds: number = 0
): EvaluationResult {
  const detailedMatches: MatchDetail[] = [];
  const matchedInjectedIds = new Set<string>();
  const matchedAnnotationIds = new Set<string>();

  let totalScore = 0;
  let truePositivesCount = 0;
  let partialMatchesCount = 0;
  let falsePositivesCount = 0;

  const maxPossibleScore = injectedErrors.reduce((acc, err) => acc + err.points, 0);

  // 1. Iterate through injected errors to find matching user annotations
  for (const err of injectedErrors) {
    const matchingAnnotation = userAnnotations.find((ann) => {
      if (matchedAnnotationIds.has(ann.id)) return false;
      return checkPhraseMatch(ann.target_phrase, err.target_phrase);
    });

    if (matchingAnnotation) {
      matchedInjectedIds.add(err.id);
      matchedAnnotationIds.add(matchingAnnotation.id);

      const typeMatched = matchingAnnotation.selectedType === err.type;

      if (typeMatched) {
        truePositivesCount++;
        totalScore += err.points;
        detailedMatches.push({
          errorId: err.id,
          injectedError: err,
          userAnnotation: matchingAnnotation,
          status: 'TRUE_POSITIVE',
          scoreAwarded: err.points,
          feedbackNotes: `Helyesen azonosított hiba és pontos hibakategória. Megjegyzés: ${err.explanation}`,
        });
      } else {
        partialMatchesCount++;
        const partialPoints = Math.round(err.points * 0.5);
        totalScore += partialPoints;
        detailedMatches.push({
          errorId: err.id,
          injectedError: err,
          userAnnotation: matchingAnnotation,
          status: 'PARTIAL_MATCH',
          scoreAwarded: partialPoints,
          feedbackNotes: `A hiba helyét sikeresen beazonosítottad, de a kategória eltér. Várt kategória: ${err.type}. Megjegyzés: ${err.explanation}`,
        });
      }
    } else {
      // Injected error was missed
      detailedMatches.push({
        errorId: err.id,
        injectedError: err,
        status: 'MISSED_ERROR',
        scoreAwarded: 0,
        feedbackNotes: `Kihagyott kritikus hiba: "${err.target_phrase}". ${err.explanation}`,
      });
    }
  }

  // 2. Identify false positives (annotations that did not match any injected error)
  for (const ann of userAnnotations) {
    if (!matchedAnnotationIds.has(ann.id)) {
      falsePositivesCount++;
      const penalty = 20; // 20 points penalty per false positive
      totalScore -= penalty;

      detailedMatches.push({
        userAnnotation: ann,
        status: 'FALSE_POSITIVE',
        scoreAwarded: -penalty,
        feedbackNotes: `Téves riasztás (False Positive): A kijelölt rész ("${ann.target_phrase}") a dokumentum helytálló megállapítása. Büntetés: -20 pont.`,
      });
    }
  }

  // Clamp total score to >= 0
  const finalScore = Math.max(0, totalScore);

  // Calculate Precision and Recall
  const identifiedTotal = truePositivesCount + falsePositivesCount + (partialMatchesCount > 0 ? 0.5 * partialMatchesCount : 0);
  const precision = identifiedTotal > 0
    ? Math.min(100, Math.round(((truePositivesCount + (0.5 * partialMatchesCount)) / (userAnnotations.length || 1)) * 100))
    : 0;

  const missedErrorsCount = injectedErrors.length - matchedInjectedIds.size;
  const recall = injectedErrors.length > 0
    ? Math.round(((truePositivesCount + (0.5 * partialMatchesCount)) / injectedErrors.length) * 100)
    : 0;

  // Auditor Reliability Ranking
  let auditorReliability: 'Senior Due Diligence Auditor' | 'Associate Auditor' | 'Risk-Prone / Unverified';
  const compositeRatio = (finalScore / (maxPossibleScore || 1)) * 100;

  if (compositeRatio >= 85 && falsePositivesCount === 0) {
    auditorReliability = 'Senior Due Diligence Auditor';
  } else if (compositeRatio >= 60 && falsePositivesCount <= 1) {
    auditorReliability = 'Associate Auditor';
  } else {
    auditorReliability = 'Risk-Prone / Unverified';
  }

  // Generate pseudo-cryptographic hash
  const seedString = `${injectedErrors.length}:${userAnnotations.length}:${finalScore}:${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const generatedHash = `AUD-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}-V1`;

  return {
    totalScore: finalScore,
    maxPossibleScore,
    truePositivesCount,
    partialMatchesCount,
    falsePositivesCount,
    missedErrorsCount,
    precision,
    recall,
    auditorReliability,
    detailedMatches,
    generatedHash,
    submittedAt: new Date().toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }),
    elapsedSeconds,
  };
}

/**
 * Financial calculation utilities for M&A and Due Diligence checks.
 */
export const FinancialCalculators = {
  ebitda(revenue: number, opex: number): number {
    return Number((revenue - opex).toFixed(2));
  },
  ebitdaMargin(revenue: number, opex: number): number {
    if (revenue <= 0) return 0;
    return Number((((revenue - opex) / revenue) * 100).toFixed(2));
  },
  evMultiple(ev: number, arr: number): number {
    if (arr <= 0) return 0;
    return Number((ev / arr).toFixed(2));
  },
  blendedCac(marketingSpend: number, newCustomers: number): number {
    if (newCustomers <= 0) return 0;
    return Number((marketingSpend / newCustomers).toFixed(2));
  },
  ruleOf40(arrGrowthPercent: number, ebitdaMarginPercent: number): number {
    return Number((arrGrowthPercent + ebitdaMarginPercent).toFixed(1));
  },
};
