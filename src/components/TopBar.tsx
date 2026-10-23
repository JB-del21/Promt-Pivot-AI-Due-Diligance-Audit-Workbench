import React from 'react';
import { ShieldCheck, Calculator, BookOpen, Clock, RotateCcw, CheckCircle2, FileText, Cpu, Users, History, User } from 'lucide-react';
import { useAudit } from '../context/AuditContext';

export const TopBar: React.FC = () => {
  const {
    currentScenario,
    elapsedSeconds,
    annotations,
    activeView,
    evaluation,
    userProfile,
    pastAuditHistory,

    selectNextScenario,
    resetAudit,
    submitAudit,
    setActiveView,
    setIsCalculatorOpen,
    setIsDocumentationModalOpen,
    setIsPodcastModalOpen,
    setIsBenchmarkModalOpen,
    setIsScenarioModalOpen,
    setIsHistoryModalOpen,
    selectAnnotation,
  } = useAudit();

  const isEvaluated = Boolean(evaluation);

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
            <span className="text-xs text-neutral-300 font-mono hidden sm:inline">
              / AI Due Diligence Workbench
            </span>
          </div>

          <div className="h-4 w-[1px] bg-neutral-800 hidden md:block" />

          {/* Scenario quick selector trigger */}
          <button
            onClick={() => setIsScenarioModalOpen(true)}
            className="hidden md:flex items-center gap-2 text-xs text-neutral-200 hover:text-white px-2.5 py-1 rounded bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/80 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="Forgatókönyv váltása"
          >
            <span className="text-neutral-400">Eset:</span>
            <span className="font-medium truncate max-w-[200px]">{currentScenario.meta.title}</span>
            <span className="text-[10px] text-amber-400 font-mono">[{currentScenario.meta.difficulty}]</span>
          </button>
        </div>

        {/* Zone 2: Navigation & Diagnostic Tools - Scrollable on narrow mobile */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs font-medium text-neutral-200 overflow-x-auto no-scrollbar py-1 max-w-full">
          {/* User History & Certificate Log */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all font-medium shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[36px] sm:min-h-0"
            title="Előzmények & SHA-256 Audit Tanúsítványok"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Előzmények ({pastAuditHistory.length})</span>
          </button>

          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[36px] sm:min-h-0"
            title="Pénzügyi és megtérülési gyorstesztelő"
          >
            <Calculator className="w-3.5 h-3.5 text-neutral-300" />
            <span className="hidden sm:inline">Kalkulátor</span>
          </button>

          <button
            onClick={() => setIsDocumentationModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[36px] sm:min-h-0"
            title="Rendszerdokumentáció, kiértékelési szabályzat és korlátok"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-300" />
            <span className="hidden sm:inline">Rendszerleírás</span>
          </button>

          <button
            onClick={() => setIsPodcastModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[36px] sm:min-h-0"
            title="Világgazdaság podcast háttér és módszertan"
          >
            <BookOpen className="w-3.5 h-3.5 text-neutral-300" />
            <span className="hidden sm:inline">Podcast Háttér</span>
          </button>

          <button
            onClick={() => setIsBenchmarkModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all font-medium shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[36px] sm:min-h-0"
            title="AI Benchmark Aréna: Humán Auditor vs. Gemini / Claude / GPT-4o"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">AI Aréna</span>
          </button>

          {/* Cohort Analytics & Heatmap Navigation */}
          <button
            onClick={() => setActiveView(activeView === 'COHORT' ? 'WORKBENCH' : 'COHORT')}
            className={`flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded transition-all font-medium shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[36px] sm:min-h-0 ${
              activeView === 'COHORT'
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
            title="Csoportos Elemzés & Hiba-Hőtérkép (Cohort Analytics & Fault Heatmap)"
          >
            <Users className={`w-3.5 h-3.5 ${activeView === 'COHORT' ? 'text-neutral-950' : 'text-amber-400'}`} />
            <span className="hidden md:inline">Kohorsz Hőtérkép</span>
          </button>

          {/* Timer & Audit Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 sm:py-1 bg-neutral-950 rounded border border-neutral-800 text-neutral-200 text-xs font-mono ml-1 shrink-0">
            <Clock className={`w-3.5 h-3.5 ${isTimeOver ? 'text-rose-400 animate-pulse' : 'text-neutral-400'}`} />
            <span className={isTimeOver ? 'text-rose-400 font-semibold' : ''}>
              {formatTime(elapsedSeconds)}
            </span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-300" title="Jelölt gyanús pontok">
              {annotations.length}
            </span>
          </div>
        </nav>

        {/* Zone 3: Primary Action & Profile Info */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Active Profile Badge */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="hidden xl:flex items-center gap-1.5 text-xs text-neutral-300 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800 hover:border-neutral-700 transition-colors"
            title="Auditor profilja és elkötelezettsége"
          >
            <User className="w-3 h-3 text-emerald-400" />
            <span className="font-medium text-neutral-200">{userProfile.name}</span>
          </button>

          {activeView === 'COHORT' ? (
            <button
              onClick={() => setActiveView('WORKBENCH')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-950" />
              <span>Vissza a Workbenchhez</span>
            </button>
          ) : !evaluation ? (
            <>
              <button
                onClick={resetAudit}
                disabled={annotations.length === 0}
                className="hidden lg:flex items-center gap-1 text-xs text-neutral-300 hover:text-white px-2.5 py-1.5 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-neutral-400"
                title="Jelölések törlése"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Újraindítás</span>
              </button>

              <button
                onClick={submitAudit}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" />
                <span>Audit Lezárása</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveView('WORKBENCH')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-100 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
