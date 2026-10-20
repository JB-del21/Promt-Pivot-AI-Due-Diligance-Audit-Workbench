import React, { useState } from 'react';
import { X, Calculator, ArrowRight, RotateCcw } from 'lucide-react';
import { FinancialCalculators } from '../utils/auditScoring';
import type { Scenario } from '../types/audit';

interface FinancialCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: Scenario;
}

export const FinancialCalculatorModal: React.FC<FinancialCalculatorModalProps> = ({
  isOpen,
  onClose,
  scenario,
}) => {
  if (!isOpen) return null;

  // EBITDA State
  const [revenue, setRevenue] = useState<number>(12.4);
  const [opex, setOpex] = useState<number>(9.8);

  // Valuation State
  const [ev, setEv] = useState<number>(175);
  const [arr, setArr] = useState<number>(12.4);

  // Unit Economics CAC State
  const [marketingSpend, setMarketingSpend] = useState<number>(3600000);
  const [newCustomers, setNewCustomers] = useState<number>(90000);

  // Rule of 40 State
  const [growthRate, setGrowthRate] = useState<number>(25);
  const [margin, setMargin] = useState<number>(21);

  const ebitda = FinancialCalculators.ebitda(revenue, opex);
  const ebitdaMargin = FinancialCalculators.ebitdaMargin(revenue, opex);
  const multiple = FinancialCalculators.evMultiple(ev, arr);
  const cac = FinancialCalculators.blendedCac(marketingSpend, newCustomers);
  const rule40 = FinancialCalculators.ruleOf40(growthRate, margin);

  // Populate from active scenario
  const handleLoadFromScenario = () => {
    if (scenario.scenario_id.includes('cloudpulse')) {
      setRevenue(12.4);
      setOpex(9.8);
      setEv(175);
      setArr(12.4);
    } else if (scenario.scenario_id.includes('nordic')) {
      setMarketingSpend(3600000);
      setNewCustomers(90000);
    } else if (scenario.scenario_id.includes('novapay')) {
      setRevenue(6.8);
      setOpex(5.2);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-neutral-300" />
            <h3 className="text-sm font-semibold text-neutral-100">
              Pénzügyi & M&A Gyorskalkulátor
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs text-neutral-300">
          <div className="flex items-center justify-between p-3 rounded bg-neutral-950 border border-neutral-800">
            <span className="text-neutral-400">Aktuális eset adatai:</span>
            <button
              onClick={handleLoadFromScenario}
              className="text-neutral-200 hover:text-white font-medium flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Adatok beillesztése</span>
            </button>
          </div>

          {/* Module 1: EBITDA & EBITDA Margin */}
          <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800/80 space-y-3">
            <h4 className="font-semibold text-neutral-200 uppercase tracking-wider font-mono text-[11px]">
              1. EBITDA & EBITDA Árrés
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1 font-mono">
                  Bevétel / ARR ($M)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={revenue}
                  onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1 font-mono">
                  Működési költség / Opex ($M)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={opex}
                  onChange={(e) => setOpex(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-neutral-200">
              <span className="font-mono">Számított EBITDA:</span>
              <span className="font-mono font-bold text-sm text-neutral-100">
                ${ebitda}M
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-200">
              <span className="font-mono">Valós EBITDA Árrés:</span>
              <span className={`font-mono font-bold text-sm ${ebitdaMargin > 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {ebitdaMargin}%
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 font-mono">
              Képlet: (Bevétel - Opex) / Bevétel × 100
            </p>
          </div>

          {/* Module 2: Valuation Multiple */}
          <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800/80 space-y-3">
            <h4 className="font-semibold text-neutral-200 uppercase tracking-wider font-mono text-[11px]">
              2. EV / ARR Értékelési Szorzó
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1 font-mono">
                  Indikatív Cégérték / EV ($M)
                </label>
                <input
                  type="number"
                  value={ev}
                  onChange={(e) => setEv(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1 font-mono">
                  ARR ($M)
                </label>
                <input
                  type="number"
                  value={arr}
                  onChange={(e) => setArr(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-neutral-200">
              <span className="font-mono">Alkalmazott EV/ARR Szorzó:</span>
              <span className="font-mono font-bold text-sm text-neutral-100">
                {multiple}x
              </span>
            </div>
          </div>

          {/* Module 3: Customer Acquisition Cost (CAC) */}
          <div className="p-4 rounded-lg bg-neutral-950/60 border border-neutral-800/80 space-y-3">
            <h4 className="font-semibold text-neutral-200 uppercase tracking-wider font-mono text-[11px]">
              3. Blended Ügyfél-akvizíciós Költség (CAC)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1 font-mono">
                  Összes Marketing Költés (€)
                </label>
                <input
                  type="number"
                  value={marketingSpend}
                  onChange={(e) => setMarketingSpend(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1 font-mono">
                  Új Vásárlók Száma (fő)
                </label>
                <input
                  type="number"
                  value={newCustomers}
                  onChange={(e) => setNewCustomers(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-neutral-200">
              <span className="font-mono">Valós Blended CAC:</span>
              <span className="font-mono font-bold text-sm text-neutral-100">
                €{cac} / vásárló
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 font-mono">
              Figyelem: A hirdetési kattintási/lead ár NEM azonos a teljes vevőakvizíciós költséggel!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 flex justify-end bg-neutral-950">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-neutral-950 bg-neutral-100 hover:bg-white rounded transition-colors"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};
