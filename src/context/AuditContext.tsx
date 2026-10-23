import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { SCENARIOS } from '../data/scenarios';
import type { Scenario, UserAnnotation, ErrorType, EvaluationResult } from '../types/audit';
import { evaluateAudit } from '../utils/auditScoring';

export interface UserProfile {
  name: string;
  role: 'Junior Analyst' | 'Associate Auditor' | 'Senior M&A Auditor' | 'VC Partner';
  email: string;
}

export interface PastAuditRecord {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  completedAt: string;
  totalScore: number;
  maxScore: number;
  grade: string;
  falsePositivesCount: number;
  elapsedSeconds: number;
  sha256Hash: string;
  auditMode: 'STRICT' | 'GUIDED';
}

interface AuditContextType {
  // Current active scenario & audit state
  currentScenario: Scenario;
  annotations: UserAnnotation[];
  selectedAnnotationId: string | null;
  evaluation: EvaluationResult | null;
  elapsedSeconds: number;
  isStrictMode: boolean;
  activeView: 'WORKBENCH' | 'COHORT';
  mobileTab: 'doc' | 'panel';

  // User Profile & History
  userProfile: UserProfile;
  pastAuditHistory: PastAuditRecord[];

  // Modal Visibility States
  isCalculatorOpen: boolean;
  isDocumentationModalOpen: boolean;
  isPodcastModalOpen: boolean;
  isScenarioModalOpen: boolean;
  isBenchmarkModalOpen: boolean;
  isHistoryModalOpen: boolean;
  isAndroidModalOpen: boolean;

  // Actions
  selectScenario: (scenario: Scenario) => void;
  selectScenarioById: (scenarioId: string) => void;
  selectNextScenario: () => void;
  addAnnotation: (targetPhrase: string, type: ErrorType) => void;
  updateAnnotation: (id: string, updates: Partial<UserAnnotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  resetAudit: () => void;
  submitAudit: () => Promise<void>;
  toggleStrictMode: () => void;
  setActiveView: (view: 'WORKBENCH' | 'COHORT') => void;
  setMobileTab: (tab: 'doc' | 'panel') => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  clearPastHistory: () => void;

  // Modal Toggles
  setIsCalculatorOpen: (open: boolean) => void;
  setIsDocumentationModalOpen: (open: boolean) => void;
  setIsPodcastModalOpen: (open: boolean) => void;
  setIsScenarioModalOpen: (open: boolean) => void;
  setIsBenchmarkModalOpen: (open: boolean) => void;
  setIsHistoryModalOpen: (open: boolean) => void;
  setIsAndroidModalOpen: (open: boolean) => void;
}

const STORAGE_KEY_SESSION = 'prompt_pivot_session_v2';
const STORAGE_KEY_PROFILE = 'prompt_pivot_user_profile_v1';
const STORAGE_KEY_HISTORY = 'prompt_pivot_audit_history_v1';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Junior Analyst',
  role: 'Junior Analyst',
  email: 'analyst@prompt-pivot.audit',
};

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export const AuditProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State initialization with localStorage restoration
  const [currentScenario, setCurrentScenario] = useState<Scenario>(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_KEY_SESSION);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const found = SCENARIOS.find((s) => s.scenario_id === parsed.scenarioId);
        if (found) return found;
      }
    } catch {
      // Ignore storage errors
    }
    return SCENARIOS[0];
  });

  const [activeView, setActiveView] = useState<'WORKBENCH' | 'COHORT'>('WORKBENCH');
  const [mobileTab, setMobileTab] = useState<'doc' | 'panel'>('doc');

  const [isStrictMode, setIsStrictMode] = useState<boolean>(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_KEY_SESSION);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (typeof parsed.isStrictMode === 'boolean') return parsed.isStrictMode;
      }
    } catch {
      // Ignore storage errors
    }
    return true;
  });

  const [annotations, setAnnotations] = useState<UserAnnotation[]>(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_KEY_SESSION);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (Array.isArray(parsed.annotations)) return parsed.annotations;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_KEY_SESSION);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (typeof parsed.elapsedSeconds === 'number') return parsed.elapsedSeconds;
      }
    } catch {
      // Ignore storage errors
    }
    return 0;
  });

  // User Profile state
  const [userProfile, setUserProfileState] = useState<UserProfile>(() => {
    try {
      const savedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (savedProfile) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(savedProfile) };
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_PROFILE;
  });

  // Past Audit History
  const [pastAuditHistory, setPastAuditHistory] = useState<PastAuditRecord[]>(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  // Modals state
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isDocumentationModalOpen, setIsDocumentationModalOpen] = useState(false);
  const [isPodcastModalOpen, setIsPodcastModalOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save active session to localStorage
  useEffect(() => {
    try {
      const sessionData = {
        scenarioId: currentScenario.scenario_id,
        isStrictMode,
        annotations,
        elapsedSeconds,
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('Failed to save audit session to localStorage', e);
    }
  }, [currentScenario.scenario_id, isStrictMode, annotations, elapsedSeconds]);

  // Save profile updates
  const updateUserProfile = (profileUpdates: Partial<UserProfile>) => {
    setUserProfileState((prev) => {
      const updated = { ...prev, ...profileUpdates };
      try {
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save profile', e);
      }
      return updated;
    });
  };

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
        setIsBenchmarkModalOpen(false);
        setIsHistoryModalOpen(false);
        setIsAndroidModalOpen(false);
        setSelectedAnnotationId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Action Handlers
  const addAnnotation = (targetPhrase: string, type: ErrorType) => {
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

  const updateAnnotation = (id: string, updates: Partial<UserAnnotation>) => {
    setAnnotations((prev) =>
      prev.map((ann) => (ann.id === id ? { ...ann, ...updates } : ann))
    );
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
  };

  const resetAudit = () => {
    setAnnotations([]);
    setSelectedAnnotationId(null);
    setEvaluation(null);
    setElapsedSeconds(0);
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch {
      // Ignore
    }
  };

  const submitAudit = async () => {
    const mode = isStrictMode ? 'STRICT' : 'GUIDED';
    const result = await evaluateAudit(
      currentScenario.injected_errors,
      annotations,
      elapsedSeconds,
      currentScenario.scenario_id,
      mode
    );
    setEvaluation(result);

    const grade = result.auditorReliability.includes('Senior')
      ? 'SENIOR'
      : result.auditorReliability.includes('Gyakorlott')
      ? 'ASSOCIATE'
      : 'JUNIOR';

    // Save to past audit history log
    const newRecord: PastAuditRecord = {
      id: `audit-${Date.now()}`,
      scenarioId: currentScenario.scenario_id,
      scenarioTitle: currentScenario.meta.title,
      completedAt: new Date().toISOString(),
      totalScore: result.totalScore,
      maxScore: result.maxPossibleScore,
      grade,
      falsePositivesCount: result.falsePositivesCount,
      elapsedSeconds: result.elapsedSeconds,
      sha256Hash: result.canonicalHash,
      auditMode: mode,
    };

    setPastAuditHistory((prev) => {
      const updated = [newRecord, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save audit history', e);
      }
      return updated;
    });

    // Local demo reports are not authenticated server records. No silent writes.
    // Verified server submissions require a future signed-in identity and explicit API handling.
  };

  const selectScenario = (scenario: Scenario) => {
    setCurrentScenario(scenario);
    setAnnotations([]);
    setSelectedAnnotationId(null);
    setEvaluation(null);
    setElapsedSeconds(0);
    setMobileTab('doc');
  };

  const selectScenarioById = (scenarioId: string) => {
    const s = SCENARIOS.find((item) => item.scenario_id === scenarioId);
    if (s) selectScenario(s);
  };

  const selectNextScenario = () => {
    const currentIndex = SCENARIOS.findIndex(
      (s) => s.scenario_id === currentScenario.scenario_id
    );
    const nextIndex = (currentIndex + 1) % SCENARIOS.length;
    selectScenario(SCENARIOS[nextIndex]);
  };

  const toggleStrictMode = () => {
    setIsStrictMode((prev) => !prev);
  };

  const clearPastHistory = () => {
    setPastAuditHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch {
      // Ignore
    }
  };

  return (
    <AuditContext.Provider
      value={{
        currentScenario,
        annotations,
        selectedAnnotationId,
        evaluation,
        elapsedSeconds,
        isStrictMode,
        activeView,
        mobileTab,
        userProfile,
        pastAuditHistory,

        isCalculatorOpen,
        isDocumentationModalOpen,
        isPodcastModalOpen,
        isScenarioModalOpen,
        isBenchmarkModalOpen,
        isHistoryModalOpen,
        isAndroidModalOpen,

        selectScenario,
        selectScenarioById,
        selectNextScenario,
        addAnnotation,
        updateAnnotation,
        deleteAnnotation,
        selectAnnotation: setSelectedAnnotationId,
        resetAudit,
        submitAudit,
        toggleStrictMode,
        setActiveView,
        setMobileTab,
        updateUserProfile,
        clearPastHistory,

        setIsCalculatorOpen,
        setIsDocumentationModalOpen,
        setIsPodcastModalOpen,
        setIsScenarioModalOpen,
        setIsBenchmarkModalOpen,
        setIsHistoryModalOpen,
        setIsAndroidModalOpen,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = (): AuditContextType => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
};
