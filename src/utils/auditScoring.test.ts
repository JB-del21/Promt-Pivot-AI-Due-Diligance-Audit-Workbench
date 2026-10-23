import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sha256,
  canonicalizeJson,
  normalizeText,
  checkPhraseMatchStrict,
  evaluateJustification,
  evaluateCorrection,
  evaluateAudit,
  FinancialCalculators,
} from './auditScoring.ts';
import type { InjectedError, UserAnnotation } from '../types/audit.ts';

test('sha256 produces exact standard cryptographic digest', async () => {
  // RFC test vector: "hello"
  const expected = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';
  const actual = await sha256('hello');
  assert.equal(actual, expected);

  // Tamper detection: single character alteration creates completely different hash
  const hashA = await sha256('{"score":100,"status":"APPROVED"}');
  const hashB = await sha256('{"score":100,"status":"TAMPERED"}');
  assert.notEqual(hashA, hashB);
  assert.equal(hashA.length, 64);
  assert.equal(hashB.length, 64);
});

test('canonicalizeJson strictly orders keys according to RFC 8785', () => {
  // Unordered object keys should be serialized in identical sorted order
  const objA = { z: 1, a: 2, m: { y: 'bar', b: 'foo' } };
  const objB = { a: 2, m: { b: 'foo', y: 'bar' }, z: 1 };

  const canonicalA = canonicalizeJson(objA);
  const canonicalB = canonicalizeJson(objB);

  assert.equal(canonicalA, '{"a":2,"m":{"b":"foo","y":"bar"},"z":1}');
  assert.equal(canonicalA, canonicalB);
});

test('checkPhraseMatchStrict rejects short, single-word and generic phrases', () => {
  const target = '35.2%-os EBITDA árrést';

  // Overly short string (< 6 chars) is rejected
  assert.equal(checkPhraseMatchStrict('ARR', target), false);
  assert.equal(checkPhraseMatchStrict('EBIT', target), false);

  // Generic isolated single word is rejected
  assert.equal(checkPhraseMatchStrict('árrést', target), false);

  // Substantial target phrase matches
  assert.equal(checkPhraseMatchStrict('35.2%-os EBITDA árrést', target), true);
  assert.equal(checkPhraseMatchStrict('kiemelkedő, 35.2%-os EBITDA árrést biztosít', target), true);
});

test('evaluateJustification requires minimum length, sentence structure and domain concepts', () => {
  const keywords = ['20.9', '21%', '2.6', 'működési'];

  // Empty or short justification is rejected
  assert.equal(evaluateJustification('', keywords).isValid, false);
  assert.equal(evaluateJustification('rossz szám', keywords).isValid, false);

  // Justification without required keywords is rejected
  assert.equal(
    evaluateJustification('szerintem ez a szám nem túl reális az iparágban hosszabb szöveggel sem', keywords).isValid,
    false
  );

  // Substantive justification with domain keywords and numbers is accepted
  const validRes = evaluateJustification(
    'A $12.4M bevétel és $9.8M opex mellett az EBITDA 2.6M, azaz kb. 21%',
    keywords
  );
  assert.equal(validRes.isValid, true);
});

test('evaluateCorrection validates numeric tolerance strictly when defined', () => {
  const mockNumericError: InjectedError = {
    id: 'err-01',
    type: 'NUMERIC_MISMATCH',
    target_phrase: '35.2%-os EBITDA árrést',
    explanation: 'Calculation error',
    severity: 'CRITICAL',
    points: 35,
    validation: {
      required_keywords: ['21%'],
      expected_correction: '20.97%',
      numeric_tolerance: {
        expected: 20.97,
        min: 20.0,
        max: 22.0,
        unit: '%',
      },
      rationale_criteria: 'EBITDA calculation',
    },
  };

  // Empty correction
  assert.equal(evaluateCorrection('', mockNumericError).isValid, false);

  // Number outside tolerance (e.g. 15%)
  assert.equal(evaluateCorrection('15.0%', mockNumericError).isValid, false);

  // Number inside tolerance (20.97% or 21.0%)
  assert.equal(evaluateCorrection('20.97%', mockNumericError).isValid, true);
  assert.equal(evaluateCorrection('kb 21%', mockNumericError).isValid, true);
});

// ============================================================================
// 4 SPECIFIC ADVERSARIAL TESTS REQUIRED BY CODE AUDIT
// ============================================================================

test('Adversarial Test 1: Kulcsszó-halmozás és junk indoklás kiszűrése', () => {
  const keywords = ['kulcsember', 'kockázat', 'fluktuáció', 'fejleszt', 'stabilitás'];

  // 1a. Repetitive character spam with keywords attached ("kulcsember kockázat aaaaaaaaaaaaaaaaa")
  const spamRes = evaluateJustification('kulcsember kockázat aaaaaaaaaaaaaaaaa', keywords);
  assert.equal(spamRes.isValid, false);
  assert.match(spamRes.feedback, /Hiányos mondatszerkezet|Érvénytelen indoklás/);

  // 1b. Just two keywords glued together without a meaningful sentence (< 4 words)
  const twoWordsRes = evaluateJustification('kulcsember kockázat', keywords);
  assert.equal(twoWordsRes.isValid, false);
  assert.match(twoWordsRes.feedback, /Túl rövid szöveg|Hiányos mondatszerkezet/);

  // 1c. Single keyword repetition
  const singleKwRes = evaluateJustification('kulcsember kulcsember kulcsember kulcsember', keywords);
  assert.equal(singleKwRes.isValid, false);

  // 1d. Only 1 keyword and no numbers
  const oneKwNoNum = evaluateJustification('a szervezetben a stabilitás megkérdőjelezhető a menedzsment szerint', keywords);
  assert.equal(oneKwNoNum.isValid, false);
  assert.match(oneKwNoNum.feedback, /Felszínes indoklás/);

  // 1e. Legitimate substantive sentence with 2 distinct keywords is accepted
  const legitRes = evaluateJustification(
    'A magas fluktuáció súlyos kulcsemberi kockázatot jelent a cégnél.',
    keywords
  );
  assert.equal(legitRes.isValid, true);
});

test('Adversarial Test 2: Junk helyesbítés elutasítása nem-numerikus hibánál', () => {
  const mockQualitativeError: InjectedError = {
    id: 'err-02',
    type: 'LOGICAL_CONTRADICTION',
    target_phrase: 'fejlesztői fluktuáció elérte a 42%-ot az elmúlt 12 hónapban',
    explanation: 'Ellentmondás a kulcsemberi kockázattal',
    severity: 'HIGH',
    points: 35,
    validation: {
      required_keywords: ['kulcsember', 'kockázat', 'fluktuáció'],
      expected_correction: 'A 42%-os fejlesztői elvándorlás magas kulcsemberi kockázatot jelent.',
      rationale_criteria: 'Indokolni kell a fluktuációt',
    },
  };

  // Meaningless junk string ("aaaaaaaaaaaa") must be rejected
  const junkRes = evaluateCorrection('aaaaaaaaaaaa', mockQualitativeError);
  assert.equal(junkRes.isValid, false);

  // Random word unrelated to the domain must be rejected
  const randomRes = evaluateCorrection('valami egeszen mas szoveg itt', mockQualitativeError);
  assert.equal(randomRes.isValid, false);

  // Valid domain correction matching concept keywords must be accepted
  const validRes = evaluateCorrection(
    'A magas fluktuáció valójában kritikus kulcsemberi kockázat',
    mockQualitativeError
  );
  assert.equal(validRes.isValid, true);
});

test('Adversarial Test 3: Szám nélküli helyesbítés elutasítása numerikus hibánál', () => {
  const mockNumericError: InjectedError = {
    id: 'err-01',
    type: 'NUMERIC_MISMATCH',
    target_phrase: '35.2%-os EBITDA árrést',
    explanation: 'Calculation error',
    severity: 'CRITICAL',
    points: 35,
    validation: {
      required_keywords: ['21%'],
      expected_correction: '20.97%',
      numeric_tolerance: {
        expected: 20.97,
        min: 20.0,
        max: 22.0,
        unit: '%',
      },
      rationale_criteria: 'EBITDA calculation',
    },
  };

  // Text-only "nem tudom pontosan" must be rejected for a numeric error
  const textOnlyRes = evaluateCorrection('nem tudom pontosan', mockNumericError);
  assert.equal(textOnlyRes.isValid, false);
  assert.match(textOnlyRes.feedback, /Hiányzó számszaki adat/);

  // Text-only "rossz a számítás" must be rejected
  const vagueRes = evaluateCorrection('rossz a számítás és az árrés', mockNumericError);
  assert.equal(textOnlyRes.isValid, false);

  // Numeric value inside tolerance is accepted
  const correctNumRes = evaluateCorrection('a valós érték 20.97%', mockNumericError);
  assert.equal(correctNumRes.isValid, true);
});

test('Adversarial Test 4: Pontszám-túlcsordulás (Score overflow & clamp) megelőzése', async () => {
  const injectedErrors: InjectedError[] = [
    {
      id: 'err-01',
      type: 'NUMERIC_MISMATCH',
      target_phrase: '35.2%-os EBITDA árrést',
      explanation: 'EBITDA hiba',
      severity: 'CRITICAL',
      points: 35,
      validation: {
        required_keywords: ['21%', '2.6', 'működési'],
        expected_correction: '20.97%',
        numeric_tolerance: { expected: 20.97, min: 20.0, max: 22.0, unit: '%' },
        rationale_criteria: 'Math',
      },
    },
    {
      id: 'err-02',
      type: 'LOGICAL_CONTRADICTION',
      target_phrase: 'fejlesztői fluktuáció elérte a 42%-ot az elmúlt 12 hónapban',
      explanation: 'Fluktuáció ellentmondás',
      severity: 'HIGH',
      points: 35,
      validation: {
        required_keywords: ['kulcsember', 'kockázat', 'fluktuáció'],
        expected_correction: 'A magas fluktuáció kulcsemberi kockázatot jelent.',
        rationale_criteria: 'Logic',
      },
    },
    {
      id: 'err-03',
      type: 'FABRICATED_SOURCE',
      target_phrase: '2025/Q3 CEE-SaaS Valuation & Retention Benchmark Report (Gartner-McKinsey Joint Index)',
      explanation: 'Fiktív forrás',
      severity: 'MEDIUM',
      points: 30,
      validation: {
        required_keywords: ['gartner', 'mckinsey', 'fiktív', 'nem létezik'],
        expected_correction: 'Nem létezik Gartner-McKinsey közös index.',
        rationale_criteria: 'Source',
      },
    },
  ];

  // User submits 100% correct, substantive answers for all 3 errors
  const userAnnotations: UserAnnotation[] = [
    {
      id: 'ann-1',
      scenarioId: 'test',
      target_phrase: '35.2%-os EBITDA árrést',
      selectedType: 'NUMERIC_MISMATCH',
      justification: 'A $12.4M ARR és $9.8M működési költség mellett az EBITDA 2.6M, azaz 21%',
      proposedCorrection: '20.97% valós EBITDA',
      timestamp: Date.now(),
    },
    {
      id: 'ann-2',
      scenarioId: 'test',
      target_phrase: 'fejlesztői fluktuáció elérte a 42%-ot az elmúlt 12 hónapban',
      selectedType: 'LOGICAL_CONTRADICTION',
      justification: 'A 42%-os fluktuáció egyértelmű kulcsemberi kockázatot jelent a technológiai csapatban.',
      proposedCorrection: 'A magas elvándorlás súlyos kulcsemberi kockázat',
      timestamp: Date.now(),
    },
    {
      id: 'ann-3',
      scenarioId: 'test',
      target_phrase: '2025/Q3 CEE-SaaS Valuation & Retention Benchmark Report (Gartner-McKinsey Joint Index)',
      selectedType: 'FABRICATED_SOURCE',
      justification: 'A Gartner és McKinsey rivális cégek, a közös index fiktív hallucináció a szövegben.',
      proposedCorrection: 'Nem létezik közös Gartner és McKinsey index',
      timestamp: Date.now(),
    },
  ];

  const result = await evaluateAudit(injectedErrors, userAnnotations, 120, 'test');

  // Verify that rounding of item sub-scores (35 + 35 + 30) does NOT overflow to 102
  assert.equal(result.totalScore, 100, 'A végösszeg pontosan 100 pont, nem lépi túl a maximumot (pl. 102-re)');
  assert.equal(result.maxPossibleScore, 100);
  assert.equal(result.truePositivesCount, 3);
  assert.equal(result.partialMatchesCount, 0);
  assert.equal(result.falsePositivesCount, 0);
  assert.equal(result.auditorReliability, 'Senior szintű elemzői teljesítmény');

  // Verify that the RFC 8785 canonical hash is generated
  assert.ok(result.canonicalHash.startsWith('SHA256:'));
  assert.equal(result.canonicalHash.length, 7 + 64);
});

test('FinancialCalculators produces accurate arithmetic with rounding', () => {
  assert.equal(FinancialCalculators.ebitda(12.4, 9.8), 2.6);
  assert.equal(FinancialCalculators.ebitdaMargin(12.4, 9.8), 20.97);
  assert.equal(FinancialCalculators.blendedCac(3600000, 90000), 40.0);
  assert.equal(FinancialCalculators.evMultiple(175, 12.4), 14.11);
});
