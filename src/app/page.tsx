"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/useChat";
import ChatHeader from "@/components/ChatHeader";
import CaseSearchPanel from "@/components/CaseSearchPanel";
import MessageItem from "@/components/MessageItem";
import SessionSwitcher from "@/components/SessionSwitcher";
import EmptyState from "@/components/EmptyState";
import ChatInput from "@/components/ChatInput";

export default function Home() {
  const chat = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(true);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.messages, chat.isStreaming]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100">
      <ChatHeader mode={chat.mode} onNewChat={chat.newSession} />

      <main className="thin-scroll flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4">
          {/* Riwayat sesi */}
          <SessionSwitcher
            sessions={chat.sessions}
            activeId={chat.activeId}
            onSelect={chat.switchSession}
            onNew={chat.newSession}
            onClear={chat.clearAll}
          />

          {/* Kotak pencarian perkara */}
          <div className={searchOpen ? "" : "hidden"}>
            <CaseSearchPanel onSearch={chat.sendSearch} disabled={chat.isStreaming} />
          </div>
          <div className="-mt-2 flex justify-end">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 transition hover:text-navy-800"
            >
              {searchOpen ? "Sembunyikan form" : "Tampilkan form pencarian"}
              <svg
                viewBox="0 0 16 16"
                className={`h-3 w-3 transition-transform ${searchOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="m4 6 4 4 4-4" />
              </svg>
            </button>
          </div>

          {/* Pesan */}
          {chat.messages.length === 0 ? (
            <EmptyState onPick={chat.sendText} />
          ) : (
            <div className="flex flex-col gap-4 pb-2">
              {chat.messages.map((m) => (
                <MessageItem key={m.id} message={m} />
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      <div className="border-t border-slate-200 bg-slate-50/90 backdrop-blur">
        <ChatInput onSend={chat.sendText} disabled={chat.isStreaming} />
      </div>
    </div>
  );
}