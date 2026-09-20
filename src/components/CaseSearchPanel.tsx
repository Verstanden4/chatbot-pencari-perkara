"use client";

import { useState } from "react";
import type { QuickSearch } from "@/lib/types";

export const JENIS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Semua Jenis Perkara" },
  { value: "Korupsi", label: "Korupsi / Tipikor" },
  { value: "Narkotika", label: "Narkotika" },
  { value: "Pencurian", label: "Pencurian" },
  { value: "Korporasi / TPPU", label: "Korporasi / TPPU" },
  { value: "Kesehatan / Malpraktik", label: "Kesehatan / Malpraktik" },
  { value: "Pidana Umum", label: "Pidana Umum (Lainnya)" },
];

const TAHUN_OPTIONS = ["", "2026", "2025", "2024", "2023"];

function fieldClass() {
  return "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30";
}

export default function CaseSearchPanel({
  onSearch,
  disabled,
}: {
  onSearch: (q: QuickSearch, summary: string) => void;
  disabled?: boolean;
}) {
  const [jenis, setJenis] = useState("");
  const [nomor, setNomor] = useState("");
  const [nama, setNama] = useState("");
  const [tahun, setTahun] = useState("");

  const reset = () => {
    setJenis("");
    setNomor("");
    setNama("");
    setTahun("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    const q: QuickSearch = {};
    if (jenis) q.jenis_perkara = jenis;
    if (nomor.trim()) q.nomor_perkara = nomor.trim();
    if (nama.trim()) q.nama_terdakwa = nama.trim();
    if (tahun) q.tahun = tahun;

    const parts = [
      jenis || null,
      nama.trim() ? `terdakwa ${nama.trim()}` : null,
      nomor.trim() ? `nomor ${nomor.trim()}` : null,
      tahun ? `tahun ${tahun}` : null,
    ].filter(Boolean) as string[];

    const summary =
      parts.length > 0
        ? `Cari perkara ${parts.join(", ")}`
        : "Cari daftar perkara kejaksaan terbaru";

    onSearch(q, summary);
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-navy-800 text-gold-400">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-navy-900">Form Pencarian Perkara</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">Jenis Perkara</label>
          <select className={fieldClass()} value={jenis} onChange={(e) => setJenis(e.target.value)}>
            {JENIS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">Nomor Perkara</label>
          <input
            className={fieldClass()}
            placeholder="cth. PDM-05/TPK/3/2025"
            value={nomor}
            onChange={(e) => setNomor(e.target.value)}
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">Nama Terdakwa / Korporasi</label>
          <input
            className={fieldClass()}
            placeholder="cth. Bambang Sutrisno"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">Tahun</label>
              <select className={fieldClass()} value={tahun} onChange={(e) => setTahun(e.target.value)}>
                {TAHUN_OPTIONS.map((t) => (
                  <option key={t || "all"} value={t}>
                    {t || "Semua Tahun"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={disabled}
                className="inline-flex h-[38px] items-center gap-1.5 rounded-lg bg-navy-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                Cari
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-slate-400">
          Hasil pencarian akan ditampilkan sebagai kartu perkara oleh AI asisten.
        </p>
        <button
          type="button"
          onClick={reset}
          className="text-[11px] font-medium text-slate-400 transition hover:text-navy-800"
        >
          Bersihkan form
        </button>
      </div>
    </form>
  );
}