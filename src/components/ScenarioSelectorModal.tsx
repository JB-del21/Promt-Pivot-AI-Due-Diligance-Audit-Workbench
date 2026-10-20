import React from 'react';
import { X, Check, Building, ShoppingCart, Landmark } from 'lucide-react';
import { SCENARIOS } from '../data/scenarios';
import type { Scenario } from '../types/audit';

interface ScenarioSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScenarioId: string;
  onSelectScenario: (scenario: Scenario) => void;
}

export const ScenarioSelectorModal: React.FC<ScenarioSelectorModalProps> = ({
  isOpen,
  onClose,
  currentScenarioId,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  const getDomainIcon = (domain: string) => {
    if (domain.includes('E-Commerce')) return <ShoppingCart className="w-4 h-4 text-emerald-400" />;
    if (domain.includes('FinTech')) return <Landmark className="w-4 h-4 text-indigo-400" />;
    return <Building className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">
              Forgatókönyv Kiválasztása
            </h3>
            <p className="text-[11px] text-neutral-400">
              Válassz a valós üzleti és pénzügyi átvilágítási feladatok közül
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 space-y-3">
          {SCENARIOS.map((sc) => {
            const isSelected = sc.scenario_id === currentScenarioId;

            return (
              <div
                key={sc.scenario_id}
                onClick={() => {
                  onSelectScenario(sc);
                  onClose();
                }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-neutral-950 border-neutral-600 ring-1 ring-neutral-400'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950/90'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {getDomainIcon(sc.meta.domain)}
                    <h4 className="text-xs font-semibold text-neutral-100">
                      {sc.meta.title}
                    </h4>
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <Check className="w-3 h-3" /> Aktív
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
                  {sc.meta.summary}
                </p>

                <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-400 pt-2 border-t border-neutral-800/80">
                  <span>Cég: <strong className="text-neutral-300">{sc.context.target_name}</strong></span>
                  <span>·</span>
                  <span>Szint: <strong className="text-amber-400">{sc.meta.difficulty}</strong></span>
                  <span>·</span>
                  <span>Időkeret: <strong className="text-neutral-300">{Math.round(sc.meta.time_limit_sec / 60)} perc</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
