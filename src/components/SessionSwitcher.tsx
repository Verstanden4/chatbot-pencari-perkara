"use client";

import type { ChatSession } from "@/lib/types";

function timeLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function SessionSwitcher({
  sessions,
  activeId,
  onSelect,
  onNew,
  onClear,
}: {
  sessions: ChatSession[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClear: () => void;
}) {
  if (sessions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sessions.slice(0, 8).map((s) => {
        const active = s.id === activeId;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`group inline-flex max-w-[220px] items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition ${
              active
                ? "border-gold-500 bg-navy-800 text-gold-300"
                : "border-slate-300 bg-white text-slate-500 hover:border-gold-500/60 hover:text-navy-800"
            }`}
            title={s.title}
          >
            <svg
              viewBox="0 0 20 20"
              className="h-3 w-3 shrink-0 opacity-60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M17 3H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Z" />
              <path d="M3 7h14" />
            </svg>
            <span className="truncate">{s.title}</span>
            <span className="ml-0.5 shrink-0 text-[10px] opacity-60">{timeLabel(s.updatedAt)}</span>
          </button>
        );
      })}
      <div className="flex gap-1">
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-400 px-3 py-1 text-[11px] font-medium text-slate-500 transition hover:border-gold-500 hover:text-gold-600"
        >
          + Baru
        </button>
        {sessions.length > 1 && (
          <button
            onClick={onClear}
            className="rounded-full px-2 py-1 text-[11px] text-slate-400 transition hover:text-rose-600"
            title="Hapus semua riwayat"
          >
            Hapus
          </button>
        )}
      </div>
    </div>
  );
}