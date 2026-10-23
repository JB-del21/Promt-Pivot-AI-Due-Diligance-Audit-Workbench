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
  if (typeof obj === 'number' && !Number.isFinite(obj)) {
    throw new Error('canonicalizeJson: NaN/Infinity is not representable in RFC 8785 JSON');
  }
  if (obj === undefined) {
    throw new Error('canonicalizeJson: undefined is not representable in RFC 8785 JSON');
  }
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalizeJson(item)).join(',') + ']';
  }
  const keys = Object.keys(obj).filter((k) => (obj as Record<string, unknown>)[k] !== undefined).sort();
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

// ---------------------------------------------------------------------------
// Anti-gaming helpers (token / number based, no external dependencies)
// ---------------------------------------------------------------------------

/** Small Hungarian function-word list: these never count as domain evidence. */
const STOP_WORDS = new Set([
  'hogy', 'mert', 'mint', 'ezért', 'olyan', 'vagy', 'egy', 'azaz', 'amely', 'amelyek',
  'miatt', 'szerint', 'alatt', 'között', 'lehet', 'nincs', 'volt', 'van', 'pedig', 'mivel',
  'ahol', 'akkor', 'még', 'csak', 'nem', 'igen', 'ami', 'aki', 'azért', 'így', 'ezek',
  'azok', 'által', 'után', 'előtt', 'nagyon', 'kell', 'valós', 'valami', 'során', 'sem',
  'meg', 'már', 'ezt', 'azt', 'ebben', 'abban', 'illetve', 'tehát', 'viszont',
]);

export function tokenize(text: string): string[] {
  return normalizeText(text).split(' ').filter((w) => w.length > 0);
}

/**
 * Suffix-tolerant token comparison (Hungarian is agglutinative).
 * - short reference tokens (<= 3 chars) must match exactly ("car" never matches "scarce")
 * - long reference tokens (>= 7 chars) may lose their last two chars ("létezik" ~ "létező")
 * - the user token must START with the (trimmed) reference token, never merely contain it
 * - or be a stem (>= 6 chars) of the reference token
 */
export function tokenMatches(userTok: string, refTok: string): boolean {
  if (refTok.length <= 3) return userTok === refTok;
  const stem = refTok.length >= 7 ? refTok.slice(0, refTok.length - 2) : refTok;
  if (userTok.startsWith(stem)) return true;
  // the user may use a (reasonably long) stem of a compound/inflected reference word: "szabvány" ~ "szabványkötet"
  return userTok.length >= 6 && refTok.startsWith(userTok);
}

/** Extracts every number from free text: handles 12,4 / 3,600,000 / "90 000" / "€3.6M" / "20.97%". */
export function extractNumbers(text: string): number[] {
  const cleaned = text
    .replace(/(\d{1,3})((?:,\d{3})+)(?!\d)/g, (_m, a: string, b: string) => a + b.replace(/,/g, ''))
    .replace(/(\d)[\s\u00a0](?=\d{3}(?!\d))/g, '$1')
    .replace(/(\d),(?=\d)/g, '$1.');
  const matches = cleaned.match(/(?:(?<![\d.])-)?\d+(?:\.\d+)?/g) ?? [];
  return matches.map((m) => parseFloat(m)).filter((n) => Number.isFinite(n));
}

/**
 * Reject objectively wrong explicit additive/subtractive equations.
 * This is a narrow arithmetic falsifier, NOT proof that the wider reasoning
 * or unstated financial assumptions are sound.
 */
export function checkAdditiveEquations(text: string): { valid: boolean; checked: number } {
  const number = String.raw`(?:[$€]\s*)?(\d+(?:[.,]\d+)?)\s*[Mm]?`;
  const equations = new RegExp(
    `${number}\\\\s*([-+])\\\\s*${number}(?:\\\\s*([-+])\\\\s*${number})?\\\\s*=\\\\s*${number}`,
    'g'
  );
  const parse = (value: string) => Number(value.replace(',', '.'));
  let checked = 0;
  for (const match of text.matchAll(equations)) {
    checked++;
    const first = parse(match[1]);
    const second = parse(match[3]);
    const third = match[5] ? parse(match[5]) : 0;
    const expected = parse(match[6]);
    const actual = first + (match[2] === '+' ? second : -second) +
      (match[4] === '+' ? third : match[4] === '-' ? -third : 0);
    if (!Number.isFinite(actual) || !Number.isFinite(expected) ||
        Math.abs(actual - expected) > Math.max(0.011, Math.abs(actual) * 0.001)) {
      return { valid: false, checked };
    }
  }
  return { valid: true, checked };
}

const NUMERIC_KEYWORD = /^-?\d+(?:[.,]\d+)?\s*%?$/;

/**
 * Returns the set of distinct "concept ids" from `keywords` that the text really contains.
 * Numeric keywords match numbers (no substring hits: "140" does not contain "40"),
 * textual keywords match whole tokens / token sequences (suffix-tolerant).
 * Numeric variants of the same value ("21%" / "21.0%") collapse into one concept.
 */
export function matchKeywordConcepts(text: string, keywords: string[]): Set<string> {
  const found = new Set<string>();
  const nums = extractNumbers(text);
  const toks = tokenize(text);

  for (const kw of keywords) {
    const trimmed = kw.trim();
    if (NUMERIC_KEYWORD.test(trimmed)) {
      const kwStr = trimmed.replace('%', '').replace(',', '.').trim();
      const kwVal = parseFloat(kwStr);
      const hasDecimals = kwStr.includes('.');
      const hit = nums.some(
        (n) => n === kwVal || (hasDecimals && String(n).startsWith(String(kwVal)) && n !== 0)
      );
      if (hit) {
        // near-identical numbers (20.9 / 21 / 21.0) are the SAME idea, not two separate concepts
        const close = Array.from(found).some((id) => {
          if (!id.startsWith('n:')) return false;
          const other = parseFloat(id.slice(2));
          return Math.abs(other - kwVal) <= Math.max(0.1, 0.02 * Math.max(Math.abs(other), Math.abs(kwVal)));
        });
        if (!close) found.add(`n:${kwVal}`);
      }
      continue;
    }
    const kwToks = tokenize(trimmed);
    if (kwToks.length === 0) continue;
    for (let i = 0; i + kwToks.length <= toks.length; i++) {
      if (kwToks.every((kt, j) => tokenMatches(toks[i + j], kt))) {
        found.add(`t:${kwToks.join(' ')}`);
        break;
      }
    }
  }
  return found;
}

function contentTokens(text: string, minLen = 4): string[] {
  return tokenize(text).filter((t) => t.length >= minLen && !STOP_WORDS.has(t) && !/^\d+$/.test(t));
}

/**
 * Distinct context words (from the error's own target phrase / explanation / expected correction)
 * that the text uses and that are NOT themselves required keywords.
 */
function groundingWordHits(text: string, keywords: string[], groundingText: string): Set<string> {
  const kwToks = keywords.flatMap((k) => tokenize(k)).filter((t) => !/^\d+$/.test(t));
  const isKeywordTok = (t: string) => kwToks.some((k) => tokenMatches(t, k));
  const vocab = Array.from(new Set(contentTokens(groundingText, 5))).filter((v) => !isKeywordTok(v));

  const hits = new Set<string>();
  for (const t of contentTokens(text, 4)) {
    if (isKeywordTok(t)) continue;
    const v = vocab.find((vv) => tokenMatches(t, vv));
    if (v) hits.add(v);
  }
  return hits;
}

/**
 * "Grounding" = the answer is tied to THIS document/error, not just to the keyword list.
 * Satisfied by a number that occurs in the error context, or by >= 2 distinct
 * context words that are NOT themselves required keywords.
 */
function hasGrounding(text: string, keywords: string[], groundingText: string): boolean {
  const ctxNums = extractNumbers(groundingText);
  if (extractNumbers(text).some((n) => ctxNums.some((c) => Math.abs(c - n) < 1e-9))) return true;
  return groundingWordHits(text, keywords, groundingText).size >= 2;
}

/**
 * Evaluates the substantive quality of the auditor's justification.
 * 1. >= 20 characters, >= 5 words (>= 4 distinct), >= 5 distinct characters
 * 2. >= 2 DISTINCT required concepts, matched on token boundaries / numeric values
 * 3. Grounding in the concrete error (context number or >= 2 context words beyond the keywords)
 *
 * NOTE: this is a heuristic. It raises the cost of gaming considerably but cannot prove
 * reasoning quality; copying words from the document is still "answering". For high-stakes
 * certification add a human or LLM rubric judge on top.
 */
export function evaluateJustification(
  justification: string,
  requiredKeywords: string[],
  groundingText: string = ''
): { isValid: boolean; feedback: string } {
  const trimmed = justification.trim();
  if (trimmed.length < 20) {
    return {
      isValid: false,
      feedback: 'Hiányos indoklás: Túl rövid szöveg (min. 20 karakter szükséges). A szakmai átvilágításnál a döntést érvekkel kell alátámasztani.',
    };
  }

  if (!checkAdditiveEquations(trimmed).valid) return {
    isValid: false, feedback: 'Számszaki ellentmondás: A megadott egyenlet matematikailag hibás.'
  };

  const normJust = normalizeText(trimmed);
  if (new Set(normJust.replace(/\s+/g, '')).size < 5) {
    return {
      isValid: false,
      feedback: 'Érvénytelen indoklás: Értelmetlen vagy ismétlődő karakterekből álló bejegyzés.',
    };
  }

  const words = normJust.split(' ').filter((w) => w.length >= 2);
  if (words.length < 5 || new Set(words).size < 4) {
    return {
      isValid: false,
      feedback: 'Hiányos mondatszerkezet: A szakmai indoklásnak összefüggő állításból kell állnia (legalább 5 szó szükséges).',
    };
  }

  const concepts = matchKeywordConcepts(trimmed, requiredKeywords);
  if (concepts.size === 0) {
    return {
      isValid: false,
      feedback: 'Gyenge indoklás: Nem tartalmazza a szükséges pénzügyi/logikai kulcsfogalmakat.',
    };
  }
  if (concepts.size < 2) {
    return {
      isValid: false,
      feedback: 'Felszínes indoklás: Legalább két különböző kulcsfogalom (vagy a releváns számadat és az összefüggés) bemutatása szükséges.',
    };
  }
  // numbers alone are not an argument: without a verbal keyword concept the answer must at least
  // use >= 2 concrete words of the document/error context to explain the connection
  if (
    groundingText &&
    !Array.from(concepts).some((id) => id.startsWith('t:')) &&
    groundingWordHits(trimmed, requiredKeywords, groundingText).size < 2
  ) {
    return {
      isValid: false,
      feedback: 'Hiányos indoklás: A számadatok mellett szavakkal is meg kell fogalmazni az összefüggést (pl. mi a hiba oka).',
    };
  }

  if (groundingText && !hasGrounding(trimmed, requiredKeywords, groundingText)) {
    return {
      isValid: false,
      feedback: 'Általános indoklás: Hivatkozz a dokumentum konkrét adatára vagy állítására (szám, vagy legalább két konkrét fogalom a szövegből), ne csak kulcsszavakat sorolj.',
    };
  }

  return {
    isValid: true,
    feedback: 'Megfelelő szakmai indoklás: Az auditor világosan azonosította a probléma okát és összefüggéseit.',
  };
}

/**
 * Evaluates the auditor's proposed correction.
 * - Numeric error (numeric_tolerance defined): a number is REQUIRED. The first or the LAST number of
 *   the answer must fall inside [min, max] (so "12.4 - 9.8 = 2.6, azaz 20.97%" is accepted), and
 *   number-dumping (> 6 numbers) is rejected.
 * - Qualitative error: >= 3 words, >= 2 distinct concepts (at least one from expected_correction),
 *   and a low share of words unrelated to the error ("lorem ipsum" padding fails).
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
  if (new Set(normProp.replace(/\s+/g, '')).size < 3) {
    return {
      isValid: false,
      feedback: 'Érvénytelen korrekció: A megadott szöveg értelmetlen karakterhalmaz.',
    };
  }

  if (!checkAdditiveEquations(trimmed).valid) return {
    isValid: false, feedback: 'A helyesbítésben szereplő egyenlet matematikailag hibás.'
  };

  const v = injectedError.validation;
  const tolerance = v.numeric_tolerance;

  // Case 1: quantitative error
  if (tolerance) {
    const nums = extractNumbers(trimmed);
    if (nums.length === 0) {
      return {
        isValid: false,
        feedback: 'Hiányzó számszaki adat: A számszaki hibához kötelező konkrét korrigált számértéket megadni.',
      };
    }
    if (nums.length > 6) {
      return {
        isValid: false,
        feedback: 'Érvénytelen korrekció: Túl sok számadat; egyetlen, egyértelmű korrigált értéket adj meg.',
      };
    }
    const inRange = (n: number) => n >= tolerance.min && n <= tolerance.max;
    const first = nums[0];
    const last = nums[nums.length - 1];
    if (inRange(first) || inRange(last)) {
      const val = inRange(last) ? last : first;
      return {
        isValid: true,
        feedback: `Helyes számszaki korrekció: A megadott érték (${val}${tolerance.unit}) a számított tűréshatáron (${tolerance.min}-${tolerance.max}${tolerance.unit}) belül van.`,
      };
    }
    return {
      isValid: false,
      feedback: `Pontatlan számítás: A megadott ${last}${tolerance.unit} kívül esik az elfogadható határon (${tolerance.min}-${tolerance.max}${tolerance.unit}).`,
    };
  }

  // Case 2: qualitative error
  const userToks = tokenize(trimmed);
  const userWords = userToks.filter((t) => t.length >= 2);
  const fail = {
    isValid: false,
    feedback: `A megadott korrekció nem fedi a valós tényt (${v.expected_correction}).`,
  };
  if (userWords.length < 3) return fail;

  // concepts from expected_correction
  const expToks = Array.from(new Set(contentTokens(v.expected_correction, 4)));
  const expHits = new Set<string>();
  for (const t of userToks) {
    const e = expToks.find((ee) => tokenMatches(t, ee));
    if (e) expHits.add(`e:${e}`);
  }
  const expNums = extractNumbers(v.expected_correction);
  for (const n of extractNumbers(trimmed)) {
    if (expNums.some((c) => Math.abs(c - n) < 1e-9)) expHits.add(`en:${n}`);
  }
  const kwHits = matchKeywordConcepts(trimmed, v.required_keywords);
  const allConcepts = new Set<string>([...expHits, ...kwHits]);
  if (expHits.size < 1 || allConcepts.size < 2) return fail;

  // noise ratio: share of content words unrelated to this error
  const vocab = Array.from(
    new Set(
      contentTokens(
        [v.expected_correction, injectedError.explanation, injectedError.target_phrase, v.rationale_criteria ?? '', ...v.required_keywords].join(' '),
        4
      )
    )
  );
  const userContent = contentTokens(trimmed, 4);
  if (userContent.length > 0) {
    const unknown = userContent.filter((t) => !vocab.some((vv) => tokenMatches(t, vv))).length;
    if (unknown / userContent.length > 0.4) return fail;
  }

  return {
    isValid: true,
    feedback: 'Megfelelő szakmai korrekciós javaslat: Az azonosított ténybeli eltérés helyesbítésre került.',
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
  scenarioId: string = 'generic',
  auditMode: 'STRICT' | 'GUIDED' = 'STRICT'
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
      const groundingText = [
        err.target_phrase,
        err.explanation,
        err.validation.expected_correction,
        err.validation.rationale_criteria ?? '',
      ].join(' ');
      const justResult = evaluateJustification(
        matchingAnnotation.justification || '',
        err.validation.required_keywords,
        groundingText
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
    auditMode,
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
