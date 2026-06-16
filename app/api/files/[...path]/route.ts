import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getVehicleForUser } from "@/lib/db/queries";
import { readFile, vehicleIdFromPath } from "@/lib/integrations/storage";

const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  txt: "text/plain",
  csv: "text/csv",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const user = await getCurrentUser();
  if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { path } = await params;
  const relPath = path.join("/");
  const vehicleId = vehicleIdFromPath(relPath);
  if (!vehicleId) return new NextResponse("Not found", { status: 404 });

  // Ownership check: the file's vehicle must belong to the requester.
  const owned = await getVehicleForUser(user.id, vehicleId);
  if (!owned) return new NextResponse("Forbidden", { status: 403 });

  const bytes = await readFile(relPath);
  if (!bytes) return new NextResponse("Not found", { status: 404 });

  const ext = relPath.split(".").pop()?.toLowerCase() ?? "";
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
