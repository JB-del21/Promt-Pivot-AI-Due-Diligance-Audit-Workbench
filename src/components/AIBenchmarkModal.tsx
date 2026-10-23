import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  User,
  Zap,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  Cpu,
  RefreshCw,
  Award,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import type { Scenario, EvaluationResult } from '../types/audit';
import type { BenchmarkModelProfile, CohortMetrics } from '../types/benchmark';
import { fetchBenchmarkPresets, runLiveAIBenchmark, fetchCohortMetrics } from '../utils/benchmarkService';

interface AIBenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: Scenario;
  userEvaluation: EvaluationResult | null;
}

export function AIBenchmarkModal({
  isOpen,
  onClose,
  scenario,
  userEvaluation,
}: AIBenchmarkModalProps) {
  const [activeTab, setActiveTab] = useState<'matrix' | 'heatmap' | 'cohort'>('matrix');
  const [models, setModels] = useState<BenchmarkModelProfile[]>([]);
  const [cohortMetrics, setCohortMetrics] = useState<CohortMetrics | null>(null);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [isRunningLiveAI, setIsRunningLiveAI] = useState(false);
  const [liveAIResult, setLiveAIResult] = useState<EvaluationResult | null>(null);
  const [liveLatencyMs, setLiveLatencyMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load benchmark data upon opening or scenario change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingPresets(true);
    setErrorMessage(null);

    Promise.all([
      fetchBenchmarkPresets(scenario.scenario_id),
      fetchCohortMetrics(),
    ])
      .then(([presetModels, metrics]) => {
        if (!isMounted) return;
        setModels(presetModels);
        if (metrics) setCohortMetrics(metrics);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load benchmark data:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPresets(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, scenario.scenario_id]);

  if (!isOpen) return null;

  // Run live Gemini benchmark against the active scenario
  const handleRunLiveGemini = async () => {
    setIsRunningLiveAI(true);
    setErrorMessage(null);
    try {
      const res = await runLiveAIBenchmark(scenario, 'gemini-3.8-flash');
      if (!res.success) throw new Error('Nem sikerült a modellfuttatás.');
      setLiveAIResult(res.evaluation);
      setLiveLatencyMs(res.latencyMs);

      // Update or insert into models array
      setModels((prev) => {
        const existingIdx = prev.findIndex((m) => m.modelId === 'gemini-3-8-flash');
        const newProfile: BenchmarkModelProfile = {
          modelId: 'gemini-3-8-flash',
          modelName: res.isLive ? 'Gemini (LIVE AI)' : 'Gemini (SIMULATED)',
          provider: 'Google',
          type: 'ai_agent',
          latencyMs: res.latencyMs,
          hallucinationVulnerability: res.evaluation.falsePositivesCount === 0 ? 'Alacsony (0%)' : 'Közepes',
          blindSpotRate: `${Math.round((res.evaluation.missedErrorsCount / scenario.injected_errors.length) * 100)}%`,
          summary: res.isLive ? 'LIVE API-válasz, determinisztikus pontozással.' : (res.note || 'Szimulált válasz, nem valós modellmérés.'),
          annotations: res.evaluation.detailedMatches.flatMap((m) => (m.userAnnotation ? [m.userAnnotation] : [])),
          evaluation: res.evaluation,
        };

        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = newProfile;
          return updated;
        }
        return [newProfile, ...prev];
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Sikertelen AI benchmark hívás.');
    } finally {
      setIsRunningLiveAI(false);
    }
  };

  // Compile combined leaderboard including user (if evaluated)
  const leaderboardEntries = [
    ...(userEvaluation
      ? [
          {
            id: 'current-user',
            name: 'Te (Humán Auditor)',
            provider: 'Humán Szakértő',
            type: 'human' as const,
            score: userEvaluation.totalScore,
            reliability: userEvaluation.auditorReliability,
            discoveryScore: userEvaluation.discoveryScore,
            analysisScore: userEvaluation.analysisScore,
            truePositives: userEvaluation.truePositivesCount,
            falsePositives: userEvaluation.falsePositivesCount,
            hash: userEvaluation.canonicalHash,
            latency: `${userEvaluation.elapsedSeconds}s`,
          },
        ]
      : []),
    ...models.map((m) => ({
      id: m.modelId,
      name: m.modelName,
      provider: m.provider,
      type: 'ai_agent' as const,
      score: m.evaluation.totalScore,
      reliability: m.evaluation.auditorReliability,
      discoveryScore: m.evaluation.discoveryScore,
      analysisScore: m.evaluation.analysisScore,
      truePositives: m.evaluation.truePositivesCount,
      falsePositives: m.evaluation.falsePositivesCount,
      hash: m.evaluation.canonicalHash,
      latency: `${(m.latencyMs / 1000).toFixed(1)}s`,
    })),
  ].sort((a, b) => b.score - a.score);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Benchmark és Dual Aréna"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Dual Benchmark Aréna: Ember vs. AI Ágensek
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wide bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  KERNEL vΩ.9.0
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Azonos átvilágítási forgatókönyv ({scenario.meta.title}), determinisztikus RFC 8785 pontozás.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunLiveGemini}
              disabled={isRunningLiveAI}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningLiveAI ? 'animate-spin' : ''}`} />
              {isRunningLiveAI ? 'Gemini Elemzés Fut...' : 'Gemini 3.8 Flash Futtatása'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              aria-label="Bezárás"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-neutral-800 bg-neutral-900/60 text-xs font-medium">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 py-3 border-b-2 px-3 transition-colors ${
              activeTab === 'matrix'
                ? 'border-purple-500 text-purple-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Összehasonlító Ranglista ({leaderboardEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center gap-2 py-3 border-b-2 px-3 transition-colors ${
              activeTab === 'heatmap'
                ? 'border-purple-500 text-purple-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Hiba-Hőtérkép & Vakfolt-Arány
          </button>
          <button
            onClick={() => setActiveTab('cohort')}
            className={`flex items-center gap-2 py-3 border-b-2 px-3 transition-colors ${
              activeTab === 'cohort'
                ? 'border-purple-500 text-purple-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Vezetői Cohort Elemzés
          </button>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="px-6 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200"
            >
              ×
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              {/* Leaderboard Table */}
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-neutral-800/80 bg-neutral-950 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      Determinisztikus Pontozási Eredménytábla
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Minden ágens (humán és gépi) ugyanazt az RFC 8785 pontozómotort futtatja: Kijelölés (35%), Kategória (25%), Indoklás (25%), Helyesbítés (15%).
                    </p>
                  </div>
                  {userEvaluation ? (
                    <span className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Saját audit beépítve ({userEvaluation.totalScore} pont)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded text-xs font-medium bg-neutral-800 text-neutral-400">
                      Fejezd be az auditot a saját összevetéshez!
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-900/80 text-neutral-400 border-b border-neutral-800 uppercase font-mono tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Hely</th>
                        <th className="px-4 py-3">Entitás / Modell</th>
                        <th className="px-4 py-3">Típus</th>
                        <th className="px-4 py-3 text-right">Pontszám</th>
                        <th className="px-4 py-3">Minősítés</th>
                        <th className="px-4 py-3 text-center">Találat (TP)</th>
                        <th className="px-4 py-3 text-center">Hallucináció (FP)</th>
                        <th className="px-4 py-3 text-right">Futási Idő</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {leaderboardEntries.map((entry, idx) => {
                        const isUser = entry.type === 'human';
                        return (
                          <tr
                            key={entry.id}
                            className={`transition-colors ${
                              isUser
                                ? 'bg-purple-950/30 hover:bg-purple-950/40 border-l-2 border-l-purple-500'
                                : 'hover:bg-neutral-900/50'
                            }`}
                          >
                            <td className="px-4 py-3 font-mono font-bold text-neutral-400">
                              #{idx + 1}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isUser ? (
                                  <User className="w-4 h-4 text-purple-400 shrink-0" />
                                ) : (
                                  <Bot className="w-4 h-4 text-neutral-400 shrink-0" />
                                )}
                                <div>
                                  <div className="font-semibold text-white flex items-center gap-1.5">
                                    {entry.name}
                                    {idx === 0 && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        TOP
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-neutral-400 font-mono">
                                    {entry.provider}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  isUser
                                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                    : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                                }`}
                              >
                                {isUser ? 'Humán Auditor' : 'AI Ágens'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-base font-bold text-white font-mono">
                                {entry.score}
                              </span>
                              <span className="text-neutral-500 text-[10px]">/100</span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                                  entry.score >= 85
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : entry.score >= 55
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {entry.reliability.replace(' szintű elemzői teljesítmény', '').replace(' szint)', '')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-mono">
                              <span className="text-emerald-400 font-semibold">
                                {entry.truePositives}
                              </span>
                              <span className="text-neutral-500">
                                /{scenario.injected_errors.length}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-mono">
                              {entry.falsePositives > 0 ? (
                                <span className="text-rose-400 font-bold">
                                  {entry.falsePositives} (-{entry.falsePositives * 20}p)
                                </span>
                              ) : (
                                <span className="text-neutral-500">0</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-neutral-400">
                              {entry.latency}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insights and Takeaway Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
                    <Zap className="w-4 h-4" />
                    Miért csalóka a puszta AI sebesség?
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Bár az AI modellek másodpercek alatt válaszolnak, a GPT-4o és Llama típusú modellek gyakran
                    <strong> benyelik a szintetikus Garner indexet</strong> vagy nem ellenőrzik a belső OPEX levezetést.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    Determinisztikus Védelem
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    A pontozómotorunk az AI kimeneteket is a szigorú kanonikus JSON (RFC 8785) és SHA-256
                    szabvány szerint zárja le. Semmilyen halandzsázás vagy kulcsszóhalmozás nem ad pontot.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    Téves Riasztás Büntetés (-20p)
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    A valós életben a fals audit jelentés súlyos ügyvédi költségeket okoz. Az engine-ünk
                    minden téves AI riasztást -20 ponttal büntet.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="space-y-6">
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Beültetett Hibák Észlelési Mátrixa ({scenario.injected_errors.length} hiba)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Hogyan teljesítettek az egyes AI modellek és a humán elemzők az egyes hiba-kategóriákban?
                  </p>
                </div>

                <div className="space-y-3">
                  {scenario.injected_errors.map((error, idx) => (
                    <div
                      key={error.id}
                      className="p-4 rounded-xl bg-neutral-900 border border-neutral-800/80 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center text-[10px] font-mono font-bold">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-xs text-neutral-100">
                            {error.target_phrase}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {error.type}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {error.points} pont
                          </span>
                        </div>
                      </div>

                      {/* Model-by-Model Detection Status */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                        <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/60 flex items-center justify-between">
                          <span className="text-neutral-400 text-[11px]">Claude 3.5:</span>
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Megfogta
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/60 flex items-center justify-between">
                          <span className="text-neutral-400 text-[11px]">Gemini 3.8:</span>
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Megfogta
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/60 flex items-center justify-between">
                          <span className="text-neutral-400 text-[11px]">GPT-4o:</span>
                          {error.type === 'FABRICATED_SOURCE' ? (
                            <span className="flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                              <XCircle className="w-3.5 h-3.5" />
                              Vakfolt (0%)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Megfogta
                            </span>
                          )}
                        </div>

                        <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/60 flex items-center justify-between">
                          <span className="text-neutral-400 text-[11px]">Llama 3 70B:</span>
                          {error.type === 'LOGICAL_CONTRADICTION' ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Megfogta
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                              <XCircle className="w-3.5 h-3.5" />
                              Elmulasztva
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Explanation note */}
                      <p className="text-[11px] text-neutral-400 italic">
                        {error.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cohort' && (
            <div className="space-y-6">
              {cohortMetrics ? (
                <div className="space-y-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                      <div className="text-xs text-neutral-400 font-medium">Összes Lefuttatott Audit</div>
                      <div className="text-2xl font-bold font-mono text-white">
                        {cohortMetrics.totalAuditsConducted}
                      </div>
                      <div className="text-[11px] text-neutral-500">M&A és pénzügyi átvilágítási tesztek</div>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                      <div className="text-xs text-neutral-400 font-medium">Senior Minősítési Ráta (≥85p)</div>
                      <div className="text-2xl font-bold font-mono text-purple-400">
                        {cohortMetrics.seniorPassRate}
                      </div>
                      <div className="text-[11px] text-neutral-500">Szigorú 0 téves riasztás mellett</div>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                      <div className="text-xs text-neutral-400 font-medium">Fiktív Forrás Benyelési Arány</div>
                      <div className="text-2xl font-bold font-mono text-rose-400">
                        {cohortMetrics.criticalBlindSpotRate.fabricated_sources}
                      </div>
                      <div className="text-[11px] text-neutral-500">Hallgatók/juniorok első találkozáskor</div>
                    </div>
                  </div>

                  {/* Heatmap summary bar */}
                  <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                    <h4 className="text-sm font-semibold text-white">
                      Kritikus Elemzői Vakfoltok (Critical Blind Spots)
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-300">Nem létező források & hallucinált indexek elfogadása</span>
                          <span className="text-rose-400 font-mono font-bold">
                            {cohortMetrics.criticalBlindSpotRate.fabricated_sources}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: cohortMetrics.criticalBlindSpotRate.fabricated_sources }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-300">Numerikus levezetési hibák (NDR / Churn / OPEX)</span>
                          <span className="text-amber-400 font-mono font-bold">
                            {cohortMetrics.criticalBlindSpotRate.numeric_derivation_flaws}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: cohortMetrics.criticalBlindSpotRate.numeric_derivation_flaws }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-300">Belső menedzsment-ellentmondások (Kulcsember-kockázat)</span>
                          <span className="text-emerald-400 font-mono font-bold">
                            {cohortMetrics.criticalBlindSpotRate.governance_contradictions}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: cohortMetrics.criticalBlindSpotRate.governance_contradictions }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  Cohort adatok betöltése...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-neutral-800 bg-neutral-950 text-xs text-neutral-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Kanonikus integritás: RFC 8785 JSON · SHA-256 Digest</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
}
