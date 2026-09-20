# SI PERKARA — Chatbot Pencari Perkara Kejaksaan

Aplikasi web chatbot AI untuk mencari dan memahami informasi perkara pada Kejaksaan, dibangun dengan Next.js dan terhubung ke flow **Langflow** melalui protokol **A2A (Agent2Agent)**, dengan data perkara tersimpan di **Astra DB** (vector search).

## Arsitektur

```
Browser (http://localhost:3000)
        |  HTTP POST (SSE streaming)
        v
Next.js API Route  /api/chat          <- src/app/api/chat/route.ts
        |  A2A JSON-RPC message/stream
        v
Langflow  (http://localhost:7860)     <- flow "SI PERKARA" (dipublish sebagai A2A agent)
        |  vector search
        v
Astra DB  (collection: data_kejaksaan) <- data perkara ter-embed
```

- Jawaban AI disalurkan bertahap (efek mengetik) ke UI.
- Riwayat chat tersimpan di browser (localStorage).

## Fitur

- Chat AI streaming dengan indikator mengetik
- Form pencarian perkara: jenis perkara, nomor perkara, nama terdakwa/korporasi, tahun
- Multi-sesi percakapan + riwayat tersimpan di localStorage
- Integrasi A2A `message/stream` (SSE) dengan fallback `message/send`

## Prasyarat

| Tools | Keterangan |
|---|---|
| Node.js 20+ | untuk menjalankan aplikasi web ([nodejs.org](https://nodejs.org)) |
| Python 3.10–3.12 | untuk menginstall Langflow |
| Akun Google AI | untuk API key Gemini (gratis) → [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Akun Astra DB | untuk database vector (gratis) → [astra.datastax.com](https://astra.datastax.com) |

## Langkah Setup

### 1. Jalankan Langflow

```bash
pip install langflow
```

Windows: dobel-klik `start-langflow.bat`, atau manual:

```bat
set LANGFLOW_A2A_ENABLED=true
langflow run --host 127.0.0.1 --port 7860
```

> `LANGFLOW_A2A_ENABLED=true` **wajib** agar flow bisa dipanggil lewat protokol A2A.
> Buka http://localhost:7860 dan daftar akun lokal (pemilik = Anda sendiri).

### 2. Import flow

1. Buka Langflow → **New Flow** → **Import** → pilih `langflow/flow-siperkara.json`
2. Buka flow tersebut, **copy Flow ID dari URL browser**
   (contoh: `http://localhost:7860/flow/<FLOW_ID>`) — dipakai di langkah 5.

### 3. Publish flow sebagai A2A agent

1. Di editor flow, buka tab **Agent** (ikon bot di sidebar)
2. Nyalakan **Serve as an A2A agent** → **Save**
3. Status harus berubah menjadi **Live**

### 4. Isi kredensial (global variables)

Di Langflow: **Settings → Global Variables → Add New**, buat dua variabel:

| Nama Variable | Isi |
|---|---|
| `GOOGLE_API_KEY` | API key Gemini dari Google AI Studio |
| `Astra_DB_Application_TOKEN` | Application Token Astra DB (format `AstraCS:...`) |

> Astra DB: buat database serverless (keyspace default `default_keyspace`).
> Collection `data_kejaksaan` akan dibuat otomatis saat ingest pertama.
> Kalau ingin membuat manual: tipe **Vector**, dimension **3072**, indexing **Deny**: `text`, `metadata`.

Kemudian di flow, pastikan komponen **Astra DB** (ingest dan search) menunjuk
**endpoint & database milik Anda** (bagian ini sengaja dibersihkan dari file JSON).

> Juga cek komponen **Language Model** dan **Embeddings**: field *API Key* di file
> JSON berupa placeholder `GANTI-DENGAN-GOOGLE-API-KEY-KAMU` — klik field-nya,
> lalu pilih global variable `GOOGLE_API_KEY` (atau paste API key langsung).

### 5. Ingest data perkara

1. Buka flow → komponen **Read File** → upload `data/kecil01.txt`
   (contoh 50 perkara; siapkan file lain dengan format sama bila perlu)
2. Komponen **Split Text**: Chunk Size `7900`, Chunk Overlap `0`,
   Separator `=== PERKARA ===`
3. Klik **▶ (play)** pada komponen **Astra DB** (jalur ingest) dan tunggu selesai
4. Verifikasi di dashboard Astra DB: record punya field `$vector`

### 6. Jalankan aplikasi web

Buat file `.env` di folder proyek (isi `FLOW_ID` dari langkah 2):

```env
LANGFLOW_BASE_URL=http://localhost:7860
LANGFLOW_FLOW_ID=<FLOW_ID dari langkah 2>
LANGFLOW_APPLICATION_TOKEN=
LANGFLOW_TWEAKS={}
MOCK_MODE=false
```

```bash
npm install
npm run build
npm run start
```

Buka **http://localhost:3000** — chatbot siap dipakai. 🎉

> Agar orang lain di Wi-Fi yang sama bisa mengakses:
> `npx next start -H 0.0.0.0 -p 3000`, lalu buka `http://<IP-komputer>:3000`.

## Troubleshooting

| Gejala | Penyebab & Solusi |
|---|---|
| 429 `RESOURCE_EXHAUSTED` saat ingest/search | Kuota Gemini habis — tunggu ±1 menit lalu ulangi, atau aktifkan billing |
| A2A endpoint 404 | Flow belum di-publish sebagai agent, atau `LANGFLOW_A2A_ENABLED=true` belum diset sebelum Langflow dijalankan |
| Aplikasi: "Gagal menghubungi server" | Langflow tidak jalan, atau `LANGFLOW_FLOW_ID` salah |
| `Document size limitation violated` | Split Text belum benar — wajib 7900 / 0 / `=== PERKARA ===` |
| `EADDRINUSE :3000` | Port 3000 dipakai proses lain — matikan dulu atau ganti port |
| Jawaban "tidak ditemukan" padahal data ada | Cek kembali langkah ingest (`$vector` terisi?) dan search collection = `data_kejaksaan` |

## Teknologi

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Langflow** (protokol A2A — JSON-RPC `message/stream` over SSE)
- **Astra DB** (vector search, embedding `gemini-embedding-001`)
