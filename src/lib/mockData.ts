// Data contoh perkara kejaksaan untuk mode demo.
// Saat flow Langflow dihubungkan, data ini tidak lagi dipakai.

import type { Perkara, QuickSearch } from "@/lib/types";

export const SAMPLE_PERKARA: Perkara[] = [
  {
    nomor_perkara: "PDM-05/TPK/3/2025",
    nama_terdakwa: "H. Bambang Sutrisno, S.E.",
    pasal: "Pasal 2 & Pasal 3 UU No. 31/1999 jo. UU No. 20/2001",
    jenis_perkara: "Korupsi",
    status: "Pemeriksaan Sidang",
    tanggal: "2025-03-14",
    pihak: "Kejaksaan Negeri Jakarta Selatan",
    ringkasan:
      "Terdakwa diduga merugikan keuangan negara sebesar Rp 4,8 miliar pada proyek pengadaan alat kesehatan di Dinas Kesehatan.",
  },
  {
    nomor_perkara: "PDM-112/Pid.Sus/1/2025",
    nama_terdakwa: "Surya Pratama",
    pasal: "Pasal 112 & Pasal 114 UU No. 35/2009",
    jenis_perkara: "Narkotika",
    status: "Tahap Penuntutan",
    tanggal: "2025-01-22",
    pihak: "Kejaksaan Negeri Bandung",
    ringkasan:
      "Terdakwa ditangkap dengan barang bukti 1,2 kg sabu-sabu dan dituntut hukuman penjara 15 tahun.",
  },
  {
    nomor_perkara: "PDM-289/Pid.B/4/2024",
    nama_terdakwa: "Rudi Hartono",
    pasal: "Pasal 363 KUHP",
    jenis_perkara: "Pencurian",
    status: "P21",
    tanggal: "2024-04-10",
    pihak: "Kejaksaan Negeri Surabaya",
    ringkasan:
      "Terdakwa didakwa mencuri kendaraan roda dua dengan pemberatan; berkas perkara dinyatakan lengkap (P21).",
  },
  {
    nomor_perkara: "PDM-045/Pid.Sus/6/2025",
    nama_terdakwa: "PT Mitra Energi Nusantara",
    pasal: "UU No. 4/2023 tentang PPSK",
    jenis_perkara: "Korporasi / TPPU",
    status: "Tahap Penyidikan",
    tanggal: "2025-06-02",
    pihak: "Kejaksaan Agung",
    ringkasan:
      "Penyidikan dugaan tindak pidana pencucian uang yang melibatkan korporasi di sektor energi.",
  },
  {
    nomor_perkara: "PDM-77/Pid.Sus/2/2025",
    nama_terdakwa: "Rina Kusmawati",
    pasal: "Pasal 29 UU No. 17/2023",
    jenis_perkara: "Kesehatan / Malpraktik",
    status: "SP3",
    tanggal: "2025-02-18",
    pihak: "Kejaksaan Negeri Medan",
    ringkasan:
      "Perkara dihentikan (SP3) karena tidak ditemukan cukup bukti terdapat kelalaian medis.",
  },
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function matchPerkara(q: QuickSearch): Perkara[] {
  const term = normalize(`${q.nomor_perkara ?? ""} ${q.nama_terdakwa ?? ""}`).trim();
  const jenis = normalize(q.jenis_perkara ?? "").trim();
  const tahun = q.tahun?.trim();

  return SAMPLE_PERKARA.filter((p) => {
    const haystack = normalize(
      `${p.nomor_perkara} ${p.nama_terdakwa} ${p.jenis_perkara} ${p.pasal} ${p.pihak}`
    );

    if (term && !haystack.includes(term)) return false;
    if (jenis && !haystack.includes(jenis)) return false;
    if (tahun && !p.tanggal.startsWith(tahun)) return false;
    return true;
  });
}

function detectKeyword(input: string): QuickSearch {
  const text = normalize(input);
  const q: QuickSearch = {};

  const nomor = input.match(/(?:perkara\s*)?(?:no\.?|nomor)?\s*[A-Za-z]{2,6}-?\d{1,5}\/[A-Za-z./]{1,20}\/\d{4}/i);
  if (nomor) q.nomor_perkara = nomor[0].trim();

  const tahun = input.match(/tahun\s*(\d{4})/i);
  if (tahun) q.tahun = tahun[1];

  if (
    /(tahun\s*|perkara\s+)?ganti\s*rugi|kelelahan|kekayaan|2\s*junjo/i.test(text) ||
    /korupsi|tipikor|tindak pidana korupsi/i.test(text)
  ) {
    q.jenis_perkara = "Korupsi";
  } else if (/narkoba|narkotika|sabu|ganja/i.test(text)) {
    q.jenis_perkara = "Narkotika";
  } else if (/pencurian|maling|curas|curat/i.test(text)) {
    q.jenis_perkara = "Pencurian";
  } else if (/pencucian|tppu|uang/i.test(text)) {
    q.jenis_perkara = "Korporasi / TPPU";
  } else if (/malpraktik|kesehatan|medis/i.test(text)) {
    q.jenis_perkara = "Kesehatan / Malpraktik";
  }

  return q;
}

export interface MockAnswer {
  fullText: string;
  perkara: Perkara[];
}

function buildAnswerFullText(q: QuickSearch, results: Perkara[]): string {
  const header = "Hasil pencarian perkara pada Kejaksaan:\n";

  if (results.length === 0) {
    return (
      header +
      "Mohon maaf, saya tidak menemukan perkara yang cocok dengan kriteria tersebut. " +
      "Coba ubah jenis perkara, nomor perkara, atau nama terdakwa Anda."
    );
  }

  const intro = `Saya menemukan ${results.length} perkara yang sesuai. Berikut ringkasannya:\n`;
  const list = results
    .map(
      (p, i) =>
        `${i + 1}. ${p.nomor_perkara} — ${p.nama_terdakwa}\n` +
        `   Jenis: ${p.jenis_perkara} | Status: ${p.status}\n` +
        `   Pasal: ${p.pasal}\n` +
        `   ${p.ringkasan}`
    )
    .join("\n");

  const footer =
    "\n\nUntuk melihat detail lebih lanjut, gunakan kanal resmi Kejaksaan atau hubungi petugas informasi perkara setempat.";

  return header + intro + list + footer;
}

export function buildMockAnswer(
  input: string,
  quickSearch?: QuickSearch
): MockAnswer {
  const q: QuickSearch = {
    ...detectKeyword(input),
    ...(quickSearch ?? {}),
  };

  const fallback = Object.keys(q).length === 0;
  const results = fallback ? SAMPLE_PERKARA : matchPerkara(q);

  const fullText = fallback
    ? "Halo! Saya asisten pencarian perkara Kejaksaan. Saya dapat membantu Anda mencari " +
      "perkara berdasarkan jenis perkara, nomor perkara, nama terdakwa, atau tahun. " +
      "Contoh pertanyaan: \"Cari perkara korupsi tahun 2025\" atau \"lihat perkara PDM-05/TPK/3/2025\".\n\n" +
      "Berikut beberapa perkara yang sedang berjalan:\n" +
      results
        .map(
          (p, i) =>
            `${i + 1}. ${p.nomor_perkara} — ${p.nama_terdakwa} (${p.jenis_perkara}, ${p.status})`
        )
        .join("\n")
    : buildAnswerFullText(q, results);

  return { fullText, perkara: fallback ? results : results };
}