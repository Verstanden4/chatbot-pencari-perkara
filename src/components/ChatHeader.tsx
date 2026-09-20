import Brand from "@/components/Brand";

export interface ModeState {
  mode: "demo" | "langflow" | "connecting";
}

export default function ChatHeader({
  mode,
  onNewChat,
}: {
  mode: ModeState["mode"];
  onNewChat: () => void;
}) {
  const status =
    mode === "langflow"
      ? { label: "Terhubung ke Langflow", dot: "bg-emerald-400", text: "text-emerald-300" }
      : mode === "connecting"
        ? { label: "Menghubungkan...", dot: "bg-amber-400 animate-pulse", text: "text-amber-300" }
        : { label: "Mode Demo (tanpa Langflow)", dot: "bg-gold-400", text: "text-gold-300" };

  return (
    <header className="sticky top-0 z-20 border-b border-navy-700/60 bg-navy-900/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4">
        <Brand small />

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-navy-800 px-3 py-1 text-[11px] font-medium ring-1 ring-navy-700 ${status.text}`}
          >
            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <button
            onClick={onNewChat}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy-700 bg-navy-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-gold-500/50 hover:text-gold-300"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M10 4v12M4 10h12" />
            </svg>
            Sesi Baru
          </button>
        </div>
      </div>
    </header>
  );
}