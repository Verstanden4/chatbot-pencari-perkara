"use client";

import { useRef, useState } from "react";

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (taRef.current) taRef.current.style.height = "auto";
  };

  const resize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-4">
      <div className="rounded-2xl border border-slate-300 bg-white p-2 shadow-lg shadow-slate-200/60 transition focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-500/25">
        <div className="flex items-end gap-2">
          <textarea
            ref={taRef}
            rows={1}
            value={value}
            disabled={disabled}
            placeholder={disabled ? "AI sedang mengetik jawaban..." : "Tanyakan perkara, mis. \"cari perkara korupsi tahun 2025\"..."}
            onChange={(e) => {
              setValue(e.target.value);
              resize();
            }}
            onKeyDown={onKeyDown}
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-800 text-gold-400 shadow-sm transition enabled:hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Kirim pesan"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22l-4-9-9-4Z" />
            </svg>
          </button>
        </div>
        <p className="px-3 pb-0.5 pt-1 text-[10px] text-slate-400">
          Tekan <kbd className="rounded bg-slate-100 px-1 font-sans">Enter</kbd> untuk kirim ·{" "}
          <kbd className="rounded bg-slate-100 px-1 font-sans">Shift+Enter</kbd> untuk baris baru · Dipersonalisasi oleh
          Langflow
        </p>
      </div>
    </div>
  );
}