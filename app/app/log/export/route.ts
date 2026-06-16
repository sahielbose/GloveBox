import { NextResponse } from "next/server";
import PDFKit from "pdfkit";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { listServiceRecords } from "@/lib/db/queries";
import { vehicleLabel } from "@/lib/services/types";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof listServiceRecords>>[number];

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtMoney(cents: number | null): string {
  if (cents == null) return "";
  return `$${(cents / 100).toFixed(2)}`;
}

function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  // Always quote + escape embedded quotes — safe for commas, newlines, quotes.
  return `"${s.replace(/"/g, '""')}"`;
}

function buildCsv(rows: Row[]): string {
  const header = ["Date", "Type", "Description", "Mileage", "Parts", "Labor (hr)", "Cost", "Source"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    const parts = (r.parts ?? [])
      .map((p) => (p.partNumber ? `${p.name} (${p.partNumber})` : p.name))
      .join("; ");
    lines.push(
      [
        csvCell(fmtDate(r.date)),
        csvCell(r.type),
        csvCell(r.description ?? ""),
        csvCell(r.mileage ?? ""),
        csvCell(parts),
        csvCell(r.laborHours ?? ""),
        csvCell(fmtMoney(r.costCents)),
        csvCell(r.source),
      ].join(","),
    );
  }
  return lines.join("\r\n");
}

function buildPdf(title: string, subtitle: string, rows: Row[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFKit({ size: "LETTER", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header.
    doc.fontSize(20).text("GloveBox — Service history", { continued: false });
    doc.moveDown(0.2);
    doc.fontSize(13).fillColor("#444").text(title);
    doc.fontSize(10).fillColor("#777").text(subtitle);
    doc.moveDown(0.5);
    doc.fillColor("#000");

    // Divider.
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor("#cccccc").stroke();
    doc.moveDown(0.6);

    if (rows.length === 0) {
      doc.fontSize(11).fillColor("#555").text("No service records yet.");
    }

    for (const r of rows) {
      const meta = [fmtDate(r.date), r.mileage != null ? `${r.mileage.toLocaleString()} mi` : null, r.source]
        .filter(Boolean)
        .join("  ·  ");

      doc.fontSize(12).fillColor("#000").text(r.type, { continued: false });
      doc.fontSize(9).fillColor("#888").text(meta);
      if (r.description) doc.fontSize(10).fillColor("#333").text(r.description);

      const details: string[] = [];
      if (r.parts && r.parts.length > 0) {
        details.push("Parts: " + r.parts.map((p) => (p.partNumber ? `${p.name} (${p.partNumber})` : p.name)).join(", "));
      }
      if (r.laborHours != null) details.push(`Labor: ${r.laborHours} hr`);
      if (r.costCents != null) details.push(`Cost: ${fmtMoney(r.costCents)}`);
      if (details.length > 0) doc.fontSize(9).fillColor("#555").text(details.join("   "));

      doc.moveDown(0.7);
    }

    doc.moveDown(0.5);
    doc
      .fontSize(8)
      .fillColor("#999")
      .text(
        "Exported from GloveBox. Service history as recorded by the owner; informational, not a guarantee.",
        { align: "left" },
      );

    doc.end();
  });
}

/** Authed export of the active vehicle's service history as CSV or PDF. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

  // Active vehicle is read from the cookie via app-context, scoped to this user.
  const { active } = await getActiveVehicle(user.id);
  if (!active) return new NextResponse("No active vehicle", { status: 404 });

  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "csv").toLowerCase();
  const rows = await listServiceRecords(active.id);

  const label = vehicleLabel(active);
  const slug = (label || "vehicle").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "pdf") {
    const subtitle = [
      active.vin ? `VIN ${active.vin}` : null,
      `${active.mileage.toLocaleString()} mi`,
      `${rows.length} record${rows.length === 1 ? "" : "s"}`,
      `Exported ${stamp}`,
    ]
      .filter(Boolean)
      .join("  ·  ");
    const pdf = await buildPdf(label, subtitle, rows);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="glovebox-service-history-${slug}-${stamp}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "csv") {
    const csv = buildCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="glovebox-service-history-${slug}-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse("Unsupported format — use ?format=csv or ?format=pdf", { status: 400 });
}
