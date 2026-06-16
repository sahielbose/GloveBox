"use client";

import { useRef, useState, useTransition } from "react";
import {
  Check,
  Loader2,
  Mic,
  Paperclip,
  Save,
  Square,
  Trash2,
} from "lucide-react";
import { buttonClass, inputClass } from "@/components/ui";
import { formatMoney } from "@/lib/utils";
import { addLogEntryAction, type AddEntryResult } from "./actions";

/**
 * Capture a service entry by text or voice.
 * - Textarea: "what did you do?"
 * - Voice: MediaRecorder → audio blob, POSTed to the add action (transcribed server-side).
 * - Optional receipt attachment.
 * Saving is the single explicit action; the structured result previews after save.
 */
export function LogCapture() {
  const [text, setText] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<AddEntryResult | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);

  async function startRecording() {
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        setAudio(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setResult({ ok: false, error: "Couldn't access the microphone — type your note instead." });
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  function save() {
    setResult(null);
    start(async () => {
      const fd = new FormData();
      if (text.trim()) fd.set("text", text.trim());
      if (audio) fd.set("audio", audio, "memo.webm");
      if (receipt) fd.set("receipt", receipt);
      const res = await addLogEntryAction(fd);
      setResult(res);
      if (res.ok) {
        setText("");
        setAudio(null);
        setReceipt(null);
        if (receiptInputRef.current) receiptInputRef.current.value = "";
      }
    });
  }

  const canSave = !pending && (text.trim().length > 0 || audio != null);

  return (
    <div className="rounded-card border border-hairline bg-surface p-5">
      <label className="block text-sm text-ash" htmlFor="log-text">
        What did you do?
      </label>
      <textarea
        id="log-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="e.g. Changed the oil and rotated the tires at 48,000 mi, $90"
        className={`${inputClass} mt-1.5 resize-y`}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-btn border border-hairline px-3 py-2 text-sm text-chalk transition-colors hover:border-chalk/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
          >
            <Mic size={15} aria-hidden /> Record voice
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-1.5 rounded-btn border border-alert/50 bg-alert/10 px-3 py-2 text-sm text-chalk"
          >
            <Square size={14} aria-hidden /> Stop recording
            <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-alert" aria-hidden />
          </button>
        )}

        {audio && !recording && (
          <span className="inline-flex items-center gap-1.5 text-sm text-ash">
            <Check size={14} className="text-ok" aria-hidden /> Voice memo ready
            <button type="button" onClick={() => setAudio(null)} className="-my-2 inline-flex min-h-11 min-w-11 items-center justify-center text-ash hover:text-chalk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage" aria-label="Discard voice memo">
              <Trash2 size={13} aria-hidden />
            </button>
          </span>
        )}

        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-btn border border-hairline px-3 py-2 text-sm text-chalk transition-colors hover:border-chalk/30">
          <Paperclip size={15} aria-hidden /> {receipt ? "Change receipt" : "Attach receipt"}
          <input
            ref={receiptInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
          />
        </label>
        {receipt && <span className="max-w-[14rem] truncate text-sm text-ash">{receipt.name}</span>}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={!canSave} className={buttonClass("primary")}>
          {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Save size={15} aria-hidden />}
          Save entry
        </button>
        <span className="text-xs text-ash">We&apos;ll structure it automatically. Nothing saves until you click.</span>
      </div>

      {result && !result.ok && <p className="mt-3 text-sm text-alert">{result.error}</p>}

      {result && result.ok && (
        <div className="mt-4 rounded-card border border-ok/40 bg-ok/10 p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium text-chalk">
            <Check size={15} className="text-ok" aria-hidden /> Saved
            <span className="ml-1 rounded-chip border border-hairline px-1.5 py-0.5 text-xs uppercase tracking-wide text-ash">
              {result.saved.source}
            </span>
            {!result.saved.llmUsed && (
              <span className="rounded-chip border border-hairline px-1.5 py-0.5 text-xs uppercase tracking-wide text-ash">
                basic parse
              </span>
            )}
          </p>
          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div className="flex items-center gap-1.5">
              <dt className="text-ash">Type</dt>
              <dd className="text-chalk">{result.saved.type}</dd>
            </div>
            {result.saved.mileage != null && (
              <div className="flex items-center gap-1.5">
                <dt className="text-ash">Mileage</dt>
                <dd className="font-mono text-chalk">{result.saved.mileage.toLocaleString()} mi</dd>
              </div>
            )}
            {result.saved.costCents != null && (
              <div className="flex items-center gap-1.5">
                <dt className="text-ash">Cost</dt>
                <dd className="font-mono text-chalk">{formatMoney(result.saved.costCents)}</dd>
              </div>
            )}
          </dl>
          {result.saved.description && (
            <p className="mt-2 text-sm text-ash">{result.saved.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
