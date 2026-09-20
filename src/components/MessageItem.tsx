"use client";

import type { ReactNode } from "react";
import type { ChatMessage } from "@/lib/types";
import CaseResultCard from "@/components/CaseResultCard";

function renderRich(text: string): ReactNode[] {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let list: ReactNode[] = [];

  const flushList = (key: string) => {
    if (list.length > 0) {
      nodes.push(
        <ul key={key} className="my-1.5 space-y-1">
          {list.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-gold-600">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  const pushLine = (line: string, key: string) => {
    const bold = line.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-navy-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });

    const trimmed = line.trim();
    const numbered = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numbered) {
      nodes.push(
        <p key={key} className="my-1 flex gap-2">
          <span className="shrink-0 font-semibold text-gold-600">{numbered[1]}.</span>
          <span>{renderInline(numbered[2])}</span>
        </p>
      );
    } else {
      nodes.push(
        <p key={key} className="my-1">
          {bold}
        </p>
      );
    }
  };

  const renderInline = (text: string): ReactNode =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold text-navy-900">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );

  for (const line of lines) {
    const isBullet = /^[-•]\s+/.test(line.trim());
    if (isBullet) {
      list.push(renderInline(line.trim().replace(/^[-•]\s+/, "")));
    } else {
      flushList(`ul-${nodes.length}`);
      pushLine(line, `p-${nodes.length}`);
    }
  }
  flushList(`ul-end-${nodes.length}`);
  return nodes;
}

export default function MessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="msg-in flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-navy-800 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm md:max-w-[70%]">
          {message.content || (
            <span className="text-navy-300">[Pencarian perkara via formulir]</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="msg-in flex justify-start gap-2.5">
      <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-500/20 text-gold-600 ring-1 ring-gold-500/40">
        <svg
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v18" />
          <path d="M12 5.5c2.8 0 5 2.7 5 6 0 .9-.061 1.4-.2 2H7.2c-.139-.6-.2-1.1-.2-2 0-3.3 2.2-6 5-6z" />
          <path d="M7 13.5h10" />
          <path d="M6 15.5l1.8 5h8.4L18 15.5" />
        </svg>
      </div>

      <div className="max-w-[85%] space-y-2.5 md:max-w-[75%]">
        <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
          <div className={message.streaming && !message.content ? "" : ""}>
            {message.content ? (
              <div className="space-y-1">{renderRich(message.content)}</div>
            ) : (
              <span className="streaming-caret" />
            )}
          </div>
        </div>

        {message.perkaraResult && message.perkaraResult.perkaraList.length > 0 && (
          <div className="space-y-2.5">
            {message.perkaraResult.perkaraList.map((p) => (
              <CaseResultCard key={p.nomor_perkara} perkara={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}