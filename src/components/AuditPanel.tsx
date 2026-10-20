import React from 'react';
import {
  Building2,
  Trash2,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  Calculator,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import type { Scenario, UserAnnotation, ErrorType } from '../types/audit';
import { ERROR_TYPE_LABELS } from '../types/audit';

interface AuditPanelProps {
  scenario: Scenario;
  annotations: UserAnnotation[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string | null) => void;
  onUpdateAnnotation: (id: string, updates: Partial<UserAnnotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onOpenCalculator: () => void;
  onSubmitAudit: () => void;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({
  scenario,
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onOpenCalculator,
  onSubmitAudit,
}) => {
  return (
    <aside className="w-full lg:w-[480px] xl:w-[520px] bg-neutral-950 border-l border-neutral-800 flex flex-col h-full overflow-hidden select-none">
      {/* Pane Subheader */}
      <div className="px-5 py-2.5 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-medium text-neutral-200">Célvállalat & Audit Panel</span>
        </div>
        <button
          onClick={onOpenCalculator}
          className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors"
          title="Számológép megnyitása"
        >
          <Calculator className="w-3 h-3" />
          <span>Gyorskalkulátor</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Context & Target KPIs Strip */}
        <section className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-4">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-300">
              {scenario.context.target_name}
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">
              {scenario.meta.domain}
            </span>
          </div>

          {/* KPI grid with strict tabular figures */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {scenario.context.arr && (
              <div className="p-2 bg-neutral-950/80 rounded border border-neutral-800/80">
                <span className="text-[10px] uppercase font-mono text-neutral-400 block">ARR (Éves bevétel)</span>
                <span className="font-mono font-semibold text-neutral-100 text-sm">
                  {scenario.context.arr}
                </span>
              </div>
            )}

            {scenario.context.opex && (
              <div className="p-2 bg-neutral-950/80 rounded border border-neutral-800/80">
                <span className="text-[10px] uppercase font-mono text-neutral-400 block">Opex (Működési költség)</span>
                <span className="font-mono font-semibold text-neutral-100 text-sm">
                  {scenario.context.opex}
                </span>
              </div>
            )}

            {scenario.context.gmv && (
              <div className="p-2 bg-neutral-950/80 rounded border border-neutral-800/80">
                <span className="text-[10px] uppercase font-mono text-neutral-400 block">GMV (Bruttó forgalom)</span>
                <span className="font-mono font-semibold text-neutral-100 text-sm">
                  {scenario.context.gmv}
                </span>
              </div>
            )}

            {scenario.context.marketing_spend && (
              <div className="p-2 bg-neutral-950/80 rounded border border-neutral-800/80">
                <span className="text-[10px] uppercase font-mono text-neutral-400 block">Marketing büdzsé</span>
                <span className="font-mono font-semibold text-neutral-100 text-sm">
                  {scenario.context.marketing_spend}
                </span>
              </div>
            )}

            {scenario.context.headcount && (
              <div className="p-2 bg-neutral-950/80 rounded border border-neutral-800/80">
                <span className="text-[10px] uppercase font-mono text-neutral-400 block">Létszám</span>
                <span className="font-mono font-semibold text-neutral-100 text-sm">
                  {scenario.context.headcount} fő
                </span>
              </div>
            )}

            {scenario.context.churn_metric && (
              <div className="p-2 bg-neutral-950/80 rounded border border-neutral-800/80">
                <span className="text-[10px] uppercase font-mono text-neutral-400 block">Megtartás</span>
                <span className="font-mono font-semibold text-neutral-100 text-xs truncate block">
                  {scenario.context.churn_metric}
                </span>
              </div>
            )}

            {Object.entries(scenario.context.additional_kpis).map(([label, val], idx) => (
              <div key={idx} className="p-2 bg-neutral-950/80 rounded border border-neutral-800/80">
                <span className="text-[10px] uppercase font-mono text-neutral-400 block truncate">{label}</span>
                <span className="font-mono font-medium text-neutral-200 text-xs truncate block">{val}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Active Annotations Drawer */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-300">
              Rögzített Auditori Jelölések
            </h3>
            <span className="text-xs font-mono text-neutral-400">
              {annotations.length} elem
            </span>
          </div>

          {annotations.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-neutral-800 rounded-lg bg-neutral-900/30">
              <ShieldAlert className="w-6 h-6 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-neutral-300">Nincs még rögzített jelölés</p>
              <p className="text-[11px] text-neutral-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Jelölj ki a bal oldali szövegben egy gyanús állítást vagy számítási hibát a vizsgálathoz.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {annotations.map((ann, idx) => {
                const meta = ERROR_TYPE_LABELS[ann.selectedType];
                const isSelected = selectedAnnotationId === ann.id;

                return (
                  <div
                    key={ann.id}
                    onClick={() => onSelectAnnotation(ann.id)}
                    className={`p-3.5 rounded-lg border transition-all text-xs ${
                      isSelected
                        ? 'bg-neutral-900 border-neutral-600 ring-1 ring-neutral-500 shadow-md'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {/* Header: Number, Category selector, Delete button */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-neutral-400">
                          #{idx + 1}
                        </span>
                        <select
                          value={ann.selectedType}
                          onChange={(e) =>
                            onUpdateAnnotation(ann.id, {
                              selectedType: e.target.value as ErrorType,
                            })
                          }
                          className={`text-[11px] font-mono py-0.5 px-2 rounded border bg-neutral-950 cursor-pointer ${meta.border} ${meta.color} focus:outline-none focus:ring-1 focus:ring-neutral-400`}
                        >
                          <option value="NUMERIC_MISMATCH">Adathiba / Számítás</option>
                          <option value="LOGICAL_CONTRADICTION">Logikai ellentmondás</option>
                          <option value="FABRICATED_SOURCE">Fiktív forrás / Hallucináció</option>
                        </select>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAnnotation(ann.id);
                        }}
                        className="text-neutral-500 hover:text-rose-400 p-1 transition-colors"
                        title="Jelölés törlése"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quoted phrase */}
                    <div className="p-2 mb-2.5 rounded bg-neutral-950 border border-neutral-800/80 font-mono text-[11px] text-neutral-300 italic">
                      "{ann.target_phrase}"
                    </div>

                    {/* Justification input */}
                    <div className="space-y-1.5 select-text">
                      <label className="text-[10px] font-mono text-neutral-400 block">
                        Auditori indoklás (Miért hiba?):
                      </label>
                      <textarea
                        value={ann.justification}
                        onChange={(e) =>
                          onUpdateAnnotation(ann.id, { justification: e.target.value })
                        }
                        placeholder="pl. A megadott $12.4M ARR és $9.8M opex mellett az EBITDA 21.0%, nem 35.2%..."
                        rows={2}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 resize-none font-sans"
                      />
                    </div>

                    {/* Suggested correction */}
                    <div className="space-y-1 select-text mt-2">
                      <label className="text-[10px] font-mono text-neutral-400 block">
                        Helyes adat / megoldás:
                      </label>
                      <input
                        type="text"
                        value={ann.proposedCorrection}
                        onChange={(e) =>
                          onUpdateAnnotation(ann.id, { proposedCorrection: e.target.value })
                        }
                        placeholder="pl. 20.97% valós EBITDA árrés"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 font-sans"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Diagnostic Reminder & Submit Trigger */}
        <div className="pt-2">
          <div className="p-3 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-neutral-400" />
              <span>Auditori Protokoll:</span>
            </div>
            <p>
              Csak azt jelöld meg, amit a referencia-adatokkal vagy logikai érvekkel igazolni tudsz.
              A téves riasztások csökkentik a Megbízhatósági Indexet.
            </p>
          </div>

          <button
            onClick={onSubmitAudit}
            disabled={annotations.length === 0}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-neutral-100 hover:bg-white text-neutral-950 font-semibold text-xs transition-colors shadow disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Audit Befejezése & Kiértékelés</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
