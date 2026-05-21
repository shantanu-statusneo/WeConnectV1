import { NextResponse } from "next/server";
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { getCertificate, getSession } from "@/lib/session-store";
import { getDomainState } from "@/lib/store/domain-store";
import { generateTrustReport } from "@/lib/domains/trust-report";

function sanitizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    fontSize: number;
    lineHeight: number;
    color: ReturnType<typeof rgb>;
    font: PDFFont;
  },
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const probe = current ? `${current} ${word}` : word;
    const width = options.font.widthOfTextAtSize(probe, options.fontSize);
    if (width <= options.maxWidth) {
      current = probe;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);

  for (const line of lines) {
    page.drawText(line, {
      x: options.x,
      y: options.y,
      size: options.fontSize,
      color: options.color,
      font: options.font,
    });
    options.y -= options.lineHeight;
  }

  return options.y;
}

function certificationLabel(value: string | undefined): string {
  if (value === "digital") return "Digitally Certified";
  if (value === "self") return "Self Certified";
  return "Self Declared";
}

function drawBrandMark(
  page: PDFPage,
  {
    x,
    y,
    size,
    font,
    colors,
  }: {
    x: number;
    y: number;
    size: number;
    font: PDFFont;
    colors: {
      plum: ReturnType<typeof rgb>;
      rose: ReturnType<typeof rgb>;
      coral: ReturnType<typeof rgb>;
      white: ReturnType<typeof rgb>;
    };
  },
) {
  page.drawRectangle({ x, y, width: size, height: size, color: colors.plum });
  page.drawRectangle({ x: x + size * 0.34, y, width: size * 0.33, height: size, color: colors.rose });
  page.drawRectangle({ x: x + size * 0.67, y, width: size * 0.33, height: size, color: colors.coral });
  page.drawText("WE", {
    x: x + size * 0.2,
    y: y + size * 0.38,
    size: size * 0.25,
    font,
    color: colors.white,
  });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ certId: string }> },
) {
  try {
    const { certId } = await ctx.params;
    const cert = getCertificate(certId);
    if (!cert) {
      return NextResponse.json({ error: "certificate not found" }, { status: 404 });
    }

    const session = getSession(cert.sessionId);
    if (!session) {
      return NextResponse.json({ error: "session not found" }, { status: 404 });
    }

    const workflow = getDomainState(cert.sessionId);
    const report = workflow.trustReport ?? generateTrustReport(cert.sessionId, session);
    const validTill =
      workflow.governance.validTill ??
      new Date(new Date(cert.issuedAt).setFullYear(new Date(cert.issuedAt).getFullYear() + 3)).toISOString();

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 portrait
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const colors = {
      background: rgb(255 / 255, 250 / 255, 251 / 255),
      surface: rgb(255 / 255, 246 / 255, 248 / 255),
      surfaceStrong: rgb(248 / 255, 238 / 255, 242 / 255),
      card: rgb(1, 1, 1),
      foreground: rgb(33 / 255, 22 / 255, 32 / 255),
      muted: rgb(107 / 255, 91 / 255, 103 / 255),
      mutedStrong: rgb(74 / 255, 58 / 255, 70 / 255),
      border: rgb(231 / 255, 208 / 255, 219 / 255),
      borderStrong: rgb(196 / 255, 161 / 255, 180 / 255),
      plum: rgb(138 / 255, 49 / 255, 95 / 255),
      rose: rgb(201 / 255, 79 / 255, 124 / 255),
      coral: rgb(227 / 255, 123 / 255, 107 / 255),
      teal: rgb(8 / 255, 127 / 255, 140 / 255),
      white: rgb(1, 1, 1),
    };

    const left = 48;
    const contentWidth = 499;
    let y = 786;

    page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: colors.background });
    page.drawRectangle({ x: 20, y: 20, width: 555, height: 802, color: colors.card, borderColor: colors.borderStrong, borderWidth: 1.5 });
    page.drawRectangle({ x: 20, y: 748, width: 555, height: 74, color: colors.surface });
    page.drawRectangle({ x: 20, y: 748, width: 185, height: 74, color: colors.plum });
    page.drawRectangle({ x: 205, y: 748, width: 185, height: 74, color: colors.rose });
    page.drawRectangle({ x: 390, y: 748, width: 185, height: 74, color: colors.coral });
    page.drawRectangle({ x: 20, y: 734, width: 555, height: 14, color: colors.teal });

    drawBrandMark(page, { x: left, y: 770, size: 32, font: titleFont, colors });
    page.drawText("WEConnect", {
      x: left + 44,
      y: 789,
      size: 16,
      font: titleFont,
      color: colors.white,
    });
    page.drawText("Women-Owned Enterprise Network", {
      x: left + 44,
      y: 775,
      size: 8.5,
      font: bodyFont,
      color: colors.white,
    });
    page.drawText("Certificate", {
      x: 388,
      y: 783,
      size: 24,
      font: titleFont,
      color: colors.white,
    });

    y = 680;
    page.drawText("This certifies that", {
      x: left,
      y,
      size: 14,
      font: bodyFont,
      color: colors.muted,
    });
    y -= 34;

    page.drawRectangle({
      x: left - 10,
      y: y - 36,
      width: contentWidth - 16,
      height: 52,
      color: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    });
    page.drawText(cert.companyName, {
      x: left,
      y: y - 10,
      size: 24,
      font: titleFont,
      color: colors.plum,
    });
    y -= 64;

    const isProvisional = cert.provenanceSummary?.certificateKind === "provisional";
    page.drawText(
      isProvisional
        ? "has a paid Digital Certification request under supplier-admin review."
        : "has successfully completed the WEConnect verification process.",
      {
        x: left,
        y,
        size: 12,
        font: bodyFont,
        color: colors.muted,
      },
    );
    y -= 30;

    const details: Array<[string, string]> = [
      ["Certificate ID", cert.id],
      ["Certification Type", isProvisional ? "Provisional Digital Certification" : certificationLabel(workflow.certificationType)],
      ["Trust Score", `${report.trustScore}/100 (${report.riskLevel.toUpperCase()} RISK)`],
      ["Issued On", new Date(cert.issuedAt).toLocaleString()],
      ["Valid Through", new Date(validTill).toLocaleDateString()],
      ["Primary Owner", cert.primaryOwner],
      ["Female Ownership", `${cert.ownershipFemalePct}%`],
      ["Identity Match", report.identityMatch.toUpperCase()],
      ["Document Consistency", report.documentConsistency.toUpperCase()],
    ];

    for (const [label, value] of details) {
      page.drawText(`${label}:`, {
        x: left,
        y,
        size: 10.5,
        font: titleFont,
        color: colors.foreground,
      });
      page.drawText(value, {
        x: left + 140,
        y,
        size: 10.5,
        font: bodyFont,
        color: colors.mutedStrong,
      });
      y -= 18;
    }

    y -= 8;
    page.drawRectangle({
      x: left - 10,
      y: y - 62,
      width: contentWidth - 16,
      height: 62,
      color: colors.surfaceStrong,
      borderColor: colors.border,
      borderWidth: 1,
    });
    y = drawWrappedText(page, isProvisional ? `Review Reference: ${cert.txHash}` : `Blockchain Anchor TX: ${cert.txHash}`, {
      x: left,
      y: y - 20,
      maxWidth: contentWidth - 36,
      fontSize: 10,
      lineHeight: 13,
      color: colors.mutedStrong,
      font: bodyFont,
    });

    page.drawRectangle({ x: 20, y: 20, width: 555, height: 26, color: colors.plum });
    page.drawRectangle({ x: 390, y: 20, width: 185, height: 26, color: colors.rose });
    page.drawText("Issued by WEConnect Trust Engine", {
      x: left,
      y: 29,
      size: 10,
      font: titleFont,
      color: colors.white,
    });

    const bytes = await pdfDoc.save();
    const companyToken = sanitizeToken(cert.companyName || "supplier");
    const filename = `weconnect-certificate-${companyToken}-${cert.id.slice(0, 8)}.pdf`;

    return new NextResponse(Buffer.from(bytes) as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not generate certificate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
