"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaseResult, ChatMessage, ChatSession, QuickSearch } from "@/lib/types";

const STORAGE_KEY = "siperkara:sessions:v1";
// Kecepatan efek mengetik (ms per tick render)
const TYPE_TICK_MS = 18;

type Mode = "demo" | "langflow" | "connecting";

interface ChatStreamEvent {
  type: string;
  content?: string;
  perkara?: CaseResult;
  mode?: Mode;
}

type MessagePatch = Partial<ChatMessage> | ((prev: ChatMessage) => Partial<ChatMessage>);

function uid(): string {
  return crypto.randomUUID();
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function createSession(): ChatSession {
  return {
    id: uid(),
    title: "Percakapan baru",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<Mode>("connecting");
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mesin efek mengetik: teks masuk antre, dirender bertahap
  const pendingRef = useRef("");
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef = useRef<{ sessionId: string; msgId: string } | null>(null);
  const finalizeRef = useRef<{
    sessionId: string;
    msgId: string;
    finalContent: string;
    mode?: Mode;
  } | null>(null);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;
  const messages = activeSession?.messages ?? [];

  // Inisialisasi dari localStorage
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const loaded = loadSessions();
    if (loaded.length > 0) {
      setSessions(loaded);
      setActiveId(loaded[0].id);
    } else {
      const fresh = createSession();
      setSessions([fresh]);
      setActiveId(fresh.id);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  // Simpan riwayat ke localStorage (debounce)
  useEffect(() => {
    if (!activeId) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch {
        /* storage penuh / private mode */
      }
    }, 200);
  }, [sessions, activeId]);

  const updateSession = useCallback(
    (id: string, updater: (s: ChatSession) => ChatSession) => {
      setSessions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
    },
    []
  );

  const appendMessage = useCallback(
    (id: string, msg: ChatMessage) => {
      updateSession(id, (s) => ({
        ...s,
        title: s.title === "Percakapan baru" ? msg.content.slice(0, 48) : s.title,
        messages: [...s.messages, msg],
        updatedAt: Date.now(),
      }));
    },
    [updateSession]
  );

  const patchMessage = useCallback(
    (id: string, msgId: string, patch: MessagePatch) => {
      updateSession(id, (s) => ({
        ...s,
        updatedAt: Date.now(),
        messages: s.messages.map((m) =>
          m.id === msgId ? { ...m, ...(typeof patch === "function" ? patch(m) : patch) } : m
        ),
      }));
    },
    [updateSession]
  );

  // Render teks antrean sedikit demi sedikit (efek mengetik)
  const ensureTicker = useCallback(() => {
    if (tickerRef.current) return;
    tickerRef.current = setInterval(() => {
      const pending = pendingRef.current;
      const target = targetRef.current;

      if (pending.length > 0 && target) {
        const take = Math.max(2, Math.ceil(pending.length / 30));
        const chunk = pending.slice(0, take);
        pendingRef.current = pending.slice(take);
        patchMessage(target.sessionId, target.msgId, (prev) => ({
          content: (prev.content ?? "") + chunk,
        }));
        return;
      }

      const done = finalizeRef.current;
      if (done && pending.length === 0) {
        finalizeRef.current = null;
        if (tickerRef.current) {
          clearInterval(tickerRef.current);
          tickerRef.current = null;
        }
        patchMessage(done.sessionId, done.msgId, {
          content: done.finalContent,
          streaming: false,
        });
        if (done.mode) setMode(done.mode);
        setIsStreaming(false);
      }
    }, TYPE_TICK_MS);
  }, [patchMessage]);

  const switchSession = useCallback((id: string) => setActiveId(id), []);

  const newSession = useCallback(() => {
    const fresh = createSession();
    setSessions((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
  }, []);

  const clearAll = useCallback(() => {
    const fresh = createSession();
    setSessions([fresh]);
    setActiveId(fresh.id);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* abaikan */
    }
  }, []);

  const send = useCallback(
    async (text: string, quickSearch?: QuickSearch) => {
      if (isStreaming) return;
      const input = text;

      let sessionId = activeId;
      if (!sessionId) {
        const fresh = createSession();
        sessionId = fresh.id;
        setSessions((prev) => [fresh, ...prev]);
        setActiveId(fresh.id);
      }

      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: input,
        createdAt: Date.now(),
      };
      const aiMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        streaming: true,
      };

      appendMessage(sessionId, userMsg);
      appendMessage(sessionId, aiMsg);
      setIsStreaming(true);
      setMode("connecting");
      targetRef.current = { sessionId, msgId: aiMsg.id };
      pendingRef.current = "";

      const finalizeNow = (content: string, evMode?: Mode) => {
        finalizeRef.current = null;
        pendingRef.current = "";
        if (tickerRef.current) {
          clearInterval(tickerRef.current);
          tickerRef.current = null;
        }
        patchMessage(sessionId, aiMsg.id, { content, streaming: false });
        if (evMode) setMode(evMode);
        setIsStreaming(false);
      };

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [userMsg, aiMsg],
            sessionId,
            input,
            quickSearch,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(
            `Gagal menghubungi server (${res.status}). Pastikan Langflow berjalan.`
          );
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const line = chunk.trim();
            if (!line.startsWith("data:")) continue;
            const raw = line.slice(5).trim();
            if (!raw) continue;

            let ev: ChatStreamEvent;
            try {
              ev = JSON.parse(raw);
            } catch {
              continue;
            }

            if (ev.type === "token" && typeof ev.content === "string" && ev.content) {
              pendingRef.current += ev.content;
              ensureTicker();
            } else if (ev.type === "perkara" && ev.perkara) {
              patchMessage(sessionId, aiMsg.id, { perkaraResult: ev.perkara });
            } else if (ev.type === "done") {
              finalizeRef.current = {
                sessionId,
                msgId: aiMsg.id,
                finalContent: ev.content ?? "",
                mode: ev.mode,
              };
              ensureTicker();
            } else if (ev.type === "error") {
              finalizeNow(
                ev.content ??
                  "Terjadi kesalahan saat menghubungi AI. Coba lagi dalam beberapa saat.",
                "langflow"
              );
            }
          }
        }
      } catch (err) {
        const note =
          err instanceof Error && err.message
            ? err.message
            : "Koneksi terputus. Periksa server Langflow Anda.";
        finalizeNow(note, "langflow");
      }
    },
    [activeId, isStreaming, appendMessage, patchMessage, ensureTicker]
  );

  const sendText = useCallback((text: string) => send(text, undefined), [send]);

  const sendSearch = useCallback(
    (q: QuickSearch, summary: string) => send(summary, q),
    [send]
  );

  return {
    sessions,
    activeId,
    messages,
    isStreaming,
    mode,
    sendText,
    sendSearch,
    switchSession,
    newSession,
    clearAll,
  };
}