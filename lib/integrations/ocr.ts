import { isLLMAvailable, readImageText } from "@/lib/llm/client";

/**
 * Extract text from an uploaded estimate / inspection sheet. Three paths, all
 * degrading gracefully:
 *  - text/* → decoded directly
 *  - application/pdf → embedded text via pdf-parse (digital PDFs)
 *  - image/* → OCR via the model's vision (Claude) when a key is set
 * When nothing can read it, returns a clear `note` telling the owner to paste.
 */
export type OcrResult = {
  text: string;
  method: "text" | "pdf" | "vision" | "none";
  note?: string;
};

const IMAGE_TYPES: Record<string, "image/png" | "image/jpeg" | "image/webp" | "image/gif"> = {
  "image/png": "image/png",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/webp": "image/webp",
  "image/gif": "image/gif",
};

export async function extractTextFromUpload(
  bytes: ArrayBuffer,
  mime: string,
  filename = "",
): Promise<OcrResult> {
  const m = (mime || "").toLowerCase();
  const ext = filename.toLowerCase().split(".").pop() ?? "";

  if (m.startsWith("text/") || ["txt", "csv", "md"].includes(ext)) {
    return { text: new TextDecoder().decode(bytes).trim(), method: "text" };
  }

  if (m.includes("pdf") || ext === "pdf") {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(bytes) });
      const result = await parser.getText();
      const text = (result.text ?? "").trim();
      if (text) return { text, method: "pdf" };
      return { text: "", method: "none", note: "This PDF has no selectable text (it looks scanned). Snap a photo of it or paste the text." };
    } catch {
      return { text: "", method: "none", note: "Couldn't read that PDF. Paste the text instead." };
    }
  }

  const mediaType = IMAGE_TYPES[m] ?? (["png", "jpg", "jpeg", "webp", "gif"].includes(ext) ? "image/jpeg" : null);
  if (mediaType) {
    if (!isLLMAvailable()) {
      return { text: "", method: "none", note: "Reading photos needs an ANTHROPIC_API_KEY (vision). Paste the text instead." };
    }
    try {
      const text = await readImageText({ bytes, mediaType });
      return { text, method: "vision" };
    } catch {
      return { text: "", method: "none", note: "Couldn't read that image. Paste the text instead." };
    }
  }

  return { text: "", method: "none", note: "Unsupported file type. Paste the text instead." };
}
