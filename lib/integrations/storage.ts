import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * File storage for receipts/photos/docs. Local filesystem in dev (./storage),
 * pluggable to S3-compatible storage later. Returns an app-relative URL served by
 * the authed /api/files route (which re-checks vehicle ownership).
 */
const ROOT = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.resolve(process.cwd(), "storage");

export function storageEnabled(): boolean {
  return true; // local always works
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

export async function saveFile(
  vehicleId: string,
  filename: string,
  bytes: Uint8Array | ArrayBuffer,
): Promise<{ url: string; relPath: string }> {
  const buf = Buffer.from(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes);
  const id = crypto.randomUUID().slice(0, 8);
  const rel = path.join(vehicleId, `${id}-${safeName(filename)}`);
  const abs = path.join(ROOT, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buf);
  return { url: `/api/files/${rel.split(path.sep).join("/")}`, relPath: rel };
}

/**
 * True when a relative path is a safe, literal `<vehicleId>/<file>` with no
 * traversal. Both the ownership check and the read MUST gate on this so they
 * can never disagree about which vehicle's directory is being touched.
 */
function isSafeRelPath(relPath: string): boolean {
  const segments = relPath.split("/");
  if (segments.length < 2) return false;
  if (segments.some((s) => s === "" || s === "." || s === ".." || s.includes("\\"))) return false;
  // the resolved path must be exactly ROOT joined with the literal segments
  const abs = path.resolve(ROOT, relPath);
  return abs === path.join(ROOT, ...segments) && abs.startsWith(ROOT + path.sep);
}

/** Resolve a stored relative path back to absolute bytes, guarding traversal. */
export async function readFile(relPath: string): Promise<Buffer | null> {
  if (!isSafeRelPath(relPath)) return null;
  try {
    return await fs.readFile(path.resolve(ROOT, relPath));
  } catch {
    return null;
  }
}

/** The vehicleId a stored file belongs to (first path segment) — for ownership checks. */
export function vehicleIdFromPath(relPath: string): string | null {
  if (!isSafeRelPath(relPath)) return null; // reject traversal before the ownership check
  return relPath.split("/")[0] || null;
}
