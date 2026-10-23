import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Calculator,
  BookOpen,
  Clock,
  RotateCcw,
  CheckCircle2,
  FileText,
  Cpu,
  Users,
  History,
  User,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
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

    resetAudit,
    submitAudit,
    setActiveView,
    setIsCalculatorOpen,
    setIsDocumentationModalOpen,
    setIsPodcastModalOpen,
    setIsBenchmarkModalOpen,
    setIsScenarioModalOpen,
    setIsHistoryModalOpen,
  } = useAudit();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeOver = elapsedSeconds > currentScenario.meta.time_limit_sec;

  const handleMobileNav = (action: () => void) => {
    setIsMobileMenuOpen(false);
    action();
  };

  return (
    <header className="border-b border-neutral-800 bg-neutral-900/95 backdrop-blur sticky top-0 z-30 px-3 sm:px-4 lg:px-6 py-2.5 select-none">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-2 md:gap-4 lg:gap-8">
        {/* Zone 1: Brand wordmark & Active Document breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="font-bold text-sm sm:text-base tracking-tight text-neutral-100 font-sans">
              PROMPT & PIVOT
            </span>
            <span className="text-xs text-neutral-400 font-mono hidden xl:inline">
              / AI Due Diligence Workbench
            </span>
          </div>

          <div className="h-4 w-[1px] bg-neutral-800 hidden md:block" />

          {/* Scenario quick selector trigger - Desktop */}
          <button
            onClick={() => setIsScenarioModalOpen(true)}
            className="hidden md:flex items-center gap-2 text-xs text-neutral-200 hover:text-white px-2.5 py-1 rounded bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/80 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="Forgatókönyv váltása"
          >
            <span className="text-neutral-400">Eset:</span>
            <span className="font-medium truncate max-w-[160px] lg:max-w-[220px]">
              {currentScenario.meta.title}
            </span>
            <span className="text-[10px] text-amber-400 font-mono">
              [{currentScenario.meta.difficulty}]
            </span>
          </button>

          {/* Mobile Timer Badge */}
          <div className="flex md:hidden items-center gap-1.5 px-2 py-1 bg-neutral-950 rounded border border-neutral-800 text-neutral-200 text-xs font-mono">
            <Clock className={`w-3 h-3 ${isTimeOver ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
            <span className={isTimeOver ? 'text-rose-400 font-bold' : 'font-medium'}>
              {formatTime(elapsedSeconds)}
            </span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-300" title="Jelölt gyanús pontok">
              {annotations.length}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation & Diagnostic Tools - Desktop (md+) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 lg:gap-2 text-xs font-medium text-neutral-200">
          {/* User History & Certificate Log */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all font-medium shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="Előzmények & SHA-256 Audit Tanúsítványok"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Előzmények ({pastAuditHistory.length})</span>
          </button>

          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="Pénzügyi és megtérülési gyorstesztelő"
          >
            <Calculator className="w-3.5 h-3.5 text-neutral-300" />
            <span>Kalkulátor</span>
          </button>

          <button
            onClick={() => setIsDocumentationModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="Rendszerdokumentáció, kiértékelési szabályzat és korlátok"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-300" />
            <span>Rendszerleírás</span>
          </button>

          <button
            onClick={() => setIsPodcastModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="Világgazdaság podcast háttér és módszertan"
          >
            <BookOpen className="w-3.5 h-3.5 text-neutral-300" />
            <span>Podcast Háttér</span>
          </button>

          <button
            onClick={() => setIsBenchmarkModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all font-medium shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-500"
            title="AI Benchmark Aréna: Humán Auditor vs. Gemini / Claude / GPT-4o"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Aréna</span>
          </button>

          {/* Cohort Analytics & Heatmap Navigation */}
          <button
            onClick={() => setActiveView(activeView === 'COHORT' ? 'WORKBENCH' : 'COHORT')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-all font-medium shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
              activeView === 'COHORT'
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
            title="Csoportos Elemzés & Hiba-Hőtérkép (Cohort Analytics & Fault Heatmap)"
          >
            <Users
              className={`w-3.5 h-3.5 ${
                activeView === 'COHORT' ? 'text-neutral-950' : 'text-amber-400'
              }`}
            />
            <span>Kohorsz Hőtérkép</span>
          </button>

          {/* Desktop Timer & Audit Counter */}
          <div className="flex items-center gap-2 px-3 py-1 bg-neutral-950 rounded border border-neutral-800 text-neutral-200 text-xs font-mono ml-1 shrink-0">
            <Clock
              className={`w-3.5 h-3.5 ${
                isTimeOver ? 'text-rose-400 animate-pulse' : 'text-neutral-400'
              }`}
            />
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
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[38px] md:min-h-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-950" />
              <span className="hidden sm:inline">Vissza a Workbenchhez</span>
              <span className="sm:hidden">Workbench</span>
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[38px] md:min-h-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" />
                <span>Audit Lezárása</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveView('WORKBENCH')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-100 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[38px] md:min-h-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Vissza a Workbenchhez</span>
              <span className="sm:hidden">Workbench</span>
            </button>
          )}

          {/* Hamburger Menu Toggle Button - Mobile Only (<768px) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors min-h-[40px] min-w-[40px]"
            aria-label={isMobileMenuOpen ? 'Menü bezárása' : 'Menü megnyitása'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Slide-Over Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Drawer Content */}
          <div className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-neutral-900 border-l border-neutral-800 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto p-5 animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h2 className="font-bold text-sm text-neutral-100 font-sans tracking-tight">
                      PROMPT & PIVOT
                    </h2>
                    <p className="text-[11px] text-neutral-400">Auditor Eszköztár</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Bezárás"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Summary */}
              <div
                onClick={() => handleMobileNav(() => setIsHistoryModalOpen(true))}
                className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between cursor-pointer hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-100">
                      {userProfile.name}
                    </div>
                    <div className="text-[11px] text-emerald-400">
                      {userProfile.role} · {pastAuditHistory.length} lezárt audit
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              </div>

              {/* Active Scenario Card */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-semibold text-neutral-400 tracking-wider">
                  Aktív Forgatókönyv
                </label>
                <button
                  onClick={() => handleMobileNav(() => setIsScenarioModalOpen(true))}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/80 text-left transition-colors text-xs text-neutral-200"
                >
                  <div className="space-y-0.5">
                    <div className="font-medium text-neutral-100">
                      {currentScenario.meta.title}
                    </div>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                      <span>{currentScenario.context.target_name}</span>
                      <span className="text-amber-400 font-mono">
                        [{currentScenario.meta.difficulty}]
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                </button>
              </div>

              {/* Tool Navigation List */}
              <div className="space-y-1">
                <label className="text-[11px] uppercase font-semibold text-neutral-400 tracking-wider px-1">
                  Eszközök & Diagnosztika
                </label>

                <button
                  onClick={() => handleMobileNav(() => setIsHistoryModalOpen(true))}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors text-xs font-medium min-h-[44px]"
                >
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-emerald-400" />
                    <span>Audit Előzmények & Tanúsítványok</span>
                  </div>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                    {pastAuditHistory.length}
                  </span>
                </button>

                <button
                  onClick={() => handleMobileNav(() => setIsCalculatorOpen(true))}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors text-xs font-medium min-h-[44px]"
                >
                  <Calculator className="w-4 h-4 text-sky-400" />
                  <span>Pénzügyi Kalkulátor</span>
                </button>

                <button
                  onClick={() => handleMobileNav(() => setIsDocumentationModalOpen(true))}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors text-xs font-medium min-h-[44px]"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Rendszerleírás & Szabályzat</span>
                </button>

                <button
                  onClick={() => handleMobileNav(() => setIsPodcastModalOpen(true))}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors text-xs font-medium min-h-[44px]"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Podcast Háttér & Módszertan</span>
                </button>

                <button
                  onClick={() => handleMobileNav(() => setIsBenchmarkModalOpen(true))}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors text-xs font-medium min-h-[44px]"
                >
                  <div className="flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span>AI Aréna (Benchmark)</span>
                  </div>
                  <span className="text-[10px] text-purple-300 font-mono">GPT-4o / Gemini</span>
                </button>

                <button
                  onClick={() =>
                    handleMobileNav(() =>
                      setActiveView(activeView === 'COHORT' ? 'WORKBENCH' : 'COHORT')
                    )
                  }
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-xs font-medium min-h-[44px] ${
                    activeView === 'COHORT'
                      ? 'bg-amber-400 text-neutral-950 font-bold'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users
                      className={`w-4 h-4 ${
                        activeView === 'COHORT' ? 'text-neutral-950' : 'text-amber-400'
                      }`}
                    />
                    <span>Kohorsz Hőtérkép & Analitika</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-80">Matrix</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-neutral-800 space-y-2 mt-6">
              {!evaluation && (
                <button
                  onClick={() => handleMobileNav(resetAudit)}
                  disabled={annotations.length === 0}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:pointer-events-none min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Jelölések Törlése / Újraindítás</span>
                </button>
              )}

              {activeView === 'COHORT' ? (
                <button
                  onClick={() => handleMobileNav(() => setActiveView('WORKBENCH'))}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-xs font-bold text-neutral-950 bg-neutral-100 hover:bg-white transition-colors min-h-[44px]"
                >
                  <ShieldCheck className="w-4 h-4 text-neutral-950" />
                  <span>Vissza a Workbenchhez</span>
                </button>
              ) : !evaluation ? (
                <button
                  onClick={() => handleMobileNav(submitAudit)}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-xs font-bold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 transition-colors min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4 text-neutral-950" />
                  <span>Audit Lezárása & Kiértékelés</span>
                </button>
              ) : (
                <button
                  onClick={() => handleMobileNav(() => setActiveView('WORKBENCH'))}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-xs font-bold text-neutral-100 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors min-h-[44px]"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Vissza a Workbenchhez</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

