/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SCENARIOS } from './data/scenarios';
import type { Scenario, UserAnnotation, ErrorType, EvaluationResult } from './types/audit';
import { evaluateAudit } from './utils/auditScoring';
import { TopBar } from './components/TopBar';
import { DocumentViewer } from './components/DocumentViewer';
import { AuditPanel } from './components/AuditPanel';
import { FinancialCalculatorModal } from './components/FinancialCalculatorModal';
import { PodcastContextModal } from './components/PodcastContextModal';
import { ScenarioSelectorModal } from './components/ScenarioSelectorModal';
import { SystemDocumentationModal } from './components/SystemDocumentationModal';
import { AuditReportView } from './components/AuditReportView';

export default function App() {
  // Scenario state
  const [currentScenario, setCurrentScenario] = useState<Scenario>(SCENARIOS[0]);

  // Audit state
  const [annotations, setAnnotations] = useState<UserAnnotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Modals state
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isDocumentationModalOpen, setIsDocumentationModalOpen] = useState(false);
  const [isPodcastModalOpen, setIsPodcastModalOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);

  // Mobile layout tab toggle: 'doc' | 'panel'
  const [mobileTab, setMobileTab] = useState<'doc' | 'panel'>('doc');

  // Timer lifecycle: run while not evaluated
  useEffect(() => {
    if (evaluation) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [evaluation]);

  // Keyboard shortcut listener (Cmd+K or Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCalculatorOpen(false);
        setIsDocumentationModalOpen(false);
        setIsPodcastModalOpen(false);
        setIsScenarioModalOpen(false);
        setSelectedAnnotationId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add annotation from text selection
  const handleAddAnnotation = (targetPhrase: string, type: ErrorType) => {
    // Avoid exact duplicate annotation
    const existing = annotations.find(
      (a) => a.target_phrase.toLowerCase() === targetPhrase.toLowerCase()
    );
    if (existing) {
      setSelectedAnnotationId(existing.id);
      setMobileTab('panel');
      return;
    }

    const newAnnotation: UserAnnotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      scenarioId: currentScenario.scenario_id,
      target_phrase: targetPhrase,
      selectedType: type,
      justification: '',
      proposedCorrection: '',
      timestamp: Date.now(),
    };

    setAnnotations((prev) => [...prev, newAnnotation]);
    setSelectedAnnotationId(newAnnotation.id);
    setMobileTab('panel');
  };

  // Update annotation properties
  const handleUpdateAnnotation = (id: string, updates: Partial<UserAnnotation>) => {
    setAnnotations((prev) =>
      prev.map((ann) => (ann.id === id ? { ...ann, ...updates } : ann))
    );
  };

  // Delete annotation
  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
  };

  // Reset current audit session
  const handleResetAudit = () => {
    setAnnotations([]);
    setSelectedAnnotationId(null);
    setEvaluation(null);
    setElapsedSeconds(0);
  };

  // Submit and evaluate audit
  const handleSubmitAudit = async () => {
    const result = await evaluateAudit(
      currentScenario.injected_errors,
      annotations,
      elapsedSeconds,
      currentScenario.scenario_id
    );
    setEvaluation(result);
  };

  // Switch scenario
  const handleSelectScenario = (scenario: Scenario) => {
    setCurrentScenario(scenario);
    setAnnotations([]);
    setSelectedAnnotationId(null);
    setEvaluation(null);
    setElapsedSeconds(0);
    setMobileTab('doc');
  };

  // Next scenario trigger
  const handleSelectNextScenario = () => {
    const currentIndex = SCENARIOS.findIndex(
      (s) => s.scenario_id === currentScenario.scenario_id
    );
    const nextIndex = (currentIndex + 1) % SCENARIOS.length;
    handleSelectScenario(SCENARIOS[nextIndex]);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-900 text-neutral-100 antialiased font-sans">
      {/* 3-Zone Top Navigation Bar */}
      <TopBar
        currentScenario={currentScenario}
        elapsedSeconds={elapsedSeconds}
        annotationCount={annotations.length}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenDocumentationModal={() => setIsDocumentationModalOpen(true)}
        onOpenPodcastModal={() => setIsPodcastModalOpen(true)}
        onOpenScenarioSelector={() => setIsScenarioModalOpen(true)}
        onResetAudit={handleResetAudit}
        onSubmitAudit={handleSubmitAudit}
        isEvaluated={Boolean(evaluation)}
        onReturnToWorkbench={() => setEvaluation(null)}
      />

      {/* Main Content Area */}
      {!evaluation ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Mobile view toggle strip */}
          <div className="flex lg:hidden items-center border-b border-neutral-800 bg-neutral-950 px-4 py-2 gap-2 text-xs select-none">
            <button
              onClick={() => setMobileTab('doc')}
              className={`flex-1 py-1.5 rounded text-center font-medium transition-colors ${
                mobileTab === 'doc'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Dokumentum
            </button>
            <button
              onClick={() => setMobileTab('panel')}
              className={`flex-1 py-1.5 rounded text-center font-medium transition-colors ${
                mobileTab === 'panel'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
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
                setSelectedAnnotationId(id);
                if (id) setMobileTab('panel');
              }}
              onAddAnnotation={handleAddAnnotation}
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
              onSelectAnnotation={setSelectedAnnotationId}
              onUpdateAnnotation={handleUpdateAnnotation}
              onDeleteAnnotation={handleDeleteAnnotation}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
              onSubmitAudit={handleSubmitAudit}
            />
          </div>
        </div>
      ) : (
        /* Evaluation & Printable Audit Report View */
        <AuditReportView
          scenario={currentScenario}
          evaluation={evaluation}
          onReset={handleResetAudit}
          onSelectNextScenario={handleSelectNextScenario}
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
        onSelectScenario={handleSelectScenario}
      />
    </div>
  );
}
