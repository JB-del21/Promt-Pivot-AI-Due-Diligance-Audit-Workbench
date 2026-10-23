import React from 'react';
import { X, FileText, ShieldAlert, Award, Hash, CheckCircle2, AlertTriangle, Layers, BookCheck } from 'lucide-react';

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
                <span>Rendszerdokumentáció & Szakmai Módszertan</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                  Tájékoztató Kiadás
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                AI Due Diligence Audit Workbench · Kiértékelési szabályzat és korlátok
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100 transition-colors p-1.5 rounded hover:bg-neutral-800"
            title="Bezárás (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs text-neutral-300 leading-relaxed overflow-y-auto">
          {/* Section 1: Cél és jogi pozicionálás */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-neutral-100 font-semibold text-xs uppercase tracking-wider font-mono">
              <BookCheck className="w-3.5 h-3.5 text-sky-400" />
              <h4>1. Cél és Jogi Pozicionálás</h4>
            </div>
            <p className="text-neutral-300 text-[12px] leading-relaxed">
              Az <strong>AI Due Diligence Audit Workbench</strong> egy specializált átvilágítási gyakorló- és szimulációs webalkalmazás. Azt gyakoroltatja, hogy az elemző a mesterséges intelligenciával támogatott vagy a menedzsment által készített M&A-összefoglalókban megtalálja a rejtett hibákat, és a teljes ellenőrzési láncot végigvigye:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-sky-400 font-semibold">1. Kijelölés:</span> A gyanús állítás beazonosítása a dokumentumban.
              </div>
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-sky-400 font-semibold">2. Kategorizálás:</span> Számszaki, logikai vagy forráshiba besorolása.
              </div>
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-sky-400 font-semibold">3. Indoklás:</span> Összefüggő szakmai érv a konkrét adatokra hivatkozva.
              </div>
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-sky-400 font-semibold">4. Helyesbítés:</span> A korrigált tényadat vagy levezetés megadása.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-400">
              <strong className="text-neutral-200">Jogi nyilatkozat:</strong> A rendszer <em>nem akkreditált vizsgarendszer</em>. Nincs mögötte pszichometriai validáció, sem független emberi minősítésekkel összevetett referenciaadat, ezért az elért minősítések kizárólag képzési és tájékoztató jellegűek.
            </div>
          </section>

          {/* Section 2: Négydimenziós pontozás */}
          <section className="space-y-3 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center gap-2 text-neutral-100 font-semibold text-xs uppercase tracking-wider font-mono">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <h4>2. A Négydimenziós Pontozási Rendszer</h4>
            </div>
            <p className="text-neutral-400 text-[12px]">
              Minden beültetett hibához egy meghatározott pontkeret tartozik (35, 35 és 30 pont, összesen 100 pont). A tétel pontjai négy dimenzióra oszlanak:
            </p>

            <div className="overflow-x-auto border border-neutral-800 rounded-lg">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-neutral-950 text-neutral-400 font-mono border-b border-neutral-800">
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
                    <td className="py-2.5 px-3 text-neutral-300">
                      Szigorú illesztés: legalább 6 karakter és 2 szó. Részsztring-találathoz legalább 10 karakter és 50%-os hosszarány, vagy 0,65-ös Jaccard-hasonlóság szükséges.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-neutral-200 font-mono">Kategória</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-mono">25%</td>
                    <td className="py-2.5 px-3 text-neutral-300">
                      Egyeznie kell a hiba típusával. Téves kategóriánál ez a rész 0 pont (külön büntetés nincs, de a tétel nem érheti el a maximumot, így a Senior szint kizárt).
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-neutral-200 font-mono">Indoklás</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-mono">25%</td>
                    <td className="py-2.5 px-3 text-neutral-300">
                      Legalább 20 karakter, 5 szó (min. 4 különböző), legalább 2 független kulcsfogalom és környezeti adathorgonyzás (szám vagy környezeti szavak).
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-neutral-200 font-mono">Helyesbítés</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-mono">Maradék (15%)</td>
                    <td className="py-2.5 px-3 text-neutral-300">
                      Számszaki hibánál kötelező numerikus érték a megadott tolerancián belül (a matematikai levezetések is érvényesek). Szöveges hibánál konkrét javítás min. 3 szóban.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-neutral-400 italic">
              * A részpontok tételenként a pontkereten belül maradnak: a helyesbítés mindig a tétel maradéka, így a kerekítési túlcsordulás (pl. 102/100 pont) matematikailag kizárt.
            </p>
          </section>

          {/* Section 3: Minősítési szintek & Téves riasztások */}
          <section className="space-y-3 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center gap-2 text-neutral-100 font-semibold text-xs uppercase tracking-wider font-mono">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <h4>3. Minősítési Szintek és Téves Riasztások</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-sans">
              <div className="p-3 rounded-lg bg-neutral-950 border border-emerald-900/40">
                <div className="font-semibold text-emerald-400 text-xs mb-1">Senior Elemzői Szint</div>
                <ul className="text-[11px] text-neutral-300 space-y-1 list-disc list-inside">
                  <li>Összpontszám: <strong className="text-neutral-100 font-mono">≥ 85%</strong></li>
                  <li>Elemzési pontok: <strong className="text-neutral-100 font-mono">≥ 60%</strong></li>
                  <li>Téves riasztás: <strong className="text-neutral-100 font-mono">pontosan 0</strong></li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-sky-900/40">
                <div className="font-semibold text-sky-400 text-xs mb-1">Gyakorlott (Associate)</div>
                <ul className="text-[11px] text-neutral-300 space-y-1 list-disc list-inside">
                  <li>Összpontszám: <strong className="text-neutral-100 font-mono">≥ 55%</strong></li>
                  <li>Elemzési pontok: <strong className="text-neutral-100 font-mono">&gt; 0 pont</strong></li>
                  <li>Téves riasztás: <strong className="text-neutral-100 font-mono">legfeljebb 1</strong></li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-rose-900/40">
                <div className="font-semibold text-rose-400 text-xs mb-1">Hiányos Indoklás / Képzés</div>
                <ul className="text-[11px] text-neutral-300 space-y-1 list-disc list-inside">
                  <li>Összpontszám &lt; 55%</li>
                  <li>Vagy 1-nél több téves riasztás</li>
                  <li>Vagy hiányzó elemzési pontok</li>
                </ul>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-[11px] text-neutral-300 space-y-1">
              <div className="font-semibold text-rose-400 flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Téves Riasztás (False Positive) Szabálya: -20 pont levonás</span>
              </div>
              <p className="text-neutral-400">
                A rendszer szigorúan szankcionálja a vak kijelölést:
              </p>
              <ul className="list-disc list-inside text-neutral-300 space-y-0.5 pl-1">
                <li>Minden olyan annotáció, amely egyetlen beültetett hibához sem illeszkedik, <strong>-20 pontot</strong> von le.</li>
                <li><strong>Duplikált kijelölés:</strong> ha a felhasználó ugyanarra a beültetett hibára egynél több annotációt tesz, az első sikeres párosítás után a többlet-annotációk téves riasztásnak minősülnek (-20 pont).</li>
              </ul>
              <p className="text-neutral-400 pt-1">
                * A tétel- és végösszeg pontszámok szigorúan a <code className="font-mono text-neutral-300">[0, 100]</code> sávra vannak levágva (nem mehetnek negatívba és nem csordulhatnak túl).
              </p>
            </div>
          </section>

          {/* Section 4: Riport-integritás & SHA-256 */}
          <section className="space-y-2 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center gap-2 text-neutral-100 font-semibold text-xs uppercase tracking-wider font-mono">
              <Hash className="w-3.5 h-3.5 text-purple-400" />
              <h4>4. Riport-integritás és SHA-256 Ellenőrző Összeg</h4>
            </div>
            <p className="text-neutral-300 text-[12px]">
              Az audit lezárásakor az eredményekből determinisztikus digitális ujjlenyomat képződik:
            </p>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-[11px] space-y-1 text-neutral-400">
              <div>• <strong>Kanonizálás:</strong> RFC 8785 szabvány szerint lexikográfiailag rendezett JSON kulcsok, undefined értékek elhagyva.</div>
              <div>• <strong>Fedezett adatok:</strong> Forgatókönyv azonosító, időbélyeg, vizsgálati idő, pontszámok, elért szint, annotációk és a találati mátrix.</div>
              <div>• <strong>Kriptográfiai kivonat:</strong> SHA-256 Web Crypto hash (<code className="text-purple-300">SHA256:...</code>).</div>
            </div>

            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-200/90 leading-relaxed">
              <strong className="text-amber-300 block mb-0.5 font-mono uppercase">Fontos Biztonsági és Jogi Korlát:</strong>
              Ez egy <em>kliensoldali sértetlenségi ellenőrző összeg</em>. A véletlen vagy utólagos kézi módosítást kimutatja, <strong>de szándékos hamisítás ellen nem véd</strong>, mivel a böngésző forráskódjának birtokában a lenyomat újraszámolható. Hivatalos jogi vagy hatósági bizonyító erőhöz szerveroldali, titkos kulccsal védett HMAC vagy aszimmetrikus digitális aláírás szükséges.
            </div>
          </section>

          {/* Section 5: Ismert korlátok és transzparencia */}
          <section className="space-y-2 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center gap-2 text-neutral-100 font-semibold text-xs uppercase tracking-wider font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <h4>5. Ismert Korlátok és Szakmai Transzparencia</h4>
            </div>
            <ul className="space-y-2 text-[11px] text-neutral-400">
              <li className="flex items-start gap-2">
                <span className="text-neutral-600 font-mono shrink-0">•</span>
                <span>
                  <strong className="text-neutral-200">Gyakorló célú környezet:</strong> 3 dokumentumban 9 beültetett hiba található. Ez kiválóan alkalmas az átvilágítási metodika és a kritikus gondolkodás elsajátítására, de korlátozott merítése miatt nem helyettesít egy komplex humán szakértői vizsgát.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neutral-600 font-mono shrink-0">•</span>
                <span>
                  <strong className="text-neutral-200">Kliensoldali működés:</strong> A szimuláció teljes egészében a böngészőben fut. Az éles vizsgáztatás szerveroldali rejtett validációt és autentikációt igényel.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neutral-600 font-mono shrink-0">•</span>
                <span>
                  <strong className="text-neutral-200">Didaktikai hibajelölések:</strong> A mintaesetekben a gyanús részek didaktikai okokból félkövérrel vannak kiemelve a kattintható kijelölés megkönnyítésére. Éles felmérésnél ezeket a kiemeléseket el kell rejteni.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neutral-600 font-mono shrink-0">•</span>
                <span>
                  <strong className="text-neutral-200">Heurisztikus kiértékelő mag:</strong> A pontozó motor token-, kulcsfogalom- és számtűrés-alapon működik. Bár a naiv kijátszási mintákat kizárja, a mély koncepcionális összefüggések végső validálásához humán mentor vagy modell alapú kiértékelés javasolt.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neutral-600 font-mono shrink-0">•</span>
                <span>
                  <strong className="text-neutral-200">Idézetek és háttéranyag:</strong> A kapcsolódó podcast-hivatkozások (Világgazdaság, 2024) tematikus összefoglalók, amelyek a kritikus gondolkodás és az AI-audit fontosságát világítják meg.
                </span>
              </li>
            </ul>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <span className="font-mono text-[11px] text-neutral-500">
            MOTOR: AUDIT-SCORING-V4 · RFC 8785 + SHA-256
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};
