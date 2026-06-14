// Antigravity: Custom hook to manage the undo/redo history stack of HTML documents
import { useState, useRef, useCallback } from "react";
import { extractTitle } from "../lib/htmlSession.js";

const HISTORY_LIMIT = 40;

function makeHistoryEntry(html) {
  return { html, title: extractTitle(html), at: Date.now() };
}

export function useHistory(initialHtml) {
  const [history, setHistory] = useState([makeHistoryEntry(initialHtml)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyIndexRef = useRef(0);
  const lastHistoryRef = useRef(initialHtml);
  const historyTimerRef = useRef(null);

  const resetHistory = useCallback((html) => {
    window.clearTimeout(historyTimerRef.current);
    const entry = makeHistoryEntry(html);
    setHistory([entry]);
    setHistoryIndex(0);
    historyIndexRef.current = 0;
    lastHistoryRef.current = html;
  }, []);

  const pushHistory = useCallback((html, immediate = false) => {
    window.clearTimeout(historyTimerRef.current);
    const commit = () => {
      if (!html || html === lastHistoryRef.current) return;
      lastHistoryRef.current = html;
      setHistory((current) => {
        const nextBase = current.slice(0, historyIndexRef.current + 1);
        const next = [...nextBase, makeHistoryEntry(html)].slice(-HISTORY_LIMIT);
        const nextIndex = next.length - 1;
        historyIndexRef.current = nextIndex;
        setHistoryIndex(nextIndex);
        return next;
      });
    };

    if (immediate) commit();
    else historyTimerRef.current = window.setTimeout(commit, 700);
  }, []);

  const handleUndo = useCallback(() => {
    const nextIndex = Math.max(0, historyIndex - 1);
    const entry = history[nextIndex];
    if (!entry) return null;
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    lastHistoryRef.current = entry.html;
    return entry.html;
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    const nextIndex = Math.min(history.length - 1, historyIndex + 1);
    const entry = history[nextIndex];
    if (!entry) return null;
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    lastHistoryRef.current = entry.html;
    return entry.html;
  }, [history, historyIndex]);

  return {
    history,
    historyIndex,
    pushHistory,
    handleUndo,
    handleRedo,
    resetHistory,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}
