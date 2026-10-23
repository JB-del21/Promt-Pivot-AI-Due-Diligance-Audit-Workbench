import { authenticatedFetch } from '../auth/client';
import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Copy,
  Download,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Shield,
  Clock,
  Sparkles,
  ArrowLeft,
  X
} from 'lucide-react';
import type { Scenario } from '../types/audit';
import type {
  CohortAnalysisData,
  CohortParticipant,
  ParticipantFaultRecord,
  FaultDetectionStatus,
} from '../types/cohort';

interface CohortDashboardViewProps {
  currentScenario: Scenario;
  onReturnToWorkbench: () => void;
  onSelectScenario: (scenarioId: string) => void;
}

export const CohortDashboardView: React.FC<CohortDashboardViewProps> = ({
  currentScenario,
  onReturnToWorkbench,
  onSelectScenario,
}) => {
  const [data, setData] = useState<CohortAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('Összes kohorsz');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SENIOR' | 'ASSOCIATE' | 'BLIND_SPOT'>('ALL');
  const [selectedFaultModal, setSelectedFaultModal] = useState<{
    participant: CohortParticipant;
    record: ParticipantFaultRecord;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Fetch cohort data on scenario or group change
  const fetchCohortData = async () => {
    setIsLoading(true);
    try {
      const url = `/api/cohort/metrics?scenarioId=${encodeURIComponent(
        currentScenario.scenario_id
      )}&group=${encodeURIComponent(selectedGroup)}`;
      const res = await authenticatedFetch(url);
      if (!res.ok) throw new Error('Hiba a kohorsz adatok betöltésekor');
      const json: CohortAnalysisData = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load cohort data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCohortData();
  }, [currentScenario.scenario_id, selectedGroup]);

  // Copy canonical report hash to clipboard
  const handleCopyHash = () => {
    if (!data?.canonicalReportHash) return;
    navigator.clipboard.writeText(data.canonicalReportHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Export cohort data as JSON
  const handleExportJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cohort-audit-matrix-${data.scenarioId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export cohort data as CSV
  const handleExportCsv = () => {
    if (!data) return;
    const errHeaders = data.injectedErrors.map((e) => `"${e.target_phrase.replace(/"/g, '""')}"`).join(',');
    const headers = `Név,Szerep,Csoport,Összpont,Minősítés,Senior,Téves Riasztás,Idő (mp),${errHeaders},SHA-256 Hash\n`;

    const rows = data.participants
      .map((p) => {
        const errCols = data.injectedErrors
          .map((e) => {
            const status = p.faultRecords[e.id]?.status || 'N/A';
            const score = p.faultRecords[e.id]?.scoreAwarded || 0;
            return `"${status} (${score}p)"`;
          })
          .join(',');

        return `"${p.name}","${p.role}","${p.cohortGroup}",${p.totalScore},"${p.grade}",${
          p.seniorPass ? 'IGEN' : 'NEM'
        },${p.falsePositivesCount},${p.elapsedSeconds},${errCols},"${p.sha256Hash}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cohort-metrics-${data.scenarioId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered participant list
  const filteredParticipants = (data?.participants || []).filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cohortGroup.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'SENIOR') return p.seniorPass;
    if (statusFilter === 'ASSOCIATE') return p.grade === 'ASSOCIATE';
    if (statusFilter === 'BLIND_SPOT') {
      return Object.values(p.faultRecords).some((r) => r.status === 'BLIND_SPOT');
    }
    return true;
  });

  const getStatusBadge = (status: FaultDetectionStatus, score: number, maxScore: number) => {
    switch (status) {
      case 'CAUGHT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Elkapva ({score}p)</span>
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <HelpCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Részleges ({score}p)</span>
          </span>
        );
      case 'BLIND_SPOT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Vakfolt (0p)</span>
          </span>
        );
    }
  };

  const getGradeBadge = (grade: string, seniorPass: boolean) => {
    if (seniorPass) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider">
          <Award className="w-3 h-3 text-amber-400" />
          Senior Pass
        </span>
      );
    }
    if (grade === 'ASSOCIATE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/40">
          Associate
        </span>
      );
    }
    if (grade === 'JUNIOR') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
          Junior
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/40">
        Nem minősült
      </span>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950 text-neutral-100 p-4 lg:p-8 space-y-8 select-text">
      {/* Top Header & Breadcrumb Bar */}
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
            <button
              onClick={onReturnToWorkbench}
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Workbench</span>
            </button>
            <span>/</span>
            <span className="text-neutral-200">B2B Vezetői & Oktatói Portál</span>
            <span>/</span>
            <span className="text-amber-400">Cohort Analytics & Fault Heatmap</span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-amber-400" />
            <span>Csoportos Audit Elemzés & Hiba-Hőtérkép</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-3xl">
            Valós idejű aggregált átvilágítási mátrix. Rámutat a résztvevők rendszerszintű vakfoltjaira,
            a fiktív AI-források benyelési arányára és a humán vs. gépi pontossági mintázatokra.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleCopyHash}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 transition-colors"
            title="Kanonikus RFC 8785 SHA-256 Hash másolása"
          >
            <Copy className="w-3.5 h-3.5 text-neutral-400" />
            <span>{copiedHash ? 'Másolva!' : 'Audit Hash'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 transition-colors"
            title="Kohorsz eredmények exportálása CSV-be"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>CSV Export</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 transition-colors"
            title="Kanonikus JSON adatcsomag mentése"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Kanonikus JSON</span>
          </button>

          <button
            onClick={onReturnToWorkbench}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-neutral-100 hover:bg-white text-neutral-950 font-semibold text-xs transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-neutral-950" />
            <span>Vissza az Audithoz</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-sm font-mono text-neutral-400">Kohorsz hőtérkép aggregálása és RFC 8785 hash lepecsételése...</p>
        </div>
      ) : !data ? (
        <div className="p-8 text-center text-rose-400 border border-rose-900/40 rounded-lg bg-rose-950/20">
          Nem sikerült betölteni a kohorsz elemzési adatokat.
        </div>
      ) : (
        <div className="max-w-[1700px] mx-auto space-y-8">
          {/* Cohort & Scenario Filter Ribbon */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                Kohorsz Csoport:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.availableGroups.map((group) => (
                  <button
                    key={group}
                    onClick={() => setSelectedGroup(group)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      selectedGroup === group
                        ? 'bg-amber-400 text-neutral-950 font-semibold shadow'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
              <span>Eset:</span>
              <span className="text-neutral-200 font-semibold truncate max-w-[280px]">
                {data.scenarioTitle}
              </span>
            </div>
          </div>

          {/* 4 Primary KPI Executive Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Average Score */}
            <div className="p-5 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Átlagos Cohort Pontszám
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      {data.kpis.averageScore}
                    </span>
                    <span className="text-sm font-semibold text-neutral-500">/ 100 pont</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-800/80 text-amber-400 border border-neutral-700/60">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
                <span>Associate szintátlag</span>
                <span className="font-mono text-neutral-300">{data.kpis.totalAudits} auditált fő</span>
              </div>
            </div>

            {/* Card 2: Critical Blind Spot Rate (Prompt & Pivot Metric) */}
            <div className="p-5 rounded-xl bg-rose-950/20 border border-rose-900/50 hover:border-rose-700/60 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Kritikus Vakfolt Arány
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-rose-400 tracking-tight">
                      {data.kpis.criticalBlindSpotRate}%
                    </span>
                    <span className="text-xs text-rose-300/80 font-medium">benyelési ráta</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-900/30 text-rose-400 border border-rose-800/50">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-rose-900/40 text-xs text-rose-300/90 leading-tight">
                A résztvevők többsége kritika nélkül elfogadta a fiktív forrást/adatot.
              </div>
            </div>

            {/* Card 3: Senior Pass Rate (Zero FP Rule) */}
            <div className="p-5 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Senior Minősítési Arány
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      {data.kpis.seniorPassRate}%
                    </span>
                    <span className="text-xs font-medium text-emerald-400">
                      ({Math.round((data.kpis.totalAudits * data.kpis.seniorPassRate) / 100)} / {data.kpis.totalAudits} fő)
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-800/80 text-emerald-400 border border-neutral-700/60">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
                <span>Feltétel: ≥85p ÉS 0 FP</span>
                <span className="text-neutral-300 font-medium">Associate: {data.kpis.associatePassRate}%</span>
              </div>
            </div>

            {/* Card 4: Integrity & Hash Stamp */}
            <div className="p-5 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Kanonikus Integritás
                  </span>
                  <div className="mt-2">
                    <span className="font-mono text-xs font-bold text-amber-300 break-all leading-tight">
                      {data.canonicalReportHash.slice(0, 20)}...
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-800/80 text-amber-400 border border-neutral-700/60">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
                <span>RFC 8785 + SHA-256</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Hitelesített
                </span>
              </div>
            </div>
          </div>

          {/* Fault Heatmap Section */}
          <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-lg">
            {/* Table Control Header */}
            <div className="p-5 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900/90">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Hiba-Hőtérkép Mátrix (Fault Heatmap)</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                    {filteredParticipants.length} résztvevő
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Kattints bármelyik cellára a résztvevő indoklásának és a valós referencia (Ground Truth) részleteinek megtekintéséhez.
                </p>
              </div>

              {/* Search & Quick Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Keresés név vagy beosztás szerint..."
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-400 w-56 transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      statusFilter === 'ALL'
                        ? 'bg-neutral-800 text-white font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Mind
                  </button>
                  <button
                    onClick={() => setStatusFilter('SENIOR')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      statusFilter === 'SENIOR'
                        ? 'bg-amber-400/20 text-amber-300 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Senior
                  </button>
                  <button
                    onClick={() => setStatusFilter('BLIND_SPOT')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      statusFilter === 'BLIND_SPOT'
                        ? 'bg-rose-500/20 text-rose-300 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Vakfoltos
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Swipe Hint */}
            <div className="lg:hidden px-4 py-2 bg-neutral-950/90 border-b border-neutral-800 text-[11px] text-amber-400 font-mono flex items-center justify-between">
              <span>Görgess jobbra a teljes hőtérkép mátrixhoz →</span>
              <span>{filteredParticipants.length} fő</span>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 font-medium font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 shrink-0">Résztvevő & Beosztás</th>
                    <th className="py-3 px-3 shrink-0">Csoport</th>
                    <th className="py-3 px-3 text-center shrink-0">Összpont</th>
                    <th className="py-3 px-3 text-center shrink-0">Minősítés</th>
                    {data.injectedErrors.map((err, idx) => (
                      <th key={err.id} className="py-3 px-4 min-w-[190px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-neutral-300 font-sans font-semibold text-xs flex items-center gap-1">
                            <span>#{idx + 1}.</span>
                            <span className="truncate max-w-[160px]">{err.target_phrase}</span>
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {err.type === 'NUMERIC_MISMATCH'
                              ? 'Számítási hiba'
                              : err.type === 'LOGICAL_CONTRADICTION'
                              ? 'Logikai ütközés'
                              : 'Fiktív forrás'}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center">Téves Riasztás</th>
                    <th className="py-3 px-3 text-center">Audit Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-sans">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5 + data.injectedErrors.length}
                        className="py-12 text-center text-neutral-500"
                      >
                        Nincs a megadott szűrésnek megfelelő résztvevő.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-neutral-850/50 transition-colors group"
                      >
                        {/* Name & Role */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-neutral-100 flex items-center gap-2">
                            <span>{p.name}</span>
                            {p.seniorPass && (
                              <span title="Senior Certified">
                                <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400">{p.role}</div>
                        </td>

                        {/* Cohort Group */}
                        <td className="py-3 px-3 text-neutral-300 text-[11px]">
                          {p.cohortGroup}
                        </td>

                        {/* Score */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-mono font-bold text-sm ${
                              p.totalScore >= 85
                                ? 'text-amber-300'
                                : p.totalScore >= 55
                                ? 'text-neutral-200'
                                : 'text-neutral-400'
                            }`}
                          >
                            {p.totalScore}
                          </span>
                        </td>

                        {/* Grade */}
                        <td className="py-3 px-3 text-center">
                          {getGradeBadge(p.grade, p.seniorPass)}
                        </td>

                        {/* Fault Status Columns */}
                        {data.injectedErrors.map((err) => {
                          const record = p.faultRecords[err.id];
                          const status = record?.status || 'BLIND_SPOT';
                          const score = record?.scoreAwarded || 0;
                          const maxScore = record?.maxScore || 35;

                          return (
                            <td key={err.id} className="py-2.5 px-3">
                              <button
                                onClick={() => setSelectedFaultModal({ participant: p, record })}
                                className="w-full text-left focus:outline-none transition-transform hover:scale-[1.02]"
                                title="Kattints az indoklás megtekintéséhez"
                              >
                                {getStatusBadge(status, score, maxScore)}
                              </button>
                            </td>
                          );
                        })}

                        {/* False Positives */}
                        <td className="py-3 px-3 text-center font-mono">
                          {p.falsePositivesCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                              <span>{p.falsePositivesCount} db</span>
                              <span className="text-[10px] text-rose-500">(-{p.falsePositivesCount * 20}p)</span>
                            </span>
                          ) : (
                            <span className="text-neutral-500 text-[11px]">0</span>
                          )}
                        </td>

                        {/* SHA-256 Hash */}
                        <td className="py-3 px-3 text-center font-mono text-[11px] text-neutral-500">
                          <span className="hover:text-amber-400 cursor-pointer" title={`Teljes ellenőrző hash: ${p.sha256Hash}`}>
                            {p.sha256Hash.slice(0, 8)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Matrix Footer Legend */}
            <div className="p-4 bg-neutral-950/80 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-neutral-300">Jelmagyarázat:</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Elkapva (100% pont, helyes indoklás és korrekció)
                </span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <HelpCircle className="w-3.5 h-3.5" /> Részleges (55% pont, hiányos numerikus levezetés)
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <XCircle className="w-3.5 h-3.5" /> Vakfolt (0 pont, figyelmen kívül hagyott vagy benyelt hiba)
                </span>
              </div>
              <div className="font-mono text-[11px] text-neutral-500">
                Időtartam átlag: ~6 perc 45 mp
              </div>
            </div>
          </div>

          {/* Systemic Blind Spot Drilldown & Insight */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Most Critical Blind Spot Deep Dive */}
            <div className="lg:col-span-2 p-6 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    #1 Rendszerszintű Kockázat: Vakfolt Elemzés
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    „{data.kpis.topSystemicRisk.title}”
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400 font-mono">
                    <span>Típus: {data.kpis.topSystemicRisk.errorType}</span>
                    <span>•</span>
                    <span className="text-rose-400 font-bold">
                      {data.kpis.topSystemicRisk.blindSpotRate}%-os benyelési arány
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold">
                  KRITIKUS
                </span>
              </div>

              <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800/80 text-sm text-neutral-300 leading-relaxed">
                <p className="font-medium text-amber-300 mb-1">Módszertani Elemzés & Tanulság:</p>
                <p>{data.kpis.topSystemicRisk.lesson}</p>
              </div>

              {/* Individual Fault Breakdown Bars */}
              <div className="pt-2 space-y-3">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Beültetett Hibák Kiszűrési Aránya a Csoportban:
                </span>
                {data.injectedErrors.map((err) => {
                  const stat = data.kpis.faultBlindSpotRates[err.id];
                  if (!stat) return null;

                  return (
                    <div key={err.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-200 font-medium truncate max-w-[320px]">
                          {err.target_phrase}
                        </span>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-emerald-400 font-semibold">{stat.caughtRate}% elkapva</span>
                          <span className="text-amber-300">{stat.partialRate}% részleges</span>
                          <span className="text-rose-400 font-semibold">{stat.blindSpotRate}% vakfolt</span>
                        </div>
                      </div>
                      {/* Stacked bar */}
                      <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${stat.caughtRate}%` }}
                          className="bg-emerald-500 transition-all duration-500"
                          title={`Elkapva: ${stat.caughtRate}%`}
                        />
                        <div
                          style={{ width: `${stat.partialRate}%` }}
                          className="bg-amber-400 transition-all duration-500"
                          title={`Részleges: ${stat.partialRate}%`}
                        />
                        <div
                          style={{ width: `${stat.blindSpotRate}%` }}
                          className="bg-rose-500 transition-all duration-500"
                          title={`Vakfolt: ${stat.blindSpotRate}%`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Col: Dual Benchmark (Human vs. AI) */}
            <div className="p-6 rounded-xl bg-purple-950/20 border border-purple-900/50 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Dual Benchmark: Humán vs. AI Modellek
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Korszerű LLM Audit Baseline
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Ugyanazon forgatókönyv lefutása a vezető nyelvi modelleken, összevetve a humán kohorsz eredménnyel.
                </p>

                <div className="mt-4 space-y-2.5">
                  {/* Human Cohort Average */}
                  <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Humán Csoport Átlag</div>
                      <div className="text-[11px] text-neutral-400">14 átvilágító elemző</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-amber-300">
                        {data.aiComparison.humanAvgScore} pont
                      </div>
                      <div className="text-[10px] text-rose-400 font-mono">
                        {data.aiComparison.humanBlindSpotRate}% vakfolt
                      </div>
                    </div>
                  </div>

                  {/* AI Models list */}
                  {data.aiComparison.models.map((m) => (
                    <div
                      key={m.modelId}
                      className="p-3 rounded-lg bg-neutral-950/90 border border-purple-900/40 hover:border-purple-600/50 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                          <span>{m.modelName}</span>
                          <span className="text-[10px] font-normal text-neutral-500 font-mono">[{m.provider}]</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          Hallucináció: {m.hallucinationRate} • {m.latencyMs}ms
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-purple-300">
                          {m.score} pont
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {m.blindSpotCount === 0 ? (
                            <span className="text-emerald-400 font-medium">0 vakfolt</span>
                          ) : (
                            <span className="text-rose-400 font-medium">{m.blindSpotCount} vakfolt</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-purple-900/40 text-[11px] text-purple-300/80 leading-snug">
                <strong>Megfigyelés:</strong> Míg az élvonalbeli modellek (Claude, Gemini) 0 vakfolttal detektálják a forrás- és logikai hibákat, a vizsgázók 78%-a benyeli a fiktív forrást.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Slide-over / Modal for Heatmap Cell Inspector */}
      {selectedFaultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-800 flex items-start justify-between bg-neutral-950">
              <div>
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  Audit Értékelő Részletező
                </span>
                <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                  <span>{selectedFaultModal.participant.name}</span>
                  <span className="text-xs text-neutral-400 font-normal">
                    ({selectedFaultModal.participant.role})
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedFaultModal(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-neutral-300">
              {/* Fault Meta & Status */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-neutral-400">Vizsgált Beültetett Hiba:</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    „{selectedFaultModal.record.targetPhrase}”
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Kategória: <strong className="text-neutral-200">{selectedFaultModal.record.errorType}</strong>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(
                    selectedFaultModal.record.status,
                    selectedFaultModal.record.scoreAwarded,
                    selectedFaultModal.record.maxScore
                  )}
                  <div className="text-[10px] text-neutral-400 font-mono mt-1">
                    {selectedFaultModal.record.scoreAwarded} / {selectedFaultModal.record.maxScore} pont
                  </div>
                </div>
              </div>

              {/* Ground Truth Definition */}
              <div className="space-y-1.5">
                <span className="font-semibold text-neutral-300 uppercase tracking-wider font-mono text-[11px]">
                  Hivatalos Referencia (Ground Truth):
                </span>
                <div className="p-3.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-neutral-300 leading-relaxed">
                  {selectedFaultModal.record.groundTruthExplanation}
                </div>
              </div>

              {/* What the participant wrote / missed */}
              <div className="space-y-1.5">
                <span className="font-semibold text-neutral-300 uppercase tracking-wider font-mono text-[11px]">
                  Résztvevő Jelölése & Észrevétele:
                </span>
                <div className="p-3.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-neutral-300 font-mono">
                  {selectedFaultModal.record.userFinding || 'Nincs rögzített észrevétel.'}
                </div>
              </div>

              {/* Proposed Correction */}
              <div className="space-y-1.5">
                <span className="font-semibold text-neutral-300 uppercase tracking-wider font-mono text-[11px]">
                  Javasolt Helyesbítés:
                </span>
                <div className="p-3.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-neutral-300">
                  {selectedFaultModal.record.userCorrection || 'Nincs megadva.'}
                </div>
              </div>

              {/* Grading Engine Feedback */}
              <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-200">
                <span className="font-semibold uppercase tracking-wider font-mono text-[10px] block mb-1">
                  Determinisztikus Értékelő Visszajelzés:
                </span>
                <p className="leading-relaxed">{selectedFaultModal.record.feedback}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
              <button
                onClick={() => setSelectedFaultModal(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
