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
  matchKeywordConcepts,
  extractNumbers,
  checkAdditiveEquations,
  FinancialCalculators,
} from './auditScoring.ts';
import type { InjectedError, UserAnnotation } from '../types/audit.ts';
import { SCENARIOS } from '../data/scenarios.ts';

// Legitimate answers for each scenario indexed by scenario index and error index:
// [scenarioIdx][errorIdx]
const LEGIT_BY_SCENARIO: Array<Array<{ just: string; corr: string }>> = [
  // Scenario 0: CloudPulse SaaS
  [
    // err-01 (NUMERIC: EBITDA margin)
    {
      just: 'A riport 35.2%-os EBITDA árrést állít 12.4M bevétel és 9.8M opex mellett. A valós Cash EBITDA 12.4 - 9.8 = 2.6M, így az EBITDA margin 2.6 / 12.4 = 20.97%. A 35.2% téves adat.',
      corr: '12.4 - 9.8 = 2.6M EBITDA, azaz a valós EBITDA árrés 20.97%',
    },
    // err-02 (LOGICAL: 42% turnover vs low risk)
    {
      just: 'A 42%-os fejlesztői fluktuáció súlyos kulcsemberi kockázatot jelent a csapatban, ami közvetlenül ellentmond az 1. bekezdés elhanyagolható kockázat és stabilitás állításának.',
      corr: 'A 42%-os fejlesztői elvándorlás magas kulcsemberi kockázatot jelent, ami üti a stabilitási állítást.',
    },
    // err-03 (FABRICATED: Gartner-McKinsey Joint Index)
    {
      just: 'A Gartner és a McKinsey független, rivális tanácsadó cégek, soha nem adnak ki közös Joint Index felmérést; ez a referencia fiktív hallucináció a riportban.',
      corr: 'Nem létezik Gartner-McKinsey közös index; hivatalos forrásként a Bessemer Cloud Index vagy OpenView használandó.',
    },
  ],
  // Scenario 1: Nordic Brands E-Commerce
  [
    // err-01 (NUMERIC: CAC)
    {
      just: 'Az állított 12.50€ helyett a 3.6M€ marketingköltségből és a 90 000 új vevőből a valós blended CAC 40.00€ vásárlónként (3 600 000 / 90 000 = 40).',
      corr: 'Blended CAC = 3 600 000 € / 90 000 = 40.00 € / vásárló',
    },
    // err-02 (LOGICAL: inventory turnover vs 65% cost rise)
    {
      just: 'A gyorsabb készletforgás csökkenő raktár költséget kellene jelentsen; az, hogy 65%-kal drágul a logisztika, ellentmond a méretgazdaságosságnak.',
      corr: 'A gyorsabb készletforgás nem okozhat 65%-os költségnövekedést a hatékonyság címén.',
    },
    // err-03 (FABRICATED: Shopify-Statista)
    {
      just: 'A Shopify és a Statista nem ad ki közös kiadványt; ez a forrás fiktív hallucináció, nem létezik európai hatékonysági szabványkötet ebben a formában.',
      corr: 'Nem létező közös Shopify-Statista szabványjelentés.',
    },
  ],
  // Scenario 2: NovaPay Fintech
  [
    // err-01 (NUMERIC: CAR)
    {
      just: 'Az 5.4M szavatoló tőke és a 45M RWA hányadosa pontosan 12.0% tőkemegfelelési mutatót (CAR) ad (5.4 / 45 = 12.0%), szemben az állított 24.5%-kal.',
      corr: '5.4M szavatoló tőke / 45.0M RWA = 12.0% valós CAR.',
    },
    // err-02 (LOGICAL: NPL rise to 7.8% presented as improvement)
    {
      just: 'A nem-teljesítő hitelek (NPL) 7.8%-ra ugrott szintje súlyos portfólió romlást és kockázatot jelent, ami közvetlenül ellentmond a példátlanul javuló minőség állításának.',
      corr: 'Az NPL 7.8%-ra növekedése minőségromlást jelent, nem példátlan javulást.',
    },
    // err-03 (FABRICATED: EBA Liquidity Exemption Directive)
    {
      just: 'Nem létezik ilyen EBA direktíva; a banki tőkekövetelmények a CRR rendeleten alapulnak, egyedi mentesítési jogszabály nem létezik fintech cégekre.',
      corr: 'Fiktív EBA jogszabályi hivatkozás; az EBA nem ad ki egyedi tőkementesítési direktívát.',
    },
  ],
  // Scenario 3: Project GenAI IP DeepTech
  [
    // err-01 (NUMERIC: IP Royalty Margin)
    {
      just: 'A $8.5M árbevételből levonva az $1.5M nyílt forráskódú licencdíjat és a $3.1M R&D ráfordítást, a tiszta IP árrés $3.9M, ami 45.88% ($3.9M / $8.5M), nem pedig 81.2%.',
      corr: '45.88% valós IP árrés ($3.9M / $8.5M)',
    },
    // err-02 (LOGICAL: Proprietary Copyleft)
    {
      just: 'A Copyleft (GPLv3) azt írja elő, hogy a kód nyílt, és a származékos műveket is nyílttá kell tenni. A Proprietary Copyleft fából vaskarika ellentmondás, ami elfedi a licencáttételi kockázatot.',
      corr: 'A Copyleft (GPLv3) a forráskód nyílttá tételét kötelezi; a Proprietary Copyleft önellentmondás.',
    },
    // err-03 (FABRICATED: WIPO-EPO Joint Benchmark)
    {
      just: 'A WIPO és az EPO különálló nemzetközi szervezet, nem adnak ki közös Joint AI Royalty Benchmark értékelési szabványt; a hivatkozás fiktív hallucináció.',
      corr: 'Fiktív WIPO-EPO közös kiadvány; az IP értékeléshez az IVSC (ISO 10668) szabvány használandó.',
    },
  ],
];

function makeAnnotation(
  err: InjectedError,
  just: string,
  corr: string,
  scenarioId: string = 'test-scenario',
  overrideType?: InjectedError['type']
): UserAnnotation {
  return {
    id: `ann-${err.id}`,
    scenarioId,
    target_phrase: err.target_phrase,
    selectedType: overrideType ?? err.type,
    justification: just,
    proposedCorrection: corr,
    timestamp: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// 1. Cryptographic and canonicalization baseline
// ---------------------------------------------------------------------------

test('sha256 produces exact standard cryptographic digest', async () => {
  const actual = await sha256('hello');
  assert.equal(actual, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');

  const hashA = await sha256('{"score":100,"status":"APPROVED"}');
  const hashB = await sha256('{"score":100,"status":"TAMPERED"}');
  assert.notEqual(hashA, hashB);
  assert.equal(hashA.length, 64);
});

test('canonicalizeJson strictly orders keys according to RFC 8785', () => {
  const objA = { z: 1, a: 2, m: { y: 'bar', b: 'foo' } };
  const objB = { a: 2, m: { b: 'foo', y: 'bar' }, z: 1 };
  assert.equal(canonicalizeJson(objA), '{"a":2,"m":{"b":"foo","y":"bar"},"z":1}');
  assert.equal(canonicalizeJson(objA), canonicalizeJson(objB));

  // drops undefined properties, rejects non-finite numbers
  assert.equal(canonicalizeJson({ a: 1, b: undefined }), '{"a":1}');
  assert.throws(() => canonicalizeJson({ a: NaN }), /NaN\/Infinity/);
});

test('checkPhraseMatchStrict rejects short, single-word and generic phrases', () => {
  const target = '35.2%-os EBITDA árrést';
  assert.equal(checkPhraseMatchStrict('ARR', target), false);
  assert.equal(checkPhraseMatchStrict('EBIT', target), false);
  assert.equal(checkPhraseMatchStrict('árrést', target), false);
  assert.equal(checkPhraseMatchStrict('35.2%-os EBITDA árrést', target), true);
  assert.equal(checkPhraseMatchStrict('kiemelkedő, 35.2%-os EBITDA árrést biztosít', target), true);
});

// ---------------------------------------------------------------------------
// 2. Token & concept extraction: word-boundary and number awareness
// ---------------------------------------------------------------------------

test('extractNumbers extracts decimals, spaced thousands and comma decimals', () => {
  assert.deepEqual(extractNumbers('12.4M és 9.8M különbsége 2.6'), [12.4, 9.8, 2.6]);
  assert.deepEqual(extractNumbers('3,600,000 / 90 000 = 40.0'), [3600000, 90000, 40]);
  assert.deepEqual(extractNumbers('20,97% EBITDA árrés'), [20.97]);
});

test('matchKeywordConcepts enforces boundaries and collapses numeric variants', () => {
  const kws = ['20.9', '21%', '2.6', 'működési'];

  // "140" must NOT match "40"
  const noSubNum = matchKeywordConcepts('A CAC értéke 140 dollár lett', ['40', 'cac']);
  assert.equal(noSubNum.has('n:40'), false);
  assert.equal(noSubNum.has('t:cac'), true);

  // "scarce" must NOT match "car"
  const noSubWord = matchKeywordConcepts('resources are scarce', ['car']);
  assert.equal(noSubWord.size, 0);

  // "20.9" and "21%" are treated as ONE numeric concept, not two
  const closeHits = matchKeywordConcepts('A valós margin 20.9%, kerekítve 21%', kws);
  const numConcepts = Array.from(closeHits).filter((c) => c.startsWith('n:'));
  assert.equal(numConcepts.length, 1);
});

// ---------------------------------------------------------------------------
// 3. Justification tests: grounding and structural requirements
// ---------------------------------------------------------------------------

test('evaluateJustification requires minimum length, structure, concepts and grounding', () => {
  const err = SCENARIOS[0].injected_errors[0];
  const gText = `${err.target_phrase} ${err.explanation} ${err.validation.expected_correction}`;
  const kws = err.validation.required_keywords;

  // Too short
  assert.equal(evaluateJustification('', kws, gText).isValid, false);
  assert.equal(evaluateJustification('Rövid szöveg.', kws, gText).isValid, false);

  // Character-repetition junk
  assert.equal(
    evaluateJustification('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', kws, gText).isValid,
    false
  );

  // Sentence too short (< 5 words)
  assert.equal(evaluateJustification('hibás adat 20.9 2.6', kws, gText).isValid, false);

  // Missing required keywords
  assert.equal(
    evaluateJustification(
      'Ez a pénzügyi mutató véleményem szerint teljesen hibásan lett kiszámolva az anyagban.',
      kws,
      gText
    ).isValid,
    false
  );

  // Only ONE concept
  assert.equal(
    evaluateJustification(
      'A működési eredmény számításánál láthatóan téves adatokkal dolgoztak a kollégák.',
      kws,
      gText
    ).isValid,
    false
  );

  // Numbers alone without an explanation word from the error
  assert.equal(
    evaluateJustification(
      '20.9 2.6 12.4 9.8 hibás adat a dokumentumban ma',
      kws,
      gText
    ).isValid,
    false
  );

  // Legitimate full answer passes
  const good = LEGIT_BY_SCENARIO[0][0].just;
  const res = evaluateJustification(good, kws, gText);
  assert.equal(res.isValid, true);
});

// ---------------------------------------------------------------------------
// 4. Correction tests: numeric and qualitative
// ---------------------------------------------------------------------------

test('evaluateCorrection handles numeric tolerance, worked derivations, and noise', () => {
  const numErr = SCENARIOS[0].injected_errors[0]; // EBITDA margin: [20.0, 22.0] %

  // Empty / junk
  assert.equal(evaluateCorrection('', numErr).isValid, false);
  assert.equal(evaluateCorrection('aaaaaaaaaaaa', numErr).isValid, false);

  // Non-numeric on quantitative error is REJECTED
  assert.equal(evaluateCorrection('nem tudom pontosan', numErr).isValid, false);
  assert.equal(evaluateCorrection('hibás a margin mértéke nagyon', numErr).isValid, false);

  // Out of tolerance
  assert.equal(evaluateCorrection('35.2%', numErr).isValid, false);
  assert.equal(evaluateCorrection('25.5%', numErr).isValid, false);

  // In tolerance: single number
  assert.equal(evaluateCorrection('20.97%', numErr).isValid, true);
  assert.equal(evaluateCorrection('21.0%', numErr).isValid, true);

  // In tolerance: worked derivations (first or last number in range)
  assert.equal(evaluateCorrection('12.4 - 9.8 = 2.6, így 20.97%', numErr).isValid, true);
  assert.equal(evaluateCorrection('20.97% (számítva: 2.6M / 12.4M)', numErr).isValid, true);

  // Number dump (> 6 numbers) is rejected as gaming
  assert.equal(
    evaluateCorrection('1 2 3 4 5 6 21 7 8 9', numErr).isValid,
    false
  );

  // Qualitative error (Scenario 1 Fabricated source: err-03)
  const qualErr = SCENARIOS[0].injected_errors[2];
  assert.equal(evaluateCorrection('nem tudom', qualErr).isValid, false);
  assert.equal(evaluateCorrection('fiktív forrás', qualErr).isValid, false); // < 3 words
  // "lorem ipsum" padding with one keyword fails noise ratio check
  assert.equal(
    evaluateCorrection('mckinsey lorem ipsum dolor sit amet consectetur adipiscing', qualErr).isValid,
    false
  );
  // Legitimate qualitative correction passes
  assert.equal(evaluateCorrection(LEGIT_BY_SCENARIO[0][2].corr, qualErr).isValid, true);
});

// ---------------------------------------------------------------------------
// 5. Anti-gaming test suite: keyword-stuffing + lorem ipsum cannot reach Senior
// ---------------------------------------------------------------------------

test('ADVERSARIAL: keyword stuffing + lorem ipsum is blocked from Senior rating', async () => {
  for (const scenario of SCENARIOS) {
    // Attack 1: bare keyword list
    const annBare = scenario.injected_errors.map((err) =>
      makeAnnotation(
        err,
        err.validation.required_keywords.slice(0, 3).join(' '),
        'lorem ipsum dolor',
        scenario.scenario_id
      )
    );
    const resBare = await evaluateAudit(scenario.injected_errors, annBare, 60, scenario.scenario_id);
    assert.notEqual(
      resBare.auditorReliability,
      'Senior szintű elemzői teljesítmény',
      `Scenario ${scenario.scenario_id}: bare keywords reached Senior`
    );

    // Attack 2: keywords embedded in lorem ipsum
    const annLorem = scenario.injected_errors.map((err) => {
      const kw = err.validation.required_keywords.slice(0, 2).join(' ');
      const just = `Lorem ipsum dolor sit amet ${kw} consectetur adipiscing elit sed do eiusmod tempor.`;
      const corr = err.validation.numeric_tolerance
        ? String(err.validation.numeric_tolerance.min)
        : 'lorem ipsum dolor sit amet';
      return makeAnnotation(err, just, corr, scenario.scenario_id);
    });
    const resLorem = await evaluateAudit(scenario.injected_errors, annLorem, 60, scenario.scenario_id);
    assert.notEqual(
      resLorem.auditorReliability,
      'Senior szintű elemzői teljesítmény',
      `Scenario ${scenario.scenario_id}: lorem ipsum + keywords reached Senior`
    );
  }
});

test('ADVERSARIAL: substring collisions (140 != 40, scarce != car) do not satisfy requirements', () => {
  const cacErr = SCENARIOS[1].injected_errors[0]; // CAC error: keywords ['40', '3.6', '90', 'blended', 'vevőakvizíció', 'kattintás', 'cpa', 'költség']
  const gText = `${cacErr.target_phrase} ${cacErr.explanation} ${cacErr.validation.expected_correction}`;

  // "140" does not contain "40"; "scarce" does not contain "car"
  const trickyJust = 'A marketing büdzsé 140 dollár felett scarce erőforrás maradt a cégnél.';
  const res = evaluateJustification(trickyJust, cacErr.validation.required_keywords, gText);
  // Contains only "marketing"; 140 != 40, so < 2 concepts
  assert.equal(res.isValid, false);
});

// ---------------------------------------------------------------------------
// 6. Score clamping and overflow prevention
// ---------------------------------------------------------------------------

test('totalScore is strictly clamped to maxPossibleScore and does not overflow', async () => {
  for (let sIdx = 0; sIdx < SCENARIOS.length; sIdx++) {
    const scenario = SCENARIOS[sIdx];
    const perfectAnn = scenario.injected_errors.map((err, eIdx) =>
      makeAnnotation(err, LEGIT_BY_SCENARIO[sIdx][eIdx].just, LEGIT_BY_SCENARIO[sIdx][eIdx].corr, scenario.scenario_id)
    );
    const result = await evaluateAudit(scenario.injected_errors, perfectAnn, 120, scenario.scenario_id);

    const max = scenario.injected_errors.reduce((sum, e) => sum + e.points, 0);
    assert.equal(result.totalScore, max, `Scenario ${scenario.scenario_id} score must equal maxPossibleScore`);
    assert.equal(result.maxPossibleScore, max);
    assert.ok(result.totalScore <= result.maxPossibleScore, 'totalScore must not exceed maxPossibleScore');
    assert.equal(result.auditorReliability, 'Senior szintű elemzői teljesítmény');
    assert.equal(result.truePositivesCount, scenario.injected_errors.length);
    assert.equal(result.falsePositivesCount, 0);
    assert.equal(result.missedErrorsCount, 0);
  }
});

// ---------------------------------------------------------------------------
// 7. Full scenario audit runs: every scenario achieves 100/100 with legitimate answers
// ---------------------------------------------------------------------------

test('full audit on Scenario 1 (SaaS) achieves 100/100 Senior rating', async () => {
  const sc = SCENARIOS[0];
  const anns = sc.injected_errors.map((e, idx) => makeAnnotation(e, LEGIT_BY_SCENARIO[0][idx].just, LEGIT_BY_SCENARIO[0][idx].corr, sc.scenario_id));
  const res = await evaluateAudit(sc.injected_errors, anns, 180, sc.scenario_id);

  assert.equal(res.totalScore, 100);
  assert.equal(res.truePositivesCount, 3);
  assert.equal(res.falsePositivesCount, 0);
  assert.equal(res.auditorReliability, 'Senior szintű elemzői teljesítmény');
  assert.ok(res.canonicalHash.startsWith('SHA256:'));
});

test('full audit on Scenario 2 (E-Commerce Nordic) achieves 100/100 Senior rating', async () => {
  const sc = SCENARIOS[1];
  const anns = sc.injected_errors.map((e, idx) => makeAnnotation(e, LEGIT_BY_SCENARIO[1][idx].just, LEGIT_BY_SCENARIO[1][idx].corr, sc.scenario_id));
  const res = await evaluateAudit(sc.injected_errors, anns, 210, sc.scenario_id);

  assert.equal(res.totalScore, 100);
  assert.equal(res.truePositivesCount, 3);
  assert.equal(res.falsePositivesCount, 0);
  assert.equal(res.auditorReliability, 'Senior szintű elemzői teljesítmény');
});

test('full audit on Scenario 3 (Fintech NovaPay) achieves 100/100 Senior rating', async () => {
  const sc = SCENARIOS[2];
  const anns = sc.injected_errors.map((e, idx) => makeAnnotation(e, LEGIT_BY_SCENARIO[2][idx].just, LEGIT_BY_SCENARIO[2][idx].corr, sc.scenario_id));
  const res = await evaluateAudit(sc.injected_errors, anns, 240, sc.scenario_id);

  assert.equal(res.totalScore, 100);
  assert.equal(res.truePositivesCount, 3);
  assert.equal(res.falsePositivesCount, 0);
  assert.equal(res.auditorReliability, 'Senior szintű elemzői teljesítmény');
});

test('full audit on Scenario 4 (DeepTech GenAI IP) achieves 100/100 Senior rating', async () => {
  const sc = SCENARIOS[3];
  const anns = sc.injected_errors.map((e, idx) => makeAnnotation(e, LEGIT_BY_SCENARIO[3][idx].just, LEGIT_BY_SCENARIO[3][idx].corr, sc.scenario_id));
  const res = await evaluateAudit(sc.injected_errors, anns, 240, sc.scenario_id);

  assert.equal(res.totalScore, 100);
  assert.equal(res.truePositivesCount, 3);
  assert.equal(res.falsePositivesCount, 0);
  assert.equal(res.auditorReliability, 'Senior szintű elemzői teljesítmény');
});

// ---------------------------------------------------------------------------
// 8. Deterministic integrity checksum across independent runs
// ---------------------------------------------------------------------------

test('canonicalHash is strictly deterministic and covers the evaluation payload', async () => {
  const sc = SCENARIOS[0];
  const anns = sc.injected_errors.map((e, idx) => makeAnnotation(e, LEGIT_BY_SCENARIO[0][idx].just, LEGIT_BY_SCENARIO[0][idx].corr, sc.scenario_id));

  const run1 = await evaluateAudit(sc.injected_errors, anns, 120, sc.scenario_id);
  const run2 = await evaluateAudit(sc.injected_errors, anns, 120, sc.scenario_id);

  // Both runs computed at the same minute / elapsed have identical hashes
  if (run1.submittedAt === run2.submittedAt) {
    assert.equal(run1.canonicalHash, run2.canonicalHash);
    assert.equal(run1.canonicalPayload, run2.canonicalPayload);
  }

  // Any change in elapsed time or annotations alters the hash
  const run3 = await evaluateAudit(sc.injected_errors, anns, 999, sc.scenario_id);
  assert.notEqual(run1.canonicalHash, run3.canonicalHash);
});

// ---------------------------------------------------------------------------
// 8b. Restored regression tests
// ---------------------------------------------------------------------------

test('wrong category on every item can never reach Senior rating', async () => {
  for (let si = 0; si < SCENARIOS.length; si++) {
    const sc = SCENARIOS[si];
    const anns = sc.injected_errors.map((e, idx) =>
      makeAnnotation(e, LEGIT_BY_SCENARIO[si][idx].just, LEGIT_BY_SCENARIO[si][idx].corr, sc.scenario_id, 'LOGICAL_CONTRADICTION')
    );
    const r = await evaluateAudit(sc.injected_errors, anns, 60, sc.scenario_id);
    assert.notEqual(r.auditorReliability, 'Senior szintű elemzői teljesítmény', sc.scenario_id);
  }
});

test('single-word / lone-keyword corrections are rejected for qualitative errors', () => {
  const src = SCENARIOS[0].injected_errors[2];
  assert.equal(evaluateCorrection('közös', src).isValid, false);
  assert.equal(evaluateCorrection('költség', src).isValid, false);
  assert.equal(evaluateCorrection('gartner mckinsey', src).isValid, false);
  assert.equal(evaluateCorrection('Nem létezik ilyen közös Gartner-McKinsey index', src).isValid, true);
});

test('canonicalizeJson drops undefined object members and rejects undefined array items / non-finite numbers', () => {
  assert.equal(canonicalizeJson({ b: 1, a: undefined }), '{"b":1}');
  assert.throws(() => canonicalizeJson({ a: [undefined] }));
  assert.throws(() => canonicalizeJson({ a: Infinity }));
  assert.throws(() => canonicalizeJson({ a: NaN }));
});

// ---------------------------------------------------------------------------
// 9. Financial calculators
// ---------------------------------------------------------------------------

test('FinancialCalculators match standard definitions', () => {
  assert.equal(FinancialCalculators.ebitda(12.4, 9.8), 2.6);
  assert.equal(FinancialCalculators.ebitdaMargin(12.4, 9.8), 20.97);
  assert.equal(FinancialCalculators.evMultiple(360, 24), 15.0);
  assert.equal(FinancialCalculators.blendedCac(3600000, 40000), 90.0);
  assert.equal(FinancialCalculators.ruleOf40(35, 12), 47.0);
});

test('evaluateAudit records auditMode as STRICT or GUIDED', async () => {
  const sc = SCENARIOS[0];
  const anns = sc.injected_errors.map((e, idx) => makeAnnotation(e, LEGIT_BY_SCENARIO[0][idx].just, LEGIT_BY_SCENARIO[0][idx].corr, sc.scenario_id));

  const strictRes = await evaluateAudit(sc.injected_errors, anns, 120, sc.scenario_id, 'STRICT');
  assert.equal(strictRes.auditMode, 'STRICT');

  const guidedRes = await evaluateAudit(sc.injected_errors, anns, 120, sc.scenario_id, 'GUIDED');
  assert.equal(guidedRes.auditMode, 'GUIDED');
});

test('REGRESSION: simple arithmetic falsifier rejects GenAI stale 1.3M equation', () => {
  assert.deepEqual(checkAdditiveEquations('$8.5M - $1.3M - $3.1M = $3.9M'),
    { valid: false, checked: 1 });
  assert.deepEqual(checkAdditiveEquations('$8.5M - $1.5M - $3.1M = $3.9M'),
    { valid: true, checked: 1 });
  assert.deepEqual(checkAdditiveEquations('12,4 - 9,8 = 2,6'),
    { valid: true, checked: 1 });
  assert.deepEqual(checkAdditiveEquations('12.4 - 9.8 = 9.9'),
    { valid: false, checked: 1 });
});

test('REGRESSION: incorrect explicit calculation cannot earn valid justification', () => {
  const err = SCENARIOS[3].injected_errors[0];
  const ground = [err.target_phrase, err.explanation, err.validation.expected_correction].join(' ');
  const wrong = 'A jogdíj árrés hibás, mert $8.5M - $1.3M - $3.1M = $3.9M, azaz 45.88%, nem 81.2%.';
  const correct = 'A jogdíj árrés hibás, mert $8.5M - $1.5M - $3.1M = $3.9M, azaz 45.88%, nem 81.2%.';
  assert.equal(evaluateJustification(wrong, err.validation.required_keywords, ground).isValid, false);
  assert.equal(evaluateJustification(correct, err.validation.required_keywords, ground).isValid, true);
  assert.equal(evaluateCorrection('45.88% mert 8.5 - 1.3 - 3.1 = 3.9', err).isValid, false);
});
