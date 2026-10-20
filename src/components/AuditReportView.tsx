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
} from 'lucide-react';
import type { Scenario, EvaluationResult } from '../types/audit';
import { ERROR_TYPE_LABELS } from '../types/audit';

interface AuditReportViewProps {
  scenario: Scenario;
  evaluation: EvaluationResult;
  onReset: () => void;
  onSelectNextScenario?: () => void;
}

export const AuditReportView: React.FC<AuditReportViewProps> = ({
  scenario,
  evaluation,
  onReset,
  onSelectNextScenario,
}) => {
  const [copied, setCopied] = useState(false);

  const getReliabilityBadge = (rank: string) => {
    switch (rank) {
      case 'Senior Due Diligence Auditor':
        return {
          label: 'Senior Due Diligence Auditor (Kiváló)',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
        };
      case 'Associate Auditor':
        return {
          label: 'Associate Auditor (Megfelelt)',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
        };
      default:
        return {
          label: 'Risk-Prone / Unverified (Fokozott Kockázat)',
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
    downloadAnchor.setAttribute('download', `audit_report_${evaluation.generatedHash}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyMarkdown = () => {
    const md = `# AI Due Diligence Audit Report
**Dokumentum:** ${scenario.meta.title}
**Célvállalat:** ${scenario.context.target_name}
**Audit Hash:** ${evaluation.generatedHash}
**Dátum:** ${evaluation.submittedAt}
**Minősítés:** ${evaluation.auditorReliability}
**Összpontszám:** ${evaluation.totalScore} / ${evaluation.maxPossibleScore} pont
**Precizitás:** ${evaluation.precision}% | **Lefedettség:** ${evaluation.recall}%
**Téves riasztások (False Positives):** ${evaluation.falsePositivesCount}

## Részletes Eredmények
${evaluation.detailedMatches
  .map(
    (m, i) =>
      `### #${i + 1} ${m.status} (${m.scoreAwarded > 0 ? `+${m.scoreAwarded}` : m.scoreAwarded} pont)\n- **Megállapítás:** ${m.feedbackNotes}\n`
  )
  .join('\n')}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 bg-neutral-950 overflow-y-auto px-4 py-8 lg:px-12 select-text">
      <div className="max-w-4xl mx-auto space-y-8 print-page">
        {/* Actions Bar (hidden on print) */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 no-print">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-neutral-200">
              Audit Kiértékelés Elkészült
            </span>
            <span className="text-xs font-mono text-neutral-500">
              · {evaluation.generatedHash}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Másolva!' : 'Markdown Másolása'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON Export</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-neutral-100 hover:bg-white text-neutral-950 font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-900" />
              <span>Nyomtatás / PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Executive Document Sheet */}
        <article className="p-8 sm:p-12 rounded-xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-8 text-neutral-200">
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
              <p className="text-xs text-neutral-400 mt-1">
                Eset: <strong className="text-neutral-200">{scenario.meta.title}</strong> · Célvállalat: <strong className="text-neutral-200">{scenario.context.target_name}</strong>
              </p>
            </div>

            <div className="text-right sm:text-right font-mono text-xs space-y-1">
              <div className="text-neutral-400">Audit Hash: <span className="text-neutral-200 font-bold">{evaluation.generatedHash}</span></div>
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
                Detektálási Precizitás (Precision)
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

          {/* Breakdown Pills Row */}
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

          {/* Detailed Findings Table */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-neutral-100 uppercase tracking-wider font-mono">
              Részletes Eredmények & Vizsgálati Napló
            </h2>

            <div className="space-y-3">
              {evaluation.detailedMatches.map((item, idx) => {
                const isSuccess = item.status === 'TRUE_POSITIVE';
                const isPartial = item.status === 'PARTIAL_MATCH';
                const isFalsePositive = item.status === 'FALSE_POSITIVE';
                const isMissed = item.status === 'MISSED_ERROR';

                let statusBadge = {
                  text: 'HELYES AZONOSÍTÁS',
                  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                };
                if (isPartial) {
                  statusBadge = {
                    text: 'RÉSZPONTOZOTT (Kategória eltérés)',
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
                    className="p-4 rounded-lg bg-neutral-950/70 border border-neutral-800 space-y-2 text-xs"
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

                    {item.userAnnotation?.justification && (
                      <div className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60">
                        <span className="text-neutral-400 font-mono">Auditor saját indoklása: </span>
                        "{item.userAnnotation.justification}"
                        {item.userAnnotation.proposedCorrection && (
                          <span className="block mt-0.5 text-neutral-300">
                            → Javasolt korrekció: <strong className="font-mono">{item.userAnnotation.proposedCorrection}</strong>
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
              Dr. Dietz Ferenc és Dr. Aczél Petra megfogalmazása szerint: <em>„A diploma nem egy készrejelentés... Az emberi ítélőképesség értéke abban mutatkozik meg, hogy észrevesszük-e a mesterséges intelligencia által elkövetett csúsztatásokat és forráshibákat.”</em>
            </p>
            <p className="text-neutral-400 leading-relaxed text-[12px]">
              {evaluation.totalScore >= 70
                ? 'Kiváló döntéshozói és auditori teljesítmény. Képes voltál önállóan verifikálni a számításokat és szűrni a hallucinációkat, így a vezetői döntés biztonságos adatokon nyugodhat.'
                : 'A vizsgálat során maradtak detektálatlan hibák vagy téves riasztások. Érdemes a referencia-kalkulátor használatával újraellenőrizni a numerikus összefüggéseket.'}
            </p>
          </div>

          {/* Verification Stamp Footer */}
          <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 font-mono gap-2">
            <span>METHODOLOGY STAMP: GDE-DUE-DILIGENCE-V1</span>
            <span>VERIFIED DIGITAL CHECKSUM: {evaluation.generatedHash}</span>
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
