// Tipe data inti chatbot pencari perkara kejaksaan

export type PerkaraStatus = "P21" | "Tahap Penyidikan" | "Tahap Penuntutan" | "Pemeriksaan Sidang" | "Eksekusi" | "SP3";

export interface Perkara {
  nomor_perkara: string;
  nama_terdakwa: string;
  pasal: string;
  jenis_perkara: string;
  status: PerkaraStatus;
  tanggal: string;
  pihak: string;
  ringkasan: string;
  link_detail?: string;
}

export interface QuickSearch {
  jenis_perkara?: string;
  nomor_perkara?: string;
  nama_terdakwa?: string;
  tahun?: string;
}

export interface CaseResult {
  quickSearch: QuickSearch;
  perkaraList: Perkara[];
  total: number;
  deterministic?: boolean;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  perkaraResult?: CaseResult;
  streaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export const PERKARA_STATUS: Record<PerkaraStatus, string> = {
  P21: "Berkas P21 - Dilimpahkan",
  "Tahap Penyidikan": "Tahap Penyidikan",
  "Tahap Penuntutan": "Tahap Penuntutan",
  "Pemeriksaan Sidang": "Pemeriksaan Sidang",
  Eksekusi: "Eksekusi",
  SP3: "SP3 - Dihentikan",
};