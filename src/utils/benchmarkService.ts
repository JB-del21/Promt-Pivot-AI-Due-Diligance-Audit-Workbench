import { authenticatedFetch } from '../auth/client';
import type { BenchmarkModelProfile, CohortMetrics } from '../types/benchmark';
import type { Scenario, EvaluationResult } from '../types/audit';

export async function fetchBenchmarkPresets(scenarioId: string): Promise<BenchmarkModelProfile[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`/api/benchmark/presets?scenarioId=${encodeURIComponent(scenarioId)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return data.models || [];
  } catch (err) {
    console.warn('Using client fallback for benchmark presets:', err);
    return [];
  }
}

export async function runLiveAIBenchmark(
  scenario: Scenario,
  modelTier: string = 'gemini-3.8-flash'
): Promise<{
  success: boolean;
  isLive: boolean;
  evaluation: EvaluationResult;
  latencyMs: number;
  note?: string;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 16000);

  const res = await authenticatedFetch('/api/benchmark/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenarioId: scenario.scenario_id,
      documentText: scenario.document_markdown,
      modelTier,
    }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.details || errData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchCohortMetrics(): Promise<CohortMetrics | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await authenticatedFetch('/api/cohort/metrics', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
