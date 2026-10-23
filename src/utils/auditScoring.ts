import type {
  InjectedError,
  UserAnnotation,
  EvaluationResult,
  MatchDetail,
  MatchScoreBreakdown,
} from '../types/audit';

/**
 * Standard Web Crypto API SHA-256 digest.
 * Supported natively across modern browsers and Node.js 18+.
 */
export async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await globalThis.crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * RFC 8785 compliant Canonical JSON serializer.
 * Recursively sorts object keys in UTF-16 code unit lexicographical order
 * to produce a deterministic, tamper-evident string representation.
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalizeJson(item)).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(
    (key) => `${JSON.stringify(key)}:${canonicalizeJson((obj as Record<string, unknown>)[key])}`
  );
  return '{' + pairs.join(',') + '}';
}

/**
 * Normalizes text for comparison: lowercases, trims, and collapses multiple whitespace.
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Strict phrase matcher:
 * - Rejects selections shorter than 6 characters or fewer than 2 words (unless exact match).
 * - Requires at least 50% length ratio on substring matching with min 10 characters.
 * - Requires at least 65% token Jaccard overlap on longer token subsets.
 * - Prevents isolated single generic words from claiming full phrase matches.
 */
export function checkPhraseMatchStrict(selected: string, target: string): boolean {
  const normSelected = normalizeText(selected);
  const normTarget = normalizeText(target);

  if (normSelected.length < 6 || normTarget.length < 6) return false;

  // Exact normalized match
  if (normSelected === normTarget) return true;

  const selTokens = normSelected.split(' ').filter((w) => w.length > 0);
  const tgtTokens = normTarget.split(' ').filter((w) => w.length > 0);
  if (selTokens.length < 2 && normSelected !== normTarget) return false;

  // Substring check with strict minimum coverage (at least 50% length ratio and min 10 chars)
  const minLen = Math.min(normSelected.length, normTarget.length);
  const maxLen = Math.max(normSelected.length, normTarget.length);
  const lengthRatio = minLen / maxLen;

  if (normSelected.includes(normTarget) || normTarget.includes(normSelected)) {
    if (minLen >= 10 && lengthRatio >= 0.50) {
      return true;
    }
  }

  // Token-level Jaccard similarity for words > 2 chars
  const selWords = selTokens.filter((w) => w.length > 2);
  const tgtWords = tgtTokens.filter((w) => w.length > 2);

  if (selWords.length === 0 || tgtWords.length === 0) return false;

  let intersectionCount = 0;
  const tgtSet = new Set(tgtWords);
  for (const w of selWords) {
    if (tgtSet.has(w)) intersectionCount++;
  }

  const unionSet = new Set([...selWords, ...tgtWords]);
  const jaccard = unionSet.size > 0 ? intersectionCount / unionSet.size : 0;

  return jaccard >= 0.65;
}

/**
 * Evaluates the substantive quality of the auditor's justification.
 * Enforces anti-bypass rules:
 * 1. Minimum length (>= 20 non-whitespace characters)
 * 2. Meaningful sentence structure (>= 4 words, >= 3 distinct words)
 * 3. Anti-junk / character entropy check (prevents repeated characters like 'aaaaaaaa')
 * 4. Concept requirement: at least 2 distinct domain keywords OR at least 1 keyword AND 1 numeric datum
 */
export function evaluateJustification(
  justification: string,
  requiredKeywords: string[]
): { isValid: boolean; feedback: string } {
  const trimmed = justification.trim();
  if (trimmed.length < 20) {
    return {
      isValid: false,
      feedback: 'Hiányos indoklás: Túl rövid szöveg (min. 20 karakter szükséges). A szakmai átvilágításnál a döntést érvekkel kell alátámasztani.',
    };
  }

  const normJust = normalizeText(trimmed);

  // Anti-junk: character variety check (prevents single-letter repetition)
  const nonWhitespaceChars = normJust.replace(/\s+/g, '');
  const uniqueChars = new Set(nonWhitespaceChars);
  if (uniqueChars.size < 5) {
    return {
      isValid: false,
      feedback: 'Érvénytelen indoklás: Értelmetlen vagy ismétlődő karakterekből álló bejegyzés.',
    };
  }

  // Word count check
  const words = normJust.split(' ').filter((w) => w.length >= 2);
  const uniqueWords = new Set(words);
  if (words.length < 4 || uniqueWords.size < 3) {
    return {
      isValid: false,
      feedback: 'Hiányos mondatszerkezet: A szakmai indoklásnak összefüggő állításból kell állnia (legalább 4 szó szükséges).',
    };
  }

  // Count distinct matching required keywords
  const matchedKeywords = requiredKeywords.filter((kw) => {
    const normKw = normalizeText(kw);
    return normJust.includes(normKw);
  });

  // Check if a number/percentage is present
  const hasNumber = /\d+(\.\d+)?%?/.test(trimmed);

  // Must have at least 2 distinct keywords OR (1 keyword AND 1 number)
  if (matchedKeywords.length === 0) {
    return {
      isValid: false,
      feedback: 'Gyenge indoklás: Nem tartalmazza a szükséges pénzügyi/logikai kulcsfogalmakat.',
    };
  }

  if (matchedKeywords.length < 2 && !hasNumber) {
    return {
      isValid: false,
      feedback: 'Felszínes indoklás: Egyetlen kulcsszó önmagában nem elég; fejtsd ki legalább két kulcsfogalommal vagy konkrét számadat és összefüggés bemutatásával.',
    };
  }

  return {
    isValid: true,
    feedback: 'Megfelelő szakmai indoklás: Az auditor világosan azonosította a probléma okát és összefüggéseit.',
  };
}

/**
 * Evaluates the auditor's proposed correction against numerical tolerance or concept string.
 * Strictly separates quantitative and qualitative error validation:
 * - If numeric tolerance exists: REQUIRES a numeric value within tolerance. Missing number returns false.
 * - If non-numeric: REQUIRES a specific domain concept/keyword match and rejects arbitrary junk text.
 */
export function evaluateCorrection(
  proposedCorrection: string,
  injectedError: InjectedError
): { isValid: boolean; feedback: string } {
  const trimmed = proposedCorrection.trim();
  if (trimmed.length < 2) {
    return {
      isValid: false,
      feedback: 'Hiányzó helyesbítés: Nincs megadva a korrigált adat vagy ténybeli állítás.',
    };
  }

  const normProp = normalizeText(trimmed);

  // Anti-junk check: reject repetitive characters
  const nonWhitespaceChars = normProp.replace(/\s+/g, '');
  const uniqueChars = new Set(nonWhitespaceChars);
  if (uniqueChars.size < 3) {
    return {
      isValid: false,
      feedback: 'Érvénytelen korrekció: A megadott szöveg értelmetlen karakterhalmaz.',
    };
  }

  const tolerance = injectedError.validation.numeric_tolerance;

  // Case 1: Numeric error validation (Hard requirement for numeric input)
  if (tolerance) {
    const match = trimmed.replace(',', '.').match(/-?\d+(\.\d+)?/);
    if (!match) {
      return {
        isValid: false,
        feedback: 'Hiányzó számszaki adat: A számszaki hibához kötelező konkrét korrigált számértéket megadni.',
      };
    }

    const val = parseFloat(match[0]);
    if (val >= tolerance.min && val <= tolerance.max) {
      return {
        isValid: true,
        feedback: `Helyes számszaki korrekció: A megadott érték (${val}${tolerance.unit}) a számított tűréshatáron (${tolerance.min}-${tolerance.max}${tolerance.unit}) belül van.`,
      };
    } else {
      return {
        isValid: false,
        feedback: `Pontatlan számítás: A megadott ${val}${tolerance.unit} kívül esik az elfogadható határon (${tolerance.min}-${tolerance.max}${tolerance.unit}).`,
      };
    }
  }

  // Case 2: Qualitative error validation (Concept matching without length-based fallback)
  const normExp = normalizeText(injectedError.validation.expected_correction);
  const stopWords = new Set(['hogy', 'mert', 'mint', 'ezért', 'nemzetközi', 'olyan', 'vagy', 'egy', 'valós', 'kell']);
  const conceptWords = normExp
    .split(' ')
    .filter((w) => w.length >= 4 && !stopWords.has(w));

  const matchedConceptWord = conceptWords.some((w) => normProp.includes(w));
  const matchedRequiredKeyword = injectedError.validation.required_keywords.some((kw) => {
    const normKw = normalizeText(kw);
    return normProp.includes(normKw);
  });

  if (matchedConceptWord || matchedRequiredKeyword) {
    return {
      isValid: true,
      feedback: 'Megfelelő szakmai korrekciós javaslat: Az azonosított ténybeli eltérés helyesbítésre került.',
    };
  }

  return {
    isValid: false,
    feedback: `A megadott korrekció nem fedi a valós tényt (${injectedError.validation.expected_correction}).`,
  };
}

/**
 * Pure, strict multi-tier audit evaluator.
 * Scores per injected item (strictly capped to err.points to eliminate rounding overflow):
 * - Discovery (35%)
 * - Category Classification (25%)
 * - Substantive Justification (25%)
 * - Validated Correction (Remainder up to 100% of err.points, typically 15%)
 * False Positive penalty: -20 points
 * Final total score strictly clamped to [0, maxPossibleScore].
 */
export async function evaluateAudit(
  injectedErrors: InjectedError[],
  userAnnotations: UserAnnotation[],
  elapsedSeconds: number = 0,
  scenarioId: string = 'generic'
): Promise<EvaluationResult> {
  const detailedMatches: MatchDetail[] = [];
  const matchedInjectedIds = new Set<string>();
  const matchedAnnotationIds = new Set<string>();

  let totalScore = 0;
  let discoveryScore = 0;
  let analysisScore = 0;
  let truePositivesCount = 0;
  let partialMatchesCount = 0;
  let falsePositivesCount = 0;

  const maxPossibleScore = injectedErrors.reduce((acc, err) => acc + err.points, 0);

  // 1. Iterate through injected errors to match user annotations
  for (const err of injectedErrors) {
    const matchingAnnotation = userAnnotations.find((ann) => {
      if (matchedAnnotationIds.has(ann.id)) return false;
      return checkPhraseMatchStrict(ann.target_phrase, err.target_phrase);
    });

    if (matchingAnnotation) {
      matchedInjectedIds.add(err.id);
      matchedAnnotationIds.add(matchingAnnotation.id);

      // Discovery: 35% of item points
      const phraseMatchScore = Math.round(err.points * 0.35);

      // Category: 25% of item points
      const typeMatched = matchingAnnotation.selectedType === err.type;
      const categoryScore = typeMatched ? Math.round(err.points * 0.25) : 0;

      // Justification: 25% of item points
      const justResult = evaluateJustification(
        matchingAnnotation.justification || '',
        err.validation.required_keywords
      );
      const justificationScore = justResult.isValid ? Math.round(err.points * 0.25) : 0;

      // Correction: remainder of item points so itemTotal never exceeds err.points
      const corrResult = evaluateCorrection(
        matchingAnnotation.proposedCorrection || '',
        err
      );
      const maxCorrectionScore = Math.max(
        0,
        err.points - (Math.round(err.points * 0.35) + 2 * Math.round(err.points * 0.25))
      );
      const correctionScore = corrResult.isValid ? maxCorrectionScore : 0;

      const itemTotal = phraseMatchScore + categoryScore + justificationScore + correctionScore;
      totalScore += itemTotal;
      discoveryScore += (phraseMatchScore + categoryScore);
      analysisScore += (justificationScore + correctionScore);

      const breakdown: MatchScoreBreakdown = {
        phraseMatchScore,
        categoryScore,
        justificationScore,
        correctionScore,
      };

      if (typeMatched && justResult.isValid && corrResult.isValid) {
        truePositivesCount++;
        detailedMatches.push({
          errorId: err.id,
          injectedError: err,
          userAnnotation: matchingAnnotation,
          status: 'TRUE_POSITIVE',
          scoreAwarded: itemTotal,
          scoreBreakdown: breakdown,
          feedbackNotes: `Helyesen azonosított hiba és teljes körűen alátámasztott szakmai elemzés (${err.explanation}).`,
          justificationFeedback: justResult.feedback,
          correctionFeedback: corrResult.feedback,
        });
      } else {
        partialMatchesCount++;
        detailedMatches.push({
          errorId: err.id,
          injectedError: err,
          userAnnotation: matchingAnnotation,
          status: 'PARTIAL_MATCH',
          scoreAwarded: itemTotal,
          scoreBreakdown: breakdown,
          feedbackNotes: `Részleges eredmény: A hiba helyét beazonosítottad, de ${
            !typeMatched ? 'a kategória téves' : ''
          }${!justResult.isValid ? (typeMatched ? '' : ', ') + 'az indoklás hiányos' : ''}${
            !corrResult.isValid ? ' és a helyesbítés elmaradt vagy pontatlan' : ''
          }. (${err.explanation})`,
          justificationFeedback: justResult.feedback,
          correctionFeedback: corrResult.feedback,
        });
      }
    } else {
      // Injected error was missed
      detailedMatches.push({
        errorId: err.id,
        injectedError: err,
        status: 'MISSED_ERROR',
        scoreAwarded: 0,
        scoreBreakdown: { phraseMatchScore: 0, categoryScore: 0, justificationScore: 0, correctionScore: 0 },
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
        scoreBreakdown: { phraseMatchScore: 0, categoryScore: 0, justificationScore: 0, correctionScore: 0 },
        feedbackNotes: `Téves riasztás (False Positive): A kijelölt rész ("${ann.target_phrase}") a dokumentum helytálló megállapítása. Büntetés: -20 pont.`,
      });
    }
  }

  // Strict Clamping to prevent overflow past maxPossibleScore
  const finalScore = Math.min(maxPossibleScore, Math.max(0, totalScore));
  const clampedDiscoveryScore = Math.min(maxPossibleScore, Math.max(0, discoveryScore));
  const clampedAnalysisScore = Math.min(maxPossibleScore, Math.max(0, analysisScore));

  // Precision and Recall
  const identifiedTotal = userAnnotations.length;
  const precision = identifiedTotal > 0
    ? Math.min(100, Math.round(((truePositivesCount + 0.5 * partialMatchesCount) / identifiedTotal) * 100))
    : 0;

  const missedErrorsCount = injectedErrors.length - matchedInjectedIds.size;
  const recall = injectedErrors.length > 0
    ? Math.round(((truePositivesCount + 0.5 * partialMatchesCount) / injectedErrors.length) * 100)
    : 0;

  // Composite Ratio strictly clamped to [0, 100]
  const compositeRatio = maxPossibleScore > 0
    ? Math.min(100, Math.max(0, (finalScore / maxPossibleScore) * 100))
    : 0;

  // Professional Nomenclature:
  // Requires >= 85% composite score AND substantive analysis (>= 60% of possible analysis points) AND 0 false alarms
  let auditorReliability: 'Senior szintű elemzői teljesítmény' | 'Gyakorlott auditor (Associate szint)' | 'Fokozott kockázat / Hiányos indoklás';

  const maxPossibleAnalysis = injectedErrors.reduce(
    (acc, err) =>
      acc +
      Math.round(err.points * 0.25) +
      Math.max(0, err.points - (Math.round(err.points * 0.35) + 2 * Math.round(err.points * 0.25))),
    0
  );
  const minRequiredAnalysis = Math.round(maxPossibleAnalysis * 0.60);

  if (compositeRatio >= 85 && clampedAnalysisScore >= minRequiredAnalysis && falsePositivesCount === 0) {
    auditorReliability = 'Senior szintű elemzői teljesítmény';
  } else if (compositeRatio >= 55 && clampedAnalysisScore > 0 && falsePositivesCount <= 1) {
    auditorReliability = 'Gyakorlott auditor (Associate szint)';
  } else {
    auditorReliability = 'Fokozott kockázat / Hiányos indoklás';
  }

  const submittedAt = new Date().toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' });

  // RFC 8785 Canonical JSON representation for SHA-256 integrity checksum
  // Covering all salient evaluation fields, annotations, and audit outcomes
  const canonicalObject = {
    analysisScore: clampedAnalysisScore,
    annotations: userAnnotations.map((a) => ({
      correction: a.proposedCorrection.trim(),
      justification: a.justification.trim(),
      phrase: a.target_phrase,
      type: a.selectedType,
    })),
    auditorReliability,
    detailedMatches: detailedMatches.map((m) => ({
      errorId: m.errorId || null,
      scoreAwarded: m.scoreAwarded,
      status: m.status,
    })),
    discoveryScore: clampedDiscoveryScore,
    elapsedSeconds,
    falsePositivesCount,
    maxPossibleScore,
    missedErrorsCount,
    partialMatchesCount,
    precision,
    recall,
    scenarioId,
    submittedAt,
    totalScore: finalScore,
    truePositivesCount,
  };

  const canonicalPayload = canonicalizeJson(canonicalObject);
  const digest = await sha256(canonicalPayload);
  const canonicalHash = `SHA256:${digest}`;

  return {
    totalScore: finalScore,
    maxPossibleScore,
    discoveryScore: clampedDiscoveryScore,
    analysisScore: clampedAnalysisScore,
    truePositivesCount,
    partialMatchesCount,
    falsePositivesCount,
    missedErrorsCount,
    precision,
    recall,
    auditorReliability,
    detailedMatches,
    canonicalHash,
    canonicalPayload,
    submittedAt,
    elapsedSeconds,
    scenarioId,
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
