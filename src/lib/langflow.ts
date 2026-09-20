// Klien server-side untuk Langflow via protokol A2A (Agent2Agent),
// sesuai agent card flow: JSONRPC + streaming SSE (message/stream).
//
// Jika MOCK_MODE=true (atau flow belum dikonfigurasi), memakai data contoh
// agar UI tetap bisa diuji tanpa Langflow.

import type { QuickSearch } from "@/lib/types";

const BASE_URL = process.env.LANGFLOW_BASE_URL ?? "http://127.0.0.1:7860";
const FLOW_ID = process.env.LANGFLOW_FLOW_ID ?? "";
const APPLICATION_TOKEN = process.env.LANGFLOW_APPLICATION_TOKEN ?? "";
// Bisa diisi URL A2A lengkap, mis. http://host:port/api/v1/a2a/{flow}/jsonrpc
const A2A_URL_OVERRIDE = process.env.LANGFLOW_A2A_URL ?? "";

const MOCK_MODE =
  process.env.MOCK_MODE === "true" || (!FLOW_ID && !A2A_URL_OVERRIDE);

export function isMockMode(): boolean {
  return MOCK_MODE;
}

export interface LangflowStreamResult {
  fullText: string;
  raw?: unknown;
}

type TokenCallback = (token: string) => void;

interface A2APart {
  kind?: string;
  text?: string;
}

interface A2AArtifact {
  parts?: A2APart[];
}

interface A2AStatus {
  state?: string;
  message?: { parts?: A2APart[] };
}

interface A2AResultShape {
  kind?: string;
  artifact?: A2AArtifact;
  artifacts?: A2AArtifact[];
  status?: A2AStatus;
  final?: boolean;
  contextId?: string;
  text?: string;
}

interface A2AEnvelope {
  error?: { code?: number; message?: string };
  result?: A2AResultShape;
}

function jsonrpcUrl(): string {
  if (A2A_URL_OVERRIDE) return A2A_URL_OVERRIDE;
  return `${BASE_URL.replace(/\/$/, "")}/api/v1/a2a/${FLOW_ID}/jsonrpc`;
}

function authHeaders(): Record<string, string> {
  if (!APPLICATION_TOKEN) return {};
  return {
    "x-api-key": APPLICATION_TOKEN,
    Authorization: `Bearer ${APPLICATION_TOKEN}`,
  };
}

// ============================================================
// Mode Langflow sungguhan (A2A JSON-RPC message/stream → SSE)
// ============================================================
async function runLangflowLive(params: {
  input: string;
  sessionId: string;
  quickSearch?: QuickSearch;
  signal?: AbortSignal;
  onToken?: TokenCallback;
}): Promise<LangflowStreamResult> {
  const { input, sessionId, quickSearch, signal, onToken } = params;

  const controller = new AbortController();
  const externalSignal = signal;
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", () => controller.abort());
  }

  const messageId = crypto.randomUUID();
  const contextId = contextIdFor(sessionId);
  const sendText = quickSearch
    ? `${input}\n\n[quick_search] ${JSON.stringify(quickSearch)}`
    : input;

  const payload = (method: string) => ({
    jsonrpc: "2.0",
    id: 1,
    method,
    params: {
      message: {
        role: "user",
        parts: [{ kind: "text", text: sendText }],
        messageId,
        ...(contextId ? { contextId } : {}),
      },
    },
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders(),
  };

  const accumulated: string[] = [];

  const pushDelta = (text: string) => {
    if (!text) return;
    const acc = accumulated.join("");
    let delta = text;
    if (text.startsWith(acc)) {
      delta = text.slice(acc.length);
    } else if (acc.startsWith(text)) {
      delta = "";
    }
    if (delta) {
      accumulated.push(delta);
      onToken?.(delta);
    }
  };

  const finalizeContext = (result: A2AResultShape) => {
    const cid = result.contextId;
    if (typeof cid === "string" && cid) contextIdMap.set(sessionId, cid);
  };

  const streaming = async () => {
    const res = await fetch(jsonrpcUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify(payload("message/stream")),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`A2A HTTP ${res.status}: ${await res.text().catch(() => "")}`);
    if (!res.body) throw new Error("A2A tidak mengembalikan body stream.");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let completed = false;

    while (!completed) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        let line = rawLine.trim();
        if (!line) continue;
        if (line.startsWith("data:")) line = line.slice(5).trim();
        if (!line) continue;

        let ev: A2AEnvelope;
        try {
          ev = JSON.parse(line);
        } catch {
          continue;
        }

        if (ev.error) {
          const code = ev.error.code;
          // Task sudah tidak punya stream aktif → coba metode sinkron.
          if (code === -32603 || code === -32601) {
            return { method: "send" as const };
          }
          throw new Error(ev.error.message ?? "A2A error");
        }

        const result = ev.result;
        if (!result) continue;

        const kind = result.kind;
        if (kind === "artifact-update") {
          const texts = artifactTexts(result.artifact);
          texts.forEach(pushDelta);
          finalizeContext(result);
        } else if (kind === "status-update") {
          const state = result.status?.state;
          if (state === "failed") {
            finalizeContext(result);
            if (!accumulated.length) {
              throw new Error(result.status?.message?.parts?.[0]?.text ?? "A2A task failed");
            }
          }
          if (result.final === true) completed = true;
          finalizeContext(result);
        } else if (kind === "task") {
          const state = result.status?.state;
          if (state === "completed" || state === "failed") completed = true;
          const texts = artifactTexts(result.artifacts);
          texts.forEach(pushDelta);
          finalizeContext(result);
        } else if (typeof result.text === "string") {
          pushDelta(result.text);
          finalizeContext(result);
        }
      }
    }

    return { method: "stream" as const };
  };

  const blockingSend = async () => {
    const res = await fetch(jsonrpcUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify(payload("message/send")),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`A2A HTTP ${res.status}: ${await res.text().catch(() => "")}`);
    const ev = (await res.json()) as A2AEnvelope;
    if (ev.error) throw new Error(ev.error.message ?? "A2A error");
    const result = ev.result;
    if (result) {
      finalizeContext(result);
      artifactTexts(result.artifacts).forEach(pushDelta);
      const statusText =
        result.status?.message?.parts?.map((p) => p.text ?? "").join("\n") ?? "";
      if (statusText) pushDelta(statusText);
    }
  };

  try {
    const outcome = await streaming();
    if (outcome.method === "send" && !accumulated.length) {
      await blockingSend();
    }
  } catch (err) {
    if (externalSignal?.aborted) throw new DOMException("Dibatalkan", "AbortError");
    // Jatuh ke message/send sebagai cadangan untuk kasus stream ditolak.
    if (!accumulated.length) {
      try {
        await blockingSend();
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    } else {
      throw err;
    }
  }

  const fullText = accumulated.join("");
  return { fullText, raw: { a2a: true } };
}

function artifactTexts(artifacts: unknown): string[] {
  if (!artifacts) return [];
  const list: unknown[] = Array.isArray(artifacts) ? artifacts : [artifacts];
  const texts: string[] = [];
  for (const item of list) {
    const artifact = item as A2AArtifact | null;
    for (const part of artifact?.parts ?? []) {
      if (part?.kind === "text" && typeof part.text === "string") texts.push(part.text);
    }
  }
  return texts;
}

// ============================================================
// Memori multi-turn: simpan contextId per sesi
// ============================================================
const contextIdMap = new Map<string, string>();

function contextIdFor(sessionId: string): string | undefined {
  const last = contextIdMap.get(sessionId);
  if (typeof last === "string" && last) return last;
  return undefined;
}

// ============================================================
// Mode demo (tanpa Langflow)
// ============================================================
async function runLangflowMock(params: {
  input: string;
  quickSearch?: QuickSearch;
  signal?: AbortSignal;
  onToken?: TokenCallback;
}): Promise<LangflowStreamResult> {
  const { input, quickSearch, signal, onToken } = params;

  const answer = await import("@/lib/mockData").then((m) =>
    m.buildMockAnswer(input, quickSearch)
  );

  const delay = (ms: number) =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, ms);
      if (signal) {
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          resolve();
        });
      }
    });

  const tokens = answer.fullText.split(/(?<=[ \n])/);
  for (const token of tokens) {
    if (signal?.aborted) break;
    onToken?.(token);
    await delay(16 + Math.random() * 28);
  }

  return { fullText: answer.fullText, raw: { mock: true, perkara: answer.perkara } };
}

export async function runLangflow(params: {
  input: string;
  sessionId: string;
  quickSearch?: QuickSearch;
  signal?: AbortSignal;
  onToken?: TokenCallback;
}): Promise<LangflowStreamResult> {
  if (isMockMode()) {
    return runLangflowMock({
      input: params.input,
      quickSearch: params.quickSearch,
      signal: params.signal,
      onToken: params.onToken,
    });
  }
  return runLangflowLive(params);
}