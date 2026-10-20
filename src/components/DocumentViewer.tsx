import React, { useState, useRef, useEffect } from 'react';
import { Tag, AlertTriangle, HelpCircle, FileText, Sparkles } from 'lucide-react';
import type { Scenario, UserAnnotation, ErrorType } from '../types/audit';
import { ERROR_TYPE_LABELS } from '../types/audit';

interface DocumentViewerProps {
  scenario: Scenario;
  annotations: UserAnnotation[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string | null) => void;
  onAddAnnotation: (targetPhrase: string, type: ErrorType) => void;
}

interface SelectionBubbleState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  scenario,
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
  onAddAnnotation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bubble, setBubble] = useState<SelectionBubbleState>({
    visible: false,
    text: '',
    x: 0,
    y: 0,
  });

  // Listen to text selection inside the document container
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // If clicking inside the selection bubble, do not dismiss!
      const bubbleEl = document.getElementById('selection-bubble');
      if (bubbleEl && (bubbleEl.contains(e.target as Node) || bubbleEl === e.target)) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setBubble((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const selectedText = selection.toString().trim();
      if (selectedText.length < 3) {
        setBubble((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Check if selection is within our container
      if (!containerRef.current || !containerRef.current.contains(selection.anchorNode)) {
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        // Calculate relative position to container
        const relativeX = rect.left - containerRect.left + rect.width / 2;
        const relativeY = rect.top - containerRect.top - 10;

        setBubble({
          visible: true,
          text: selectedText,
          x: relativeX,
          y: relativeY,
        });
      } catch {
        // Fallback if range fails
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const bubbleEl = document.getElementById('selection-bubble');
      if (bubbleEl && (bubbleEl.contains(e.target as Node) || bubbleEl === e.target)) {
        return;
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const handleSelectType = (type: ErrorType) => {
    if (!bubble.text) return;
    onAddAnnotation(bubble.text, type);
    setBubble({ visible: false, text: '', x: 0, y: 0 });
    window.getSelection()?.removeAllRanges();
  };

  /**
   * Helper that parses markdown and renders inline annotations.
   */
  const renderDocumentWithHighlights = () => {
    const raw = scenario.document_markdown;
    const paragraphs = raw.split('\n\n');

    return paragraphs.map((para, pIdx) => {
      const isHeading = para.startsWith('### ');
      const cleanPara = isHeading ? para.replace(/^###\s*/, '') : para;

      if (isHeading) {
        return (
          <h2
            key={pIdx}
            className="text-lg font-semibold text-neutral-100 tracking-tight mb-4 pb-2 border-b border-neutral-800"
          >
            {cleanPara}
          </h2>
        );
      }

      // Extract bold phrases for styling and click-to-mark without leaving stray asterisks
      const boldMatches = Array.from(cleanPara.matchAll(/\*\*(.*?)\*\*/g)).map((m) => m[1]);
      const normalizedPara = cleanPara.replace(/\*\*(.*?)\*\*/g, '$1');

      // Find all matches for annotations in this paragraph
      type SpanPart = {
        text: string;
        annotation?: UserAnnotation;
      };

      let parts: SpanPart[] = [{ text: normalizedPara }];

      annotations.forEach((ann) => {
        const nextParts: SpanPart[] = [];
        parts.forEach((part) => {
          if (part.annotation) {
            nextParts.push(part);
            return;
          }

          const target = ann.target_phrase;
          const idx = part.text.toLowerCase().indexOf(target.toLowerCase());

          if (idx !== -1) {
            const before = part.text.substring(0, idx);
            const matched = part.text.substring(idx, idx + target.length);
            const after = part.text.substring(idx + target.length);

            if (before) nextParts.push({ text: before });
            nextParts.push({ text: matched, annotation: ann });
            if (after) nextParts.push({ text: after });
          } else {
            nextParts.push(part);
          }
        });
        parts = nextParts;
      });

      return (
        <p key={pIdx} className="text-neutral-300 leading-relaxed text-[15px] mb-5 selection:bg-neutral-700">
          {parts.map((part, partIdx) => {
            if (!part.annotation) {
              // Check if this text segment contains any of the original bold phrases
              let subSegments: Array<{ text: string; isBold: boolean }> = [{ text: part.text, isBold: false }];

              boldMatches.forEach((boldText) => {
                const nextSubs: Array<{ text: string; isBold: boolean }> = [];
                subSegments.forEach((seg) => {
                  if (seg.isBold) {
                    nextSubs.push(seg);
                    return;
                  }
                  const bIdx = seg.text.indexOf(boldText);
                  if (bIdx !== -1) {
                    const before = seg.text.substring(0, bIdx);
                    const matched = seg.text.substring(bIdx, bIdx + boldText.length);
                    const after = seg.text.substring(bIdx + boldText.length);
                    if (before) nextSubs.push({ text: before, isBold: false });
                    nextSubs.push({ text: matched, isBold: true });
                    if (after) nextSubs.push({ text: after, isBold: false });
                  } else {
                    nextSubs.push(seg);
                  }
                });
                subSegments = nextSubs;
              });

              return subSegments.map((sub, sIdx) => {
                if (sub.isBold) {
                  return (
                    <strong
                      key={sIdx}
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
                        setBubble({
                          visible: true,
                          text: sub.text,
                          x: rect.left - containerRect.left + rect.width / 2,
                          y: rect.top - containerRect.top - 10,
                        });
                      }}
                      className="text-neutral-100 font-semibold cursor-pointer hover:bg-neutral-800/80 px-0.5 rounded transition-colors"
                      title="Kattints a megjelöléshez vagy jelöld ki az egérrel"
                    >
                      {sub.text}
                    </strong>
                  );
                }
                return <span key={sIdx}>{sub.text}</span>;
              });
            }

            const ann = part.annotation;
            const meta = ERROR_TYPE_LABELS[ann.selectedType];
            const isSelected = selectedAnnotationId === ann.id;

            return (
              <span
                key={partIdx}
                onClick={() => onSelectAnnotation(ann.id)}
                className={`relative inline-block px-1 py-0.5 rounded cursor-pointer transition-all border-b-2 ${
                  meta.border
                } ${meta.bg} ${
                  isSelected ? 'ring-2 ring-white/30 font-semibold text-white' : 'hover:bg-opacity-20 text-neutral-100'
                }`}
                title={`Kattints az indoklás szerkesztéséhez (${meta.label})`}
              >
                <span className="font-medium underline decoration-dotted decoration-neutral-500 underline-offset-4">
                  {part.text}
                </span>
                <span
                  className={`ml-1.5 inline-block text-[10px] uppercase font-mono px-1 py-0.2 rounded border ${meta.border} ${meta.color}`}
                >
                  {meta.shortLabel}
                </span>
              </span>
            );
          })}
        </p>
      );
    });
  };

  return (
    <div className="relative flex-1 bg-neutral-900 flex flex-col h-full overflow-hidden">
      {/* Pane Subheader */}
      <div className="px-6 py-2.5 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between text-xs text-neutral-400 select-none">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-medium text-neutral-200">AI Szintetikus Dokumentum</span>
          <span className="text-neutral-500">·</span>
          <span>Kijelölés alapú hibadetektálás (Redlining)</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-neutral-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Adathiba
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Ellentmondás
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Fiktív forrás
          </span>
        </div>
      </div>

      {/* Document Content Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-8 md:px-10 lg:px-12 max-w-3xl w-full mx-auto relative select-text"
      >
        {/* Floating Context Bubble on Text Selection */}
        {bubble.visible && (
          <div
            id="selection-bubble"
            style={{
              left: `${Math.max(120, Math.min(bubble.x, 500))}px`,
              top: `${Math.max(10, bubble.y - 45)}px`,
              transform: 'translateX(-50%)',
            }}
            className="absolute z-40 flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-700 rounded-lg shadow-2xl text-xs backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          >
            <span className="text-[10px] font-mono text-neutral-400 px-2 py-1 select-none border-r border-neutral-800">
              Hiba típusa:
            </span>

            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => handleSelectType('NUMERIC_MISMATCH')}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors font-medium"
              title="Számítási hiba, rossz árrés vagy szorzó"
            >
              <Tag className="w-3 h-3 text-rose-400" />
              <span>Adathiba</span>
            </button>

            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => handleSelectType('LOGICAL_CONTRADICTION')}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 transition-colors font-medium"
              title="A szöveg belső logikai ellentmondása"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Ellentmondás</span>
            </button>

            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => handleSelectType('FABRICATED_SOURCE')}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200 transition-colors font-medium"
              title="Hallucinált vagy nem létező benchmarking hivatkozás"
            >
              <HelpCircle className="w-3 h-3 text-indigo-400" />
              <span>Fiktív forrás</span>
            </button>
          </div>
        )}

        {/* Informational Callout: Instructions */}
        <div className="mb-6 p-3 rounded bg-neutral-950/60 border border-neutral-800/80 text-xs text-neutral-300 flex items-start gap-2.5">
          <div className="w-4 h-4 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 text-amber-400 font-mono text-[10px]">
            i
          </div>
          <div className="leading-relaxed">
            <span className="font-semibold text-neutral-200">Auditori Feladat: </span>
            Jelöld ki az egérrel a szövegben a gyanús állításokat, számítási hibákat vagy hallucinációkat!
            A felugró buborékban válaszd ki a hiba kategóriáját, majd a jobb oldali panelen rögzítsd az indoklást.
            <span className="text-neutral-400 block mt-1 font-mono text-[11px]">
              Vigyázz: A valós állítások téves bejelölése (False Positive) -20 pont levonással jár!
            </span>
          </div>
        </div>

        {/* The rendered document */}
        <div className="document-body">{renderDocumentWithHighlights()}</div>

        {/* Grounding benchmark hints */}
        <div className="mt-12 pt-6 border-t border-neutral-800/80 text-xs text-neutral-400">
          <span className="font-semibold text-neutral-300 block mb-2">
            Referencia-adatok a validációhoz:
          </span>
          <ul className="space-y-1 font-mono text-[12px] text-neutral-400">
            {scenario.benchmark_notes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-neutral-600">·</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
