import React, { useState } from 'react';
import {
  Printer,
  Download,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  FileCheck,
  Award,
  Key,
  Lock,
  ChevronDown,
  ChevronUp,
  Cpu,
  Users,
  Smartphone,
} from 'lucide-react';
import type { Scenario, EvaluationResult } from '../types/audit';
import { useAudit } from '../context/AuditContext';

interface AuditReportViewProps {
  scenario: Scenario;
  evaluation: EvaluationResult;
  onReset: () => void;
  onSelectNextScenario?: () => void;
  onOpenBenchmark?: () => void;
  onOpenCohort?: () => void;
}

export const AuditReportView: React.FC<AuditReportViewProps> = ({
  scenario,
  evaluation,
  onReset,
  onSelectNextScenario,
  onOpenBenchmark,
  onOpenCohort,
}) => {
  const { setIsAndroidModalOpen, serverSync } = useAudit();
  const [copied, setCopied] = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  const getReliabilityBadge = (rank: string) => {
    switch (rank) {
      case 'Senior szintű elemzői teljesítmény':
        return {
          label: 'Senior szintű elemzői teljesítmény (Kiváló)',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
        };
      case 'Gyakorlott auditor (Associate szint)':
        return {
          label: 'Gyakorlott auditor (Associate szint)',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
        };
      default:
        return {
          label: 'Fokozott kockázat / Hiányos indoklás',
          color: 'text-rose-400',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
        };
    }
  };

  const badge = getReliabilityBadge(evaluation.auditorReliability);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(evaluation, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit_report_${evaluation.canonicalHash.replace('SHA256:', '').slice(0, 12)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyMarkdown = () => {
    const md = `# AI Due Diligence Audit Report
**Dokumentum:** ${scenario.meta.title}
**Célvállalat:** ${scenario.context.target_name}
**Audit SHA-256 Hash:** ${evaluation.canonicalHash}
**Dátum:** ${evaluation.submittedAt}
**Minősítés:** ${evaluation.auditorReliability}
**Összpontszám:** ${evaluation.totalScore} / ${evaluation.maxPossibleScore} pont
- **Detektálás & Kategória (Discovery):** ${evaluation.discoveryScore} pont
- **Érdemi Indoklás & Helyesbítés (Analysis):** ${evaluation.analysisScore} pont
**Precizitás:** ${evaluation.precision}% | **Lefedettség:** ${evaluation.recall}%
**Téves riasztások (False Positives):** ${evaluation.falsePositivesCount}

## Részletes Eredmények
${evaluation.detailedMatches
  .map(
    (m, i) =>
      `### #${i + 1} ${m.status} (${m.scoreAwarded > 0 ? `+${m.scoreAwarded}` : m.scoreAwarded} pont)\n- **Megállapítás:** ${m.feedbackNotes}\n${m.justificationFeedback ? `- **Indoklás értékelése:** ${m.justificationFeedback}\n` : ''}${m.correctionFeedback ? `- **Helyesbítés:** ${m.correctionFeedback}\n` : ''}`
  )
  .join('\n')}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 bg-neutral-950 overflow-y-auto overflow-x-hidden px-3 sm:px-6 py-6 sm:py-8 lg:px-12 select-text w-full max-w-full">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 print-page w-full max-w-full">
        <div role="status" className={`rounded-lg border px-3 py-2 text-xs ${serverSync.state === 'PERSISTED' ? 'border-emerald-700 text-emerald-300' : serverSync.state === 'FAILED' ? 'border-red-700 text-red-300' : 'border-amber-700 text-amber-300'}`}>
          {serverSync.message}
        </div>
        {/* Actions Bar (hidden on print) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-neutral-900 border border-neutral-800 no-print w-full max-w-full overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-neutral-200 shrink-0">
              Audit Kiértékelés Elkészült
            </span>
            <span className="text-xs font-mono text-neutral-500 truncate max-w-full sm:max-w-[200px]" title={evaluation.canonicalHash}>
              · {evaluation.canonicalHash}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto">
            <button
              onClick={handleCopyMarkdown}
              className="flex-1 sm:flex-none min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors min-h-[38px] sm:min-h-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{copied ? 'Másolva!' : 'Markdown'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex-1 sm:flex-none min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors min-h-[38px] sm:min-h-0"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">JSON Export</span>
            </button>

            {onOpenBenchmark && (
              <button
                onClick={onOpenBenchmark}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all font-medium min-h-[38px] sm:min-h-0"
              >
                <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">AI Benchmark Aréna</span>
              </button>
            )}

            {onOpenCohort && (
              <button
                onClick={onOpenCohort}
                className="flex-1 sm:flex-none min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all font-medium min-h-[38px] sm:min-h-0"
              >
                <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Kohorsz Hőtérkép</span>
              </button>
            )}

            <button
              onClick={() => setIsAndroidModalOpen(true)}
              className="flex-1 sm:flex-none min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all font-medium min-h-[38px] sm:min-h-0"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Android Mobil App</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none min-w-[120px] flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded bg-neutral-100 hover:bg-white text-neutral-950 font-semibold transition-colors min-h-[38px] sm:min-h-0"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
              <span className="truncate">Nyomtatás / PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Executive Document Sheet */}
        <article className="p-4 sm:p-8 md:p-12 rounded-xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-6 sm:space-y-8 text-neutral-200 w-full max-w-full overflow-hidden">
          {/* Document Header */}
          <div className="border-b border-neutral-800 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
                  CONFIDENTIAL // M&A DUE DILIGENCE AUDIT REPORT
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 tracking-tight">
                AI Szintetikus Tartalom Audit Jelentés
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-xs text-neutral-400">
                  Eset: <strong className="text-neutral-200">{scenario.meta.title}</strong> · Célvállalat: <strong className="text-neutral-200">{scenario.context.target_name}</strong>
                </p>
                {evaluation.auditMode === 'STRICT' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                    Vak Munkalap (Szigorú Mód)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-800 text-neutral-300 border border-neutral-700 uppercase tracking-wider">
                    Irányított Mód (Didaktikai)
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-xs space-y-1">
              <div className="text-neutral-400 flex items-center gap-1 sm:justify-end">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>SHA-256 Hash:</span>
              </div>
              <div className="text-emerald-400 font-bold text-[11px] truncate max-w-full sm:max-w-[280px]" title={evaluation.canonicalHash}>
                {evaluation.canonicalHash}
              </div>
              <div className="text-neutral-400">Dátum: <span className="text-neutral-300">{evaluation.submittedAt}</span></div>
              <div className="text-neutral-400">Időtartam: <span className="text-neutral-300">{Math.floor(evaluation.elapsedSeconds / 60)}p {evaluation.elapsedSeconds % 60}mp</span></div>
            </div>
          </div>

          {/* Score & Reliability Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 rounded-lg bg-neutral-950 border border-neutral-800">
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
                Auditori Minősítés
              </span>
              <span className={`text-xs font-semibold font-mono block ${badge.color}`}>
                {badge.label}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
                Végső Pontszám
              </span>
              <span className="text-xl font-bold font-mono text-neutral-100">
                {evaluation.totalScore} <span className="text-xs text-neutral-400 font-normal">/ {evaluation.maxPossibleScore}</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
                Detektálási Precizitás
              </span>
              <span className="text-xl font-bold font-mono text-neutral-100">
                {evaluation.precision}%
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
                Lefedettségi Arány (Recall)
              </span>
              <span className="text-xl font-bold font-mono text-neutral-100">
                {evaluation.recall}%
              </span>
            </div>
          </div>

          {/* Sub-Score Analysis Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg bg-neutral-950/70 border border-neutral-800 font-mono text-xs">
            <div className="p-3 bg-neutral-900/60 rounded border border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-400 block mb-0.5">
                1. Felismerés & Kategória (Discovery)
              </span>
              <span className="text-base font-bold text-neutral-200">
                {evaluation.discoveryScore} pont
              </span>
              <span className="text-[11px] text-neutral-400 block mt-0.5">
                Szöveghelyes kijelölések és hibatípus besorolás
              </span>
            </div>

            <div className="p-3 bg-neutral-900/60 rounded border border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-400 block mb-0.5">
                2. Szakmai Elemzés & Korrekció (Analysis)
              </span>
              <span className="text-base font-bold text-neutral-200">
                {evaluation.analysisScore} pont
              </span>
              <span className="text-[11px] text-neutral-400 block mt-0.5">
                Érdemi indoklások és számszaki/ténybeli javítások
              </span>
            </div>
          </div>

          {/* Breakdown Counts Row */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-neutral-400 border-b border-neutral-800/80 pb-4">
            <div>
              Helyes találatok: <strong className="text-emerald-400">{evaluation.truePositivesCount}</strong>
            </div>
            <div>
              Részpontszámos: <strong className="text-amber-400">{evaluation.partialMatchesCount}</strong>
            </div>
            <div>
              Téves riasztások (False Positives): <strong className={evaluation.falsePositivesCount > 0 ? 'text-rose-400' : 'text-neutral-300'}>{evaluation.falsePositivesCount} (-{evaluation.falsePositivesCount * 20} pont)</strong>
            </div>
            <div>
              Kihagyott hibák: <strong className={evaluation.missedErrorsCount > 0 ? 'text-rose-400' : 'text-neutral-300'}>{evaluation.missedErrorsCount}</strong>
            </div>
          </div>

          {/* RFC 8785 Canonical JSON + SHA-256 Integrity Checksum Card */}
          <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-3 no-print">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-neutral-200 font-mono">
                  Sértetlenségi Ellenőrző Összeg (RFC 8785 Canonical JSON + SHA-256)
                </span>
              </div>
              <button
                onClick={() => setShowPayload(!showPayload)}
                className="text-[11px] font-mono text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors"
              >
                <span>{showPayload ? 'Kanonikus JSON elrejtése' : 'Kanonikus JSON megtekintése'}</span>
                {showPayload ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
              A jelentés ellenőrző összege determinisztikusan generált, kulcsrendezett RFC 8785 kanonikus JSON struktúrára épül, amely a pontszámokat, a szöveges indoklásokat, a korrekciókat, a minősítést és az időbélyeget rögzíti. Bármilyen utólagos módosítás megváltoztatja a SHA-256 lenyomatot. (Megjegyzés: Kliensoldali sértetlenség-ellenőrzés; harmadik fél előtti joghatáshoz szerveroldali PKI/HMAC aláírás szükséges.)
            </p>

            {showPayload && (
              <pre className="p-3 bg-neutral-900 border border-neutral-800 rounded font-mono text-[10px] text-neutral-300 overflow-x-auto whitespace-pre-wrap select-all">
                {evaluation.canonicalPayload}
              </pre>
            )}
          </div>

          {/* Detailed Findings Table */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-neutral-100 uppercase tracking-wider font-mono">
              Részletes Eredmények & Vizsgálati Napló
            </h2>

            <div className="space-y-3">
              {evaluation.detailedMatches.map((item, idx) => {
                const isPartial = item.status === 'PARTIAL_MATCH';
                const isFalsePositive = item.status === 'FALSE_POSITIVE';
                const isMissed = item.status === 'MISSED_ERROR';

                let statusBadge = {
                  text: 'HELYES AZONOSÍTÁS & ÉRVÉNYES ELEMZÉS',
                  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                };
                if (isPartial) {
                  statusBadge = {
                    text: 'RÉSZLEGES PONT (Hiányos indoklás vagy kategória)',
                    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
                  };
                } else if (isFalsePositive) {
                  statusBadge = {
                    text: 'TÉVES RIASZTÁS (False Positive)',
                    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
                  };
                } else if (isMissed) {
                  statusBadge = {
                    text: 'KIHAGYOTT KRITIKUS HIBA',
                    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
                  };
                }

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-neutral-950/70 border border-neutral-800 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-neutral-400">#{idx + 1}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${statusBadge.color}`}
                        >
                          {statusBadge.text}
                        </span>
                      </div>
                      <span className={`font-mono font-bold ${item.scoreAwarded > 0 ? 'text-emerald-400' : item.scoreAwarded < 0 ? 'text-rose-400' : 'text-neutral-500'}`}>
                        {item.scoreAwarded > 0 ? `+${item.scoreAwarded}` : item.scoreAwarded} pont
                      </span>
                    </div>

                    {/* Score breakdown tags */}
                    {item.scoreBreakdown && item.scoreAwarded > 0 && (
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-neutral-400">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                          Felismerés: +{item.scoreBreakdown.phraseMatchScore}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                          Kategória: +{item.scoreBreakdown.categoryScore}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                          Indoklás: +{item.scoreBreakdown.justificationScore}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                          Helyesbítés: +{item.scoreBreakdown.correctionScore}
                        </span>
                      </div>
                    )}

                    {/* Target Phrase */}
                    {item.injectedError && (
                      <div className="font-mono text-[11px] text-neutral-300 bg-neutral-900 p-2 rounded border border-neutral-800">
                        <span className="text-neutral-400 block text-[10px] uppercase">Dokumentum szövegrész:</span>
                        "{item.injectedError.target_phrase}"
                      </div>
                    )}

                    {isFalsePositive && item.userAnnotation && (
                      <div className="font-mono text-[11px] text-neutral-300 bg-neutral-900 p-2 rounded border border-neutral-800">
                        <span className="text-neutral-400 block text-[10px] uppercase">Tévesen kijelölt szövegrész:</span>
                        "{item.userAnnotation.target_phrase}"
                      </div>
                    )}

                    {/* Explanations */}
                    <div className="text-[12px] leading-relaxed text-neutral-300 pt-1">
                      {item.feedbackNotes}
                    </div>

                    {/* Detailed feedback on justification and correction */}
                    {item.justificationFeedback && (
                      <div className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60 font-sans">
                        <span className="text-neutral-300 font-mono text-[10px] uppercase block">Indoklás szakmai ellenőrzése:</span>
                        {item.justificationFeedback}
                      </div>
                    )}

                    {item.correctionFeedback && (
                      <div className="text-[11px] text-neutral-400 pt-1 font-sans">
                        <span className="text-neutral-300 font-mono text-[10px] uppercase block">Számszaki korrekció ellenőrzése:</span>
                        {item.correctionFeedback}
                      </div>
                    )}

                    {item.userAnnotation?.justification && (
                      <div className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60">
                        <span className="text-neutral-400 font-mono">Auditor saját szöveges indoklása: </span>
                        "{item.userAnnotation.justification}"
                        {item.userAnnotation.proposedCorrection && (
                          <span className="block mt-0.5 text-neutral-300">
                            → Megadott korrekció: <strong className="font-mono">{item.userAnnotation.proposedCorrection}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Pedagogical Commentary (Dietz & Aczél) */}
          <div className="p-5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-2">
            <h3 className="font-semibold text-neutral-200 text-xs uppercase tracking-wider font-mono">
              Szakmai & Oktatási Értékelés (Világgazdaság Szakmai Keretrendszer)
            </h3>
            <p className="text-neutral-400 leading-relaxed text-[12px]">
              A szakmai keretrendszer Dr. Dietz Ferenc és Dr. Aczél Petra podcast-elemzéseinek (Világgazdaság, 2024) alapgondolatára épül: a diploma és az emberi ítélőképesség értéke a mesterséges intelligencia korában abban mutatkozik meg, hogy képesek vagyunk-e az automatikus kimenetek forrásait és számszaki levezetéseit kritikus szemmel auditálni.
            </p>
            <p className="text-neutral-400 leading-relaxed text-[12px]">
              {evaluation.totalScore >= 70
                ? 'Kiváló döntéshozói és auditori teljesítmény. Képes voltál önállóan verifikálni a számításokat és szűrni a hallucinációkat, így a vezetői döntés biztonságos adatokon nyugodhat.'
                : 'A vizsgálat során maradtak detektálatlan hibák, hiányos indoklások vagy téves riasztások. A szakmai minősítéshez elengedhetetlen az állítások egzakt numerikus és forrásbeli bizonyítása.'}
            </p>
          </div>

          {/* Verification Stamp Footer */}
          <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 font-mono gap-2">
            <span>METHODOLOGY STAMP: GDE-DUE-DILIGENCE-V1</span>
            <span className="truncate max-w-full sm:max-w-[360px]" title={evaluation.canonicalHash}>LOCAL SHA-256 CHECKSUM (NOT SIGNED): {evaluation.canonicalHash}</span>
          </div>
        </article>

        {/* Back and Next Actions */}
        <div className="flex items-center justify-between no-print pt-2">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Audit Újrakezdése</span>
          </button>

          {onSelectNextScenario && (
            <button
              onClick={onSelectNextScenario}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded transition-colors shadow"
            >
              <span>Következő Esettanulmány</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
