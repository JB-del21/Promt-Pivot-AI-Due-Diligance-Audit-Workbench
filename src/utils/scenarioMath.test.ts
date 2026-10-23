import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS } from '../data/scenarios.js';
import { FinancialCalculators } from './auditScoring.js';

test('INDEPENDENT MATHEMATICAL VERIFICATION: Scenario 1 (CloudPulse SaaS)', () => {
  const scenario = SCENARIOS.find((s) => s.scenario_id === 'mna-saas-cloudpulse-2026')!;
  assert.ok(scenario, 'Scenario 1 must exist');

  // Ground truth inputs: ARR $12.4M, OPEX $9.8M
  const revenue = 12.4;
  const opex = 9.8;
  const actualEbitda = FinancialCalculators.ebitda(revenue, opex); // 2.6
  const actualEbitdaMargin = FinancialCalculators.ebitdaMargin(revenue, opex); // 20.97%

  assert.equal(actualEbitda, 2.6, 'EBITDA should be $2.6M');
  assert.equal(actualEbitdaMargin, 20.97, 'EBITDA Margin should be 20.97%');

  // Verify scenario injected error tolerance covers actualEbitdaMargin
  const numericErr = scenario.injected_errors.find((e) => e.type === 'NUMERIC_MISMATCH')!;
  assert.ok(numericErr, 'Numeric error must be defined');
  const tol = numericErr.validation.numeric_tolerance!;

  assert.ok(
    actualEbitdaMargin >= tol.min && actualEbitdaMargin <= tol.max,
    `Calculated EBITDA margin ${actualEbitdaMargin}% must fall within tolerance range [${tol.min}, ${tol.max}]`
  );
});

test('INDEPENDENT MATHEMATICAL VERIFICATION: Scenario 2 (Nordic Retail D2C)', () => {
  const scenario = SCENARIOS.find((s) => s.scenario_id === 'ecommerce-nordic-retail-2026')!;
  assert.ok(scenario, 'Scenario 2 must exist');

  // Ground truth inputs: Marketing spend €3.6M, New customers 90,000
  const marketingSpend = 3600000;
  const newCustomers = 90000;
  const actualBlendedCac = FinancialCalculators.blendedCac(marketingSpend, newCustomers); // €40.00

  assert.equal(actualBlendedCac, 40.0, 'Blended CAC should be €40.00');

  const numericErr = scenario.injected_errors.find((e) => e.type === 'NUMERIC_MISMATCH')!;
  assert.ok(numericErr, 'Numeric error must be defined');
  const tol = numericErr.validation.numeric_tolerance!;

  assert.ok(
    actualBlendedCac >= tol.min && actualBlendedCac <= tol.max,
    `Calculated blended CAC €${actualBlendedCac} must fall within tolerance range [${tol.min}, ${tol.max}]`
  );
});

test('INDEPENDENT MATHEMATICAL VERIFICATION: Scenario 3 (NovaPay FinTech)', () => {
  const scenario = SCENARIOS.find((s) => s.scenario_id === 'fintech-novapay-risk-2026')!;
  assert.ok(scenario, 'Scenario 3 must exist');

  // Ground truth inputs: Tier 1 capital €5.4M, RWA €45.0M
  const tier1Capital = 5.4;
  const rwa = 45.0;
  const actualTier1Car = Number(((tier1Capital / rwa) * 100).toFixed(2)); // 12.00%

  assert.equal(actualTier1Car, 12.0, 'Tier 1 CAR should be 12.00%');

  const numericErr = scenario.injected_errors.find((e) => e.type === 'NUMERIC_MISMATCH')!;
  assert.ok(numericErr, 'Numeric error must be defined');
  const tol = numericErr.validation.numeric_tolerance!;

  assert.ok(
    actualTier1Car >= tol.min && actualTier1Car <= tol.max,
    `Calculated Tier 1 CAR ${actualTier1Car}% must fall within tolerance range [${tol.min}, ${tol.max}]`
  );
});

test('INDEPENDENT MATHEMATICAL VERIFICATION: Scenario 4 (Project GenAI IP)', () => {
  const scenario = SCENARIOS.find((s) => s.scenario_id === 'mna-ai-startup-ip-royalty-2026')!;
  assert.ok(scenario, 'Scenario 4 must exist');

  // Independent Calculation:
  // Software & IP License Revenue = $8.5M
  // OSS Licensing Royalties = $1.5M
  // R&D Engineering Costs = $3.1M
  // Net IP Income = $8.5M - ($1.5M + $3.1M) = $3.9M
  // Net IP Margin % = ($3.9M / $8.5M) * 100 = 45.8823529...% -> 45.88%
  const revenue = 8.5;
  const ossFees = 1.5;
  const rndCosts = 3.1;

  const totalIpDeductions = ossFees + rndCosts; // $4.6M
  const netIpIncome = Number((revenue - totalIpDeductions).toFixed(2)); // $3.9M
  const actualIpMarginPercent = Number(((netIpIncome / revenue) * 100).toFixed(2)); // 45.88%

  assert.equal(netIpIncome, 3.9, 'Net IP Income should be $3.9M');
  assert.equal(actualIpMarginPercent, 45.88, 'Net IP Margin should be 45.88%');

  const numericErr = scenario.injected_errors.find((e) => e.type === 'NUMERIC_MISMATCH')!;
  assert.ok(numericErr, 'Numeric error must be defined');
  const tol = numericErr.validation.numeric_tolerance!;

  assert.ok(
    actualIpMarginPercent >= tol.min && actualIpMarginPercent <= tol.max,
    `Independently calculated IP margin ${actualIpMarginPercent}% must fall within tolerance range [${tol.min}, ${tol.max}]`
  );
});
