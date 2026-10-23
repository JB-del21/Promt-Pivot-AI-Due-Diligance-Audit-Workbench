import React from 'react';
import { X, FileText, ShieldAlert, Award, Hash, BookCheck, Cpu, Database, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface SystemDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemDocumentationModal: React.FC<SystemDocumentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-text">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-900/95 backdrop-blur z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-neutral-800 text-neutral-300">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <span>Rendszerdokumentáció & Architektúra</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Enterprise V2 Edition
                </span>
              </h3>
              <p className="text-[11px] text-neutral-300">
                AI Due Diligence Audit Workbench · Architektúra, Gemini AI SDK & Kiértékelési Munkaterv
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100 transition-colors p-1.5 rounded hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="Bezárás (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs text-neutral-200 leading-relaxed overflow-y-auto">
          {/* Section 1: Cél és jogi pozicionálás */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-neutral-100 font-semibold text-xs uppercase tracking-wider font-mono">
              <BookCheck className="w-3.5 h-3.5 text-sky-400" />
              <h4>1. Cél és Működési Módszertan</h4>
            </div>
            <p className="text-neutral-200 text-[12px] leading-relaxed">
              Az <strong>AI Due Diligence Audit Workbench</strong> egy specializált átvilágítási gyakorló- és szimulációs platform. Azt gyakoroltatja, hogy az elemző a mesterséges intelligenciával támogatott vagy a menedzsment által készített M&A-összefoglalókban megtalálja a rejtett hibákat és hallucinációkat, végigvíve a teljes audit-láncot:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-sky-400 font-semibold">1. Kijelölés:</span> A gyanús állítás beazonosítása a Vak Munkalapon.
              </div>
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-sky-400 font-semibold">2. Kategorizálás:</span> Számszaki, logikai vagy forráshiba besorolása.
              </div>
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-sky-400 font-semibold">3. Indoklás:</span> Összefüggő szakmai érv konkrét adathorgonyzással.
              </div>
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-sky-400 font-semibold">4. Helyesbítés:</span> A korrigált tényadat vagy levezetés megadása.
              </div>
            </div>
          </section>

          {/* Section 2: Gemini AI Integráció & @google/genai SDK */}
          <section className="space-y-3 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center gap-2 text-neutral-100 font-semibold text-xs uppercase tracking-wider font-mono">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <h4>2. AI Integráció & @google/genai SDK Használata</h4>
            </div>
            <p className="text-neutral-300 text-[12px]">
              A projekthez csatolt <code className="text-purple-300 font-mono">@google/genai</code> csomag a backend szerveren (<code className="text-purple-300 font-mono">server.ts</code>) van élesítve a <strong>POST /api/benchmark/run</strong> végponton:
            </p>

            <div className="p-3 rounded-lg bg-neutral-950 border border-purple-900/40 font-mono text-[11px] space-y-1.5 text-neutral-300">
              <div className="text-purple-300 font-semibold">• Szerveroldali Gemini 3.8 Flash Átvilágító Ágens</div>
              <div>• A dokumentumot valós időben továbbítja a Google Gemini API-nak szigorú JSON sémával (<code className="text-purple-200">responseSchema</code>).</div>
              <div>• Anti-FDoS védelem: 10 másodperces hard Promise.race időkorlát és 20,000 karakteres dokumentum-korlát.</div>
              <div>• API kulcs hiányában a rendszer zökkenőmentesen átvált a kalibrált Gemini 3.8 Flash szimulációs magra.</div>
            </div>
          </section>

          {/* Section 3: Adatperzisztencia & Állapotkezelés */}
          <section className="space-y-3 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center gap-2 text-neutral-100 font-semibold text-xs uppercase tracking-wider font-mono">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <h4>3. Adatperzisztencia & Centralizált Audit Store</h4>
            </div>
            <p className="text-neutral-300 text-[12px]">
              Az alkalmazás állapotát a centralizált <code className="text-emerald-300 font-mono">AuditContext</code> és React Custom Hook kezeli:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-sans">
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="font-semibold text-emerald-400 text-xs mb-1">Munkamenet MENTÉS (LocalStorage)</div>
                <p className="text-[11px] text-neutral-300">
                  Az aktív annotációk, az eltelt idő és a nehezítési mód automatikusan mentődik a böngésző helyi tárolójába (<code className="text-emerald-300 font-mono">prompt_pivot_session_v2</code>). Az oldal újratöltésekor a megkezdett átvilágítás nem veszik el.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="font-semibold text-emerald-400 text-xs mb-1">Auditor Profil & SHA-256 Log</div>
                <p className="text-[11px] text-neutral-300">
                  A lezárt auditok tanúsítványai és a SHA-256 kriptográfiai hash-ek az <code className="text-emerald-300 font-mono">AuditHistoryModal</code> felületén megtekinthetők és verifikálhatók.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Négydimenziós pontozás */}
          <section className="space-y-3 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center gap-2 text-neutral-100 font-semibold text-xs uppercase tracking-wider font-mono">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <h4>4. A Négydimenziós Pontozási Rendszer</h4>
            </div>
            <p className="text-neutral-300 text-[12px]">
              Minden beültetett hibához egy meghatározott pontkeret tartozik (35, 35 és 30 pont, összesen 100 pont). A tétel pontjai négy dimenzióra oszlanak:
            </p>

            <div className="overflow-x-auto border border-neutral-800 rounded-lg">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-neutral-950 text-neutral-300 font-mono border-b border-neutral-800">
                  <tr>
                    <th className="py-2 px-3">Dimenzió</th>
                    <th className="py-2 px-3 w-16">Súly</th>
                    <th className="py-2 px-3">Szabály a kiértékelő magban</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-sans">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-neutral-200 font-mono">Kijelölés</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-mono">35%</td>
                    <td className="py-2.5 px-3 text-neutral-200">
                      Szigorú illesztés: legalább 6 karakter és 2 szó. Részsztring-találathoz legalább 10 karakter és 50%-os hosszarány, vagy 0,65-ös Jaccard-hasonlóság szükséges.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-neutral-200 font-mono">Kategória</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-mono">25%</td>
                    <td className="py-2.5 px-3 text-neutral-200">
                      Egyeznie kell a hiba típusával. Téves kategóriánál ez a rész 0 pont.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-neutral-200 font-mono">Indoklás</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-mono">25%</td>
                    <td className="py-2.5 px-3 text-neutral-200">
                      Legalább 20 karakter, 5 szó, legalább 2 független kulcsfogalom és környezeti adathorgonyzás (szám vagy tényállás).
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-neutral-200 font-mono">Helyesbítés</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-mono">Maradék (15%)</td>
                    <td className="py-2.5 px-3 text-neutral-200">
                      Számszaki hibánál kötelező numerikus érték a megadott tolerancián belül. Szöveges hibánál konkrét javítás min. 3 szóban.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 5: Minősítési szintek & Téves riasztások */}
          <section className="space-y-3 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center gap-2 text-neutral-100 font-semibold text-xs uppercase tracking-wider font-mono">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <h4>5. Minősítési Szintek és Téves Riasztások (-20 pont)</h4>
            </div>

            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-[11px] text-neutral-200 space-y-1">
              <div className="font-semibold text-rose-400 flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Téves Riasztás (False Positive) Szabálya: -20 pont levonás</span>
              </div>
              <p className="text-neutral-300">
                A rendszer szigorúan szankcionálja az ész nélküli jelölgetést:
              </p>
              <ul className="list-disc list-inside text-neutral-200 space-y-0.5 pl-1">
                <li>Minden olyan annotáció, amely egyetlen beültetett hibához sem illeszkedik, <strong>-20 pontot</strong> von le.</li>
                <li><strong>Senior Auditor</strong> szint eléréséhez elengedhetetlen a <strong>pontosan 0 téves riasztás</strong> és a legalább 85%-os összpontszám.</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Riport-integritás & SHA-256 */}
          <section className="space-y-2 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center gap-2 text-neutral-100 font-semibold text-xs uppercase tracking-wider font-mono">
              <Hash className="w-3.5 h-3.5 text-purple-400" />
              <h4>6. Riport-integritás & RFC 8785 SHA-256 Lenyomat</h4>
            </div>
            <p className="text-neutral-200 text-[12px]">
              Az audit lezárásakor az eredményekből determinisztikus digitális ujjlenyomat képződik:
            </p>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-[11px] space-y-1 text-neutral-300">
              <div>• <strong>Kanonizálás:</strong> RFC 8785 szabvány szerint lexikográfiailag rendezett JSON kulcsok, undefined értékek elhagyva.</div>
              <div>• <strong>Fedezett adatok:</strong> Forgatókönyv azonosító, nehezítési mód (STRICT/GUIDED), vizsgálati idő, pontszámok, elért szint, annotációk.</div>
              <div>• <strong>Kriptográfiai kivonat:</strong> SHA-256 Web Crypto hash (<code className="text-purple-300">SHA256:...</code>).</div>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-300 shrink-0">
          <span className="font-mono text-[11px] text-neutral-400">
            ENGINE: PROMPT-PIVOT-V2.5 · RFC 8785 + SHA-256
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-neutral-100 hover:bg-white text-neutral-900 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};
