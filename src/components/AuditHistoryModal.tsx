import React from 'react';
import { X, History, ShieldCheck, Award, Trash2, Calendar, Clock, Lock, CheckCircle } from 'lucide-react';
import { useAudit } from '../context/AuditContext';

export const AuditHistoryModal: React.FC = () => {
  const {
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    pastAuditHistory,
    clearPastHistory,
    userProfile,
    updateUserProfile,
  } = useAudit();

  if (!isHistoryModalOpen) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins} p ${s} mp`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 id="history-modal-title" className="text-base font-bold text-neutral-100">
                Audit Előzmények & SHA-256 Tanúsítványok
              </h2>
              <p className="text-xs text-neutral-400">
                A helyi böngészőben tárolt, kanonikus SHA-256 lenyomattal hitelesített korábbi auditok logja.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsHistoryModalOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Bezárás"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* User Profile Bar */}
          <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                Bejelentkezett Auditor Profilja
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={(e) => updateUserProfile({ name: e.target.value })}
                  className="bg-neutral-900 border border-neutral-700 text-sm font-semibold text-neutral-100 px-2.5 py-1 rounded focus:outline-none focus:border-emerald-500 max-w-[200px]"
                  placeholder="Név"
                />
                <select
                  value={userProfile.role}
                  onChange={(e) => updateUserProfile({ role: e.target.value as any })}
                  className="bg-neutral-900 border border-neutral-700 text-xs font-medium text-neutral-300 px-2.5 py-1 rounded focus:outline-none focus:border-emerald-500"
                >
                  <option value="Junior Analyst">Junior Analyst</option>
                  <option value="Associate Auditor">Associate Auditor</option>
                  <option value="Senior M&A Auditor">Senior M&A Auditor</option>
                  <option value="VC Partner">VC Partner</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-neutral-400 border-t sm:border-t-0 sm:border-l border-neutral-800 pt-2 sm:pt-0 sm:pl-4">
              <span className="text-neutral-500 block text-[10px]">Hitelesített audit rekordok:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                {pastAuditHistory.length} db tanúsítvány
              </span>
            </div>
          </div>

          {/* Past History List */}
          {pastAuditHistory.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-neutral-800 rounded-lg">
              <ShieldCheck className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-neutral-300">Nincs még elmentett audit rekord.</p>
              <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                Végezz el egy átvilágítást a Munkalapon, nyomd meg az „Audit Lezárása” gombot, és az eredmény automatikusan bekerül a SHA-256 által hitelesített helyi előzményekbe.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastAuditHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 p-4 rounded-lg transition-all space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <Award
                        className={`w-4 h-4 ${
                          item.grade === 'SENIOR'
                            ? 'text-emerald-400'
                            : item.grade === 'ASSOCIATE'
                            ? 'text-amber-400'
                            : 'text-neutral-400'
                        }`}
                      />
                      <span className="font-semibold text-sm text-neutral-200">{item.scenarioTitle}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold font-mono ${
                          item.auditMode === 'STRICT'
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {item.auditMode === 'STRICT' ? 'Vak Munkalap' : 'Irányított'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-neutral-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.completedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-neutral-500 text-[10px] block">Elért pontszám</span>
                      <span className="font-bold text-neutral-100 font-mono">
                        {item.totalScore} / {item.maxScore} pont
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-500 text-[10px] block">Minősítés</span>
                      <span
                        className={`font-semibold ${
                          item.grade === 'SENIOR'
                            ? 'text-emerald-400'
                            : item.grade === 'ASSOCIATE'
                            ? 'text-amber-400'
                            : 'text-neutral-300'
                        }`}
                      >
                        {item.grade === 'SENIOR'
                          ? 'Senior Auditor'
                          : item.grade === 'ASSOCIATE'
                          ? 'Associate'
                          : 'Junior'}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-500 text-[10px] block">Eltelt idő</span>
                      <span className="text-neutral-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {formatSeconds(item.elapsedSeconds)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-500 text-[10px] block">Téves riasztás</span>
                      <span className="text-neutral-300">{item.falsePositivesCount} db (-{item.falsePositivesCount * 20} pont)</span>
                    </div>
                  </div>

                  {/* Cryptographic SHA-256 Digest Badge */}
                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-900 text-[11px] font-mono text-neutral-400">
                    <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">SHA-256: {item.sha256Hash}</span>
                    <span className="ml-auto text-[10px] text-emerald-400 flex items-center gap-1 shrink-0 font-sans font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Hitelesítve
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          {pastAuditHistory.length > 0 ? (
            <button
              onClick={clearPastHistory}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors px-2 py-1 rounded hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Előzmények törlése</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={() => setIsHistoryModalOpen(false)}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-white rounded transition-colors"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};
