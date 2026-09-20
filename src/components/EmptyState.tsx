"use client";

const SUGGESTIONS = [
  "Cari perkara korupsi tahun 2025",
  "Perkara narkotika di Bandung",
  "PDM-05/TPK/3/2025",
  "Perkara malpraktik tahun 2025",
  "Daftar perkara yang sedang berjalan",
  "Apa itu berkas P21?",
];

export default function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-navy-800 text-gold-400 shadow-lg shadow-navy-900/10 ring-1 ring-gold-500/30">
        <svg
          viewBox="0 0 24 24"
          className="h-9 w-9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v18" />
          <path d="M12 5.5c2.8 0 5 2.7 5 6 0 .9-.061 1.4-.2 2H7.2c-.139-.6-.2-1.1-.2-2 0-3.3 2.2-6 5-6z" />
          <path d="M7 13.5h10" />
          <path d="M6 15.5l1.8 5h8.4L18 15.5" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-navy-900">
        Halo, Selamat Datang di <span className="text-gold-600">SI PERKARA</span>
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        Asisten AI untuk menemukan informasi perkara pada Kejaksaan. Gunakan{" "}
        <span className="font-medium text-slate-700">Form Pencarian Perkara</span> di atas atau
        tanyakan langsung lewat chat.
      </p>

      <div className="mt-6 flex w-full max-w-xl flex-wrap items-center justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-gold-500 hover:text-gold-600"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}