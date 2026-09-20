import type { Perkara, PerkaraStatus } from "@/lib/types";
import { PERKARA_STATUS } from "@/lib/types";

const STATUS_STYLE: Record<PerkaraStatus, string> = {
  P21: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "Tahap Penyidikan": "bg-sky-100 text-sky-700 ring-sky-200",
  "Tahap Penuntutan": "bg-violet-100 text-violet-700 ring-violet-200",
  "Pemeriksaan Sidang": "bg-amber-100 text-amber-700 ring-amber-200",
  Eksekusi: "bg-rose-100 text-rose-700 ring-rose-200",
  SP3: "bg-slate-200 text-slate-600 ring-slate-300",
};

function StatusBadge({ status }: { status: PerkaraStatus }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE["Tahap Penyidikan"];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${style}`}
    >
      {status}
      <span className="mt-0.5 ml-1 text-[9px] font-normal opacity-70">({PERKARA_STATUS[status]})</span>
    </span>
  );
}

export default function CaseResultCard({ perkara }: { perkara: Perkara }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-semibold text-navy-800">
            {perkara.nomor_perkara}
          </p>
          <p className="truncate text-sm font-semibold text-slate-800">
            {perkara.nama_terdakwa}
          </p>
        </div>
        <StatusBadge status={perkara.status} />
      </div>

      <div className="space-y-2 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="rounded bg-navy-800 px-2 py-0.5 text-[11px] font-medium text-gold-400">
            {perkara.jenis_perkara}
          </span>
          <span className="text-xs text-slate-400">{perkara.link_detail ? "•" : ""}</span>
        </div>
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-600">Pasal:</span> {perkara.pasal}
        </p>
        {perkara.ringkasan && <p className="text-xs leading-relaxed text-slate-600">{perkara.ringkasan}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-dashed border-slate-200 pt-2 text-[11px] text-slate-400">
          <span>📅 {perkara.tanggal}</span>
          <span>🏛 {perkara.pihak}</span>
        </div>
      </div>
    </div>
  );
}