import React, { useState } from 'react';
import {
  Smartphone,
  X,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Download,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

export const AndroidAppModal: React.FC = () => {
  const { isAndroidModalOpen, setIsAndroidModalOpen, evaluation } = useAudit();
  const [activeTab, setActiveTab] = useState<'EMULATOR' | 'QR_CODE' | 'GUIDE'>('EMULATOR');
  const [copiedLink, setCopiedLink] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  if (!isAndroidModalOpen) return null;

  const SHARED_APP_URL = 'https://ais-pre-mioi2tcc4buagq7rguuaha-209349474032.europe-west2.run.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(SHARED_APP_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRefreshIframe = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-100 tracking-tight">
                  PROMPT & PIVOT Android Mobil App
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Élő Emulátor
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Natív Android Audit Munkamenet & Kétirányú Vercel / Web Interfész
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAndroidModalOpen(false)}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors focus:outline-none min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Bezárás"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center gap-1 p-2 bg-neutral-950/80 border-b border-neutral-800 text-xs px-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('EMULATOR')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all shrink-0 ${
              activeTab === 'EMULATOR'
                ? 'bg-neutral-800 text-white font-semibold border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Élő Mobil Emulátor</span>
          </button>

          <button
            onClick={() => setActiveTab('QR_CODE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all shrink-0 ${
              activeTab === 'QR_CODE'
                ? 'bg-neutral-800 text-white font-semibold border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <QrCode className="w-4 h-4 text-sky-400" />
            <span>Telefonos QR Kód & APK</span>
          </button>

          <button
            onClick={() => setActiveTab('GUIDE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all shrink-0 ${
              activeTab === 'GUIDE'
                ? 'bg-neutral-800 text-white font-semibold border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Kétirányú Integráció</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'EMULATOR' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-neutral-300">
                    Interaktív Android streaming emulátor. Futtasd a natív mobil felületet közvetlenül a böngésződben!
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleRefreshIframe}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors"
                    title="Emulátor újratöltése"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Újratöltés</span>
                  </button>

                  <a
                    href={SHARED_APP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors font-medium"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Megnyitás Új Ablakban</span>
                  </a>
                </div>
              </div>

              {/* Device Frame Wrapper */}
              <div className="flex justify-center py-2">
                <div className="relative w-full max-w-[380px] h-[620px] bg-neutral-950 rounded-[40px] p-3 border-4 border-neutral-800 shadow-2xl flex flex-col">
                  {/* Speaker Notch */}
                  <div className="w-24 h-4 bg-neutral-900 rounded-b-xl mx-auto mb-2 flex items-center justify-center shrink-0">
                    <div className="w-8 h-1 bg-neutral-700 rounded-full" />
                  </div>

                  {/* Embedded Live Emulator iframe */}
                  <iframe
                    key={iframeKey}
                    src={SHARED_APP_URL}
                    title="PROMPT & PIVOT Android Live Emulator"
                    className="w-full flex-1 rounded-[28px] border-none bg-neutral-900"
                    allow="autoplay; fullscreen"
                  />

                  {/* Bottom Navigation Home Bar */}
                  <div className="w-28 h-1 bg-neutral-700 rounded-full mx-auto mt-2 shrink-0" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'QR_CODE' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* QR Code Card */}
                <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 text-center space-y-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Saját Telefonos Gyorselérés
                  </span>

                  <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto">
                    {/* SVG QR Code representation of the URL */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        SHARED_APP_URL
                      )}&color=0a0a0a&bgcolor=ffffff`}
                      alt="Android App QR Code"
                      className="w-44 h-44 mx-auto"
                      loading="lazy"
                    />
                  </div>

                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    Olvasd be a kameráddal tetszőleges Android vagy iOS telefonról a mobil munkaállomás azonnali megnyitásához!
                  </p>

                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-200 transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Link másolva a vágólapra!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-sky-400" />
                        <span>Hivatkozási URL Másolása</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Mobile Installation & APK Info */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Telepítési opciók Androidra</span>
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Az alkalmazás PWA (Progressive Web App) és natív Android emulátorként egyaránt futtatható. A Google Play Store / APK exportálás közvetlenül az AI Studio beállításaiból is indítható.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-200">Nyisd meg a kamerát</div>
                        <div className="text-neutral-400 text-[11px]">Inkább a böngészőből nyitnád meg? Beolvasás után egyből elindul.</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-200">Hozzáadás a Kezdőképernyőhöz (PWA)</div>
                        <div className="text-neutral-400 text-[11px]">A Chrome menüben válaszd az "Alkalmazás telepítése" opciót a natív ikonért.</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-200">Kétirányú SHA-256 Szinkronizáció</div>
                        <div className="text-neutral-400 text-[11px]">Minden mobilon elvégzett audit verifikációs lenyomata a Vercel rendszerben is hitelesíthető.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'GUIDE' && (
            <div className="space-y-4 text-xs text-neutral-300">
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Kétirányú Web & Mobil Integrációs Architektúra</span>
                </h3>
                <p className="text-neutral-400 leading-relaxed text-[12px]">
                  A Vercel-en futó **PROMPT & PIVOT AI Due Diligence Workbench** és a natív Android alkalmazás közös RFC 8785 kanonikus JSON specifikációt és SHA-256 kriptográfiai ellenőrző összeget használ.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>1. Mobilról a Webes Laborba</span>
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Az Android appban generált audit riportok "Megnyitás a Webes Audit Laborban" gombja közvetlenül a Vercel-es felületre továbbítja a vizsgázót a részletes grafikongyűjteményért.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>2. Webes Felületről a Mobilra</span>
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    A Vercel-es munkaállomásról egy kattintással elindítható a natív Android emulátor, tesztelve a mobil érintőképernyős kijelölési és auditálási élményt.
                  </p>
                </div>
              </div>

              {evaluation && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="font-semibold text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Jelenlegi Aktív Audit SHA-256 Lenyomata:</span>
                  </div>
                  <div className="font-mono text-[11px] text-emerald-400 break-all bg-neutral-950 p-2.5 rounded border border-neutral-800">
                    {evaluation.canonicalHash}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <a
            href={SHARED_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <span>Közvetlen Megosztott Hivatkozás</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setIsAndroidModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors min-h-[38px]"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};
