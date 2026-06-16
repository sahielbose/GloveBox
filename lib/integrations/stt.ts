import OpenAI, { toFile } from "openai";

/**
 * Whisper speech-to-text for voice capture. Uses the OpenAI Whisper API when
 * OPENAI_API_KEY is set; otherwise reports unavailable so the UI falls back to
 * text entry. (Self-hosters can point this at a local whisper.cpp server.)
 */
export function sttEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function transcribeAudio(
  bytes: Uint8Array | ArrayBuffer,
  filename = "audio.webm",
): Promise<{ text: string; available: boolean }> {
  if (!process.env.OPENAI_API_KEY) return { text: "", available: false };
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const buf = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  const file = await toFile(buf, filename);
  const res = await client.audio.transcriptions.create({
    file,
    model: process.env.WHISPER_MODEL ?? "whisper-1",
  });
  return { text: res.text ?? "", available: true };
}
