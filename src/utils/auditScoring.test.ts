import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText,
  checkPhraseMatch,
  evaluateAudit,
  FinancialCalculators,
} from './auditScoring.ts';
import type { InjectedError, UserAnnotation } from '../types/audit.ts';

test('normalizeText collapses extra whitespace and trims', () => {
  assert.equal(normalizeText('  35.2%-os   EBITDA   árrést  '), '35.2%-os ebitda árrést');
});

test('checkPhraseMatch correctly identifies exact and fuzzy phrase matches', () => {
  assert.equal(
    checkPhraseMatch('35.2%-os EBITDA árrést', '35.2%-os EBITDA árrést'),
    true
  );
  // User selected slightly more context
  assert.equal(
    checkPhraseMatch('kiemelkedő, 35.2%-os EBITDA árrést biztosít', '35.2%-os EBITDA árrést'),
    true
  );
  // Totally unrelated phrase
  assert.equal(
    checkPhraseMatch('vállalat stabilitást mutat', '35.2%-os EBITDA árrést'),
    false
  );
});

test('evaluateAudit awards full points for exact match & category', () => {
  const injectedErrors: InjectedError[] = [
    {
      id: 'err-01',
      type: 'NUMERIC_MISMATCH',
      target_phrase: '35.2%-os EBITDA árrést',
      explanation: 'Opex calculation error',
      severity: 'CRITICAL',
      points: 35,
    },
    {
      id: 'err-02',
      type: 'LOGICAL_CONTRADICTION',
      target_phrase: 'fejlesztői fluktuáció elérte a 42%-ot',
      explanation: 'Key person risk contradiction',
      severity: 'HIGH',
      points: 35,
    },
  ];

  const userAnnotations: UserAnnotation[] = [
    {
      id: 'ann-1',
      scenarioId: 'test',
      target_phrase: '35.2%-os EBITDA árrést',
      selectedType: 'NUMERIC_MISMATCH',
      justification: 'Valójában 21%',
      proposedCorrection: '20.96%',
      timestamp: Date.now(),
    },
  ];

  const result = evaluateAudit(injectedErrors, userAnnotations, 120);

  assert.equal(result.truePositivesCount, 1);
  assert.equal(result.partialMatchesCount, 0);
  assert.equal(result.falsePositivesCount, 0);
  assert.equal(result.missedErrorsCount, 1);
  assert.equal(result.totalScore, 35);
  assert.equal(result.maxPossibleScore, 70);
  assert.equal(result.precision, 100);
  assert.equal(result.recall, 50);
});

test('evaluateAudit penalizes false positives with -20 points', () => {
  const injectedErrors: InjectedError[] = [
    {
      id: 'err-01',
      type: 'NUMERIC_MISMATCH',
      target_phrase: '35.2%-os EBITDA árrést',
      explanation: 'Opex calculation error',
      severity: 'CRITICAL',
      points: 35,
    },
  ];

  // User flags something that is NOT an error
  const userAnnotations: UserAnnotation[] = [
    {
      id: 'ann-fake',
      scenarioId: 'test',
      target_phrase: 'a társaság 12.4 millió dolláros ARR mellett',
      selectedType: 'NUMERIC_MISMATCH',
      justification: 'Nem tetszik a szám',
      proposedCorrection: '10M',
      timestamp: Date.now(),
    },
  ];

  const result = evaluateAudit(injectedErrors, userAnnotations, 60);

  assert.equal(result.falsePositivesCount, 1);
  assert.equal(result.truePositivesCount, 0);
  assert.equal(result.totalScore, 0); // clamped to 0 from -20
  assert.equal(result.auditorReliability, 'Risk-Prone / Unverified');
});

test('evaluateAudit awards 50% partial credit if phrase is right but category wrong', () => {
  const injectedErrors: InjectedError[] = [
    {
      id: 'err-01',
      type: 'LOGICAL_CONTRADICTION',
      target_phrase: 'fejlesztői fluktuáció elérte a 42%-ot',
      explanation: 'Contradiction with stability claim',
      severity: 'HIGH',
      points: 30,
    },
  ];

  const userAnnotations: UserAnnotation[] = [
    {
      id: 'ann-1',
      scenarioId: 'test',
      target_phrase: 'fejlesztői fluktuáció elérte a 42%-ot',
      selectedType: 'NUMERIC_MISMATCH', // Marked as numeric instead of logical
      justification: 'Szerintem túl magas a szám',
      proposedCorrection: '',
      timestamp: Date.now(),
    },
  ];

  const result = evaluateAudit(injectedErrors, userAnnotations, 90);

  assert.equal(result.partialMatchesCount, 1);
  assert.equal(result.truePositivesCount, 0);
  assert.equal(result.totalScore, 15); // 50% of 30
});

test('FinancialCalculators produces accurate arithmetic', () => {
  // $12.4M ARR, $9.8M opex -> $2.6M EBITDA -> 20.97% margin
  assert.equal(FinancialCalculators.ebitda(12.4, 9.8), 2.6);
  assert.equal(FinancialCalculators.ebitdaMargin(12.4, 9.8), 20.97);

  // Blended CAC: €3,600,000 / 90,000 customers = €40.00
  assert.equal(FinancialCalculators.blendedCac(3600000, 90000), 40.0);
});
