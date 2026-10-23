/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuditProvider, useAudit } from './context/AuditContext';
import { SCENARIOS } from './data/scenarios';
import { TopBar } from './components/TopBar';
import { DocumentViewer } from './components/DocumentViewer';
import { AuditPanel } from './components/AuditPanel';
import { FinancialCalculatorModal } from './components/FinancialCalculatorModal';
import { PodcastContextModal } from './components/PodcastContextModal';
import { ScenarioSelectorModal } from './components/ScenarioSelectorModal';
import { SystemDocumentationModal } from './components/SystemDocumentationModal';
import { AIBenchmarkModal } from './components/AIBenchmarkModal';
import { AuditHistoryModal } from './components/AuditHistoryModal';
import { AuditReportView } from './components/AuditReportView';
import { CohortDashboardView } from './components/CohortDashboardView';

function WorkbenchContent() {
  const {
    currentScenario,
    activeView,
    evaluation,
    annotations,
    selectedAnnotationId,
    isStrictMode,
    mobileTab,

    isCalculatorOpen,
    isDocumentationModalOpen,
    isPodcastModalOpen,
    isScenarioModalOpen,
    isBenchmarkModalOpen,

    selectScenario,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    selectAnnotation,
    resetAudit,
    submitAudit,
    toggleStrictMode,
    setActiveView,
    setMobileTab,
    selectNextScenario,

    setIsCalculatorOpen,
    setIsDocumentationModalOpen,
    setIsPodcastModalOpen,
    setIsScenarioModalOpen,
    setIsBenchmarkModalOpen,
  } = useAudit();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-900 text-neutral-100 antialiased font-sans">
      {/* 3-Zone Top Navigation Bar */}
      <TopBar />

      {/* Main Content Area */}
      {activeView === 'COHORT' ? (
        <CohortDashboardView
          currentScenario={currentScenario}
          onReturnToWorkbench={() => setActiveView('WORKBENCH')}
          onSelectScenario={(scenarioId) => {
            const s = SCENARIOS.find((item) => item.scenario_id === scenarioId);
            if (s) selectScenario(s);
          }}
        />
      ) : !evaluation ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Mobile view toggle strip */}
          <div className="flex lg:hidden items-center border-b border-neutral-800 bg-neutral-950 px-4 py-2 gap-2 text-xs select-none">
            <button
              onClick={() => setMobileTab('doc')}
              className={`flex-1 py-1.5 rounded text-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                mobileTab === 'doc'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              Dokumentum
            </button>
            <button
              onClick={() => setMobileTab('panel')}
              className={`flex-1 py-1.5 rounded text-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                mobileTab === 'panel'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              Audit Panel ({annotations.length})
            </button>
          </div>

          {/* Left Pane: Document Viewer with Redlining */}
          <div
            className={`flex-1 h-full overflow-hidden ${
              mobileTab === 'doc' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <DocumentViewer
              scenario={currentScenario}
              annotations={annotations}
              selectedAnnotationId={selectedAnnotationId}
              onSelectAnnotation={(id) => {
                selectAnnotation(id);
                if (id) setMobileTab('panel');
              }}
              onAddAnnotation={addAnnotation}
              isStrictMode={isStrictMode}
              onToggleStrictMode={toggleStrictMode}
            />
          </div>

          {/* Right Pane: Context & Active Audit Drawer */}
          <div
            className={`w-full lg:w-auto h-full overflow-hidden ${
              mobileTab === 'panel' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <AuditPanel
              scenario={currentScenario}
              annotations={annotations}
              selectedAnnotationId={selectedAnnotationId}
              onSelectAnnotation={selectAnnotation}
              onUpdateAnnotation={updateAnnotation}
              onDeleteAnnotation={deleteAnnotation}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
              onSubmitAudit={submitAudit}
            />
          </div>
        </div>
      ) : (
        /* Evaluation & Printable Audit Report View */
        <AuditReportView
          scenario={currentScenario}
          evaluation={evaluation}
          onReset={resetAudit}
          onSelectNextScenario={selectNextScenario}
          onOpenBenchmark={() => setIsBenchmarkModalOpen(true)}
          onOpenCohort={() => setActiveView('COHORT')}
        />
      )}

      {/* Interactive Tool Modals */}
      <FinancialCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        scenario={currentScenario}
      />

      <PodcastContextModal
        isOpen={isPodcastModalOpen}
        onClose={() => setIsPodcastModalOpen(false)}
      />

      <SystemDocumentationModal
        isOpen={isDocumentationModalOpen}
        onClose={() => setIsDocumentationModalOpen(false)}
      />

      <ScenarioSelectorModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        currentScenarioId={currentScenario.scenario_id}
        onSelectScenario={selectScenario}
      />

      <AIBenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
        scenario={currentScenario}
        userEvaluation={evaluation}
      />

      <AuditHistoryModal />
    </div>
  );
}

export default function App() {
  return (
    <AuditProvider>
      <WorkbenchContent />
    </AuditProvider>
  );
}
