import React from 'react';
import { X, BookOpen, Quote, Sparkles, CheckCircle2, Award } from 'lucide-react';
import {
  PODCAST_METADATA,
  PODCAST_QUOTES,
  PODCAST_PILLARS,
} from '../data/podcastKnowledge';

interface PodcastContextModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PodcastContextModal: React.FC<PodcastContextModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-neutral-300" />
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                A Tanulási Módszertan & Podcast Háttér
              </h3>
              <p className="text-[11px] text-neutral-400">
                {PODCAST_METADATA.show}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-xs text-neutral-300 leading-relaxed">
          {/* Main Thesis */}
          <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800">
            <h4 className="font-semibold text-neutral-200 text-xs mb-1.5 flex items-center gap-1.5">
              <span>Központi Kérdés: Mit ér a diploma, ha az AI már tudja a válaszokat?</span>
            </h4>
            <p className="text-neutral-400 text-xs leading-relaxed">
              {PODCAST_METADATA.coreThesis}
            </p>
            <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center gap-4 text-[11px] text-neutral-400">
              <span>Szakértők:</span>
              {PODCAST_METADATA.guests.map((g, i) => (
                <span key={i} className="text-neutral-300 font-medium">
                  {g.name} ({g.title})
                </span>
              ))}
            </div>
          </div>

          {/* Quotes Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider font-mono">
              Kiemelt Idézetek a Leiratból
            </h4>

            {PODCAST_QUOTES.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-2"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-neutral-200">
                    {item.speaker} <span className="text-neutral-400 font-normal">({item.role})</span>
                  </span>
                  <span className="font-mono text-neutral-400">
                    [{item.timestamp}]
                  </span>
                </div>
                <blockquote className="border-l border-neutral-700 pl-3 italic text-neutral-300 text-xs">
                  "{item.quote}"
                </blockquote>
                <p className="text-[11px] text-neutral-400 pt-1">
                  <span className="text-neutral-400 font-mono">Tanulság: </span>
                  {item.takeaway}
                </p>
              </div>
            ))}
          </div>

          {/* The 5 Pillars */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider font-mono">
              Az AI Alapműveltség 5 Pillére
            </h4>

            <div className="space-y-2.5">
              {PODCAST_PILLARS.map((pillar) => (
                <div
                  key={pillar.number}
                  className="p-3 rounded-lg bg-neutral-950/40 border border-neutral-800/80"
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-semibold text-neutral-200">
                      {pillar.number}. {pillar.title}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">
                      [{pillar.timeCode}]
                    </span>
                  </div>
                  <p className="text-neutral-400 text-[11px] mb-2">{pillar.summary}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pillar.keySkills.map((sk, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 flex justify-end bg-neutral-950">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-neutral-950 bg-neutral-100 hover:bg-white rounded transition-colors"
          >
            Értem, vissza az auditáláshoz
          </button>
        </div>
      </div>
    </div>
  );
};
