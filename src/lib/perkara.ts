// Parser jawaban AI menjadi data perkara terstruktur.
// Flow Langflow (mode asli) diharapkan menyisipkan blok JSON:
//
//   ###DATA###
//   {"quickSearch": {...}, "perkaraList": [...], "total": 3}
//   ###END###
//
// Jika blok tidak ketemu, dipakai data yang dikirim via event terpisah.

import type { CaseResult, Perkara } from "@/lib/types";

const DATA_RE = /###DATA###\s*(\{[\s\S]*?\})\s*###END###/;

export function extractPerkaraBlock(text: string): CaseResult | null {
  const match = text.match(DATA_RE);
  if (!match) return null;
  try {
    const raw = JSON.parse(match[1]);
    const perkaraList = Array.isArray(raw.perkaraList)
      ? raw.perkaraList.map(normalizePerkara)
      : [];
    return {
      quickSearch: raw.quickSearch ?? {},
      perkaraList,
      total: typeof raw.total === "number" ? raw.total : perkaraList.length,
    };
  } catch {
    return null;
  }
}

export function parsePerkaraResult(
  text: string,
  fallbackPerkara?: Perkara[]
): CaseResult | undefined {
  const fromText = extractPerkaraBlock(text);
  if (fromText && fromText.perkaraList.length > 0) return fromText;

  if (fallbackPerkara && fallbackPerkara.length > 0) {
    return {
      quickSearch: {},
      perkaraList: fallbackPerkara.map(normalizePerkara),
      total: fallbackPerkara.length,
    };
  }
  return undefined;
}

function normalizePerkara(p: Partial<Perkara>): Perkara {
  return {
    nomor_perkara: String(p.nomor_perkara ?? "-"),
    nama_terdakwa: String(p.nama_terdakwa ?? "-"),
    pasal: String(p.pasal ?? "-"),
    jenis_perkara: String(p.jenis_perkara ?? "-"),
    status: (p.status as Perkara["status"]) ?? "Tahap Penyidikan",
    tanggal: String(p.tanggal ?? "-"),
    pihak: String(p.pihak ?? "-"),
    ringkasan: String(p.ringkasan ?? ""),
    link_detail: p.link_detail,
  };
}

export function stripPerkaraBlock(text: string): string {
  return text.replace(DATA_RE, "").replace(/\n{3,}/g, "\n\n").trim();
}