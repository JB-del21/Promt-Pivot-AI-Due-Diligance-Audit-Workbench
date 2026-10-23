import React from 'react';
import { ShieldCheck, Calculator, BookOpen, Clock, RotateCcw, CheckCircle2, FileText } from 'lucide-react';
import type { Scenario } from '../types/audit';

interface TopBarProps {
  currentScenario: Scenario;
  elapsedSeconds: number;
  annotationCount: number;
  onOpenCalculator: () => void;
  onOpenDocumentationModal: () => void;
  onOpenPodcastModal: () => void;
  onOpenScenarioSelector: () => void;
  onResetAudit: () => void;
  onSubmitAudit: () => void;
  isEvaluated: boolean;
  onReturnToWorkbench: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentScenario,
  elapsedSeconds,
  annotationCount,
  onOpenCalculator,
  onOpenDocumentationModal,
  onOpenPodcastModal,
  onOpenScenarioSelector,
  onResetAudit,
  onSubmitAudit,
  isEvaluated,
  onReturnToWorkbench,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeOver = elapsedSeconds > currentScenario.meta.time_limit_sec;

  return (
    <header className="border-b border-neutral-800 bg-neutral-900/95 backdrop-blur sticky top-0 z-30 px-4 lg:px-6 py-3 select-none">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand wordmark & Active Document breadcrumb */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base tracking-tight text-neutral-100 font-sans">
              PROMPT & PIVOT
            </span>
            <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
              / AI Due Diligence Workbench
            </span>
          </div>

          <div className="h-4 w-[1px] bg-neutral-800 hidden md:block" />

          {/* Scenario quick selector trigger */}
          <button
            onClick={onOpenScenarioSelector}
            className="hidden md:flex items-center gap-2 text-xs text-neutral-300 hover:text-white px-2.5 py-1 rounded bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 transition-colors"
            title="Forgatókönyv váltása"
          >
            <span className="text-neutral-400">Eset:</span>
            <span className="font-medium truncate max-w-[200px]">{currentScenario.meta.title}</span>
            <span className="text-[10px] text-amber-400 font-mono">[{currentScenario.meta.difficulty}]</span>
          </button>
        </div>

        {/* Zone 2: Navigation & Diagnostic Tools */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs font-medium text-neutral-300">
          <button
            onClick={onOpenCalculator}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
            title="Pénzügyi és megtérülési gyorstesztelő"
          >
            <Calculator className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Kalkulátor</span>
          </button>

          <button
            onClick={onOpenDocumentationModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
            title="Rendszerdokumentáció, kiértékelési szabályzat és korlátok"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Rendszerleírás</span>
          </button>

          <button
            onClick={onOpenPodcastModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
            title="Világgazdaság podcast háttér és módszertan"
          >
            <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Podcast Háttér</span>
          </button>

          {/* Timer & Audit Counter */}
          <div className="flex items-center gap-2 px-3 py-1 bg-neutral-950 rounded border border-neutral-800 text-neutral-300 text-xs font-mono ml-1">
            <Clock className={`w-3.5 h-3.5 ${isTimeOver ? 'text-rose-400 animate-pulse' : 'text-neutral-400'}`} />
            <span className={isTimeOver ? 'text-rose-400 font-semibold' : ''}>
              {formatTime(elapsedSeconds)}
            </span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400" title="Jelölt gyanús pontok">
              {annotationCount} jelölve
            </span>
          </div>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          {!isEvaluated ? (
            <>
              <button
                onClick={onResetAudit}
                disabled={annotationCount === 0}
                className="hidden lg:flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 px-2.5 py-1.5 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
                title="Jelölések törlése"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Újraindítás</span>
              </button>

              <button
                onClick={onSubmitAudit}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" />
                <span>Audit Lezárása</span>
              </button>
            </>
          ) : (
            <button
              onClick={onReturnToWorkbench}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-100 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Vissza a Workbenchhez</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
