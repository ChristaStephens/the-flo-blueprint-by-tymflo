import PDFDocument from "pdfkit";

export interface DebriefSummaryData {
  firstName: string;
  lastName?: string;
  company?: string;
  floProfile?: string;
  businessHealthScore?: number;
  primaryConstraint?: string;
  selectedFocus?: string;
  sessionDate?: string;
  firstWin?: string;
  rootCause?: string;
  strategicInsights?: string;
  recommendedNextStep?: string;
  actionItems?: string;
  notes?: string;
  recommendedService?: string;
  [key: string]: unknown;
}

const PURPLE = "#463176";
const TANGERINE = "#F69679";
const GRAY = "#6b6680";
const LIGHT_GRAY = "#e8e5f0";

const FOCUS_LABELS: Record<string, string> = {
  clarity: "Gaining Strategic Clarity",
  qualified_leads: "Generating More Qualified Leads",
  save_time: "Recovering Time and Reducing Friction",
  implementation: "Full Implementation Support",
};

function formatField(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

export function generateDebriefSummaryPdf(data: DebriefSummaryData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56, size: "LETTER" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 112;

    // ── Header bar ──────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 72).fill(PURPLE);
    doc.fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("THE FLO BLUEPRINT\u2122", 56, 20, { lineBreak: false });
    doc.fillColor(TANGERINE)
      .font("Helvetica")
      .fontSize(9)
      .text("EXECUTIVE DEBRIEF SUMMARY", 56, 44, { lineBreak: false });
    doc.fillColor("#ffffff")
      .font("Helvetica")
      .fontSize(9)
      .text("by TymFlo \u2022 tymflo.com", 56, 54, { lineBreak: false });

    doc.moveDown(0);
    doc.y = 90;

    // ── Client info block ────────────────────────────────────────────────────
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
    doc.fillColor(PURPLE).font("Helvetica-Bold").fontSize(20)
      .text(fullName, 56, doc.y);
    if (data.company) {
      doc.fillColor(GRAY).font("Helvetica").fontSize(11)
        .text(data.company, 56, doc.y + 2);
    }

    // Session meta: score, profile, focus, date
    doc.moveDown(0.6);
    const metaY = doc.y;
    const colW = pageWidth / 4;

    const metaItems: [string, string][] = [
      ["BUSINESS HEALTH SCORE", data.businessHealthScore != null ? `${data.businessHealthScore} / 100` : "—"],
      ["FLO PROFILE", formatField(data.floProfile) || "—"],
      ["FOCUS AREA", data.selectedFocus ? (FOCUS_LABELS[data.selectedFocus] ?? data.selectedFocus) : "—"],
      ["SESSION DATE", data.sessionDate ? new Date(data.sessionDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"],
    ];

    metaItems.forEach(([label, value], i) => {
      const x = 56 + i * colW;
      doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(7)
        .text(label, x, metaY, { width: colW - 8, lineBreak: false });
      doc.fillColor(PURPLE).font("Helvetica-Bold").fontSize(11)
        .text(value, x, metaY + 12, { width: colW - 8 });
    });

    doc.y = metaY + 42;

    // Divider
    doc.moveTo(56, doc.y).lineTo(56 + pageWidth, doc.y).strokeColor(LIGHT_GRAY).lineWidth(1).stroke();
    doc.moveDown(0.8);

    // ── Section helper ────────────────────────────────────────────────────────
    function section(title: string, body: string) {
      if (!body.trim()) return;
      doc.fillColor(PURPLE).font("Helvetica-Bold").fontSize(10)
        .text(title.toUpperCase(), 56, doc.y, { characterSpacing: 0.8 });
      doc.moveDown(0.25);
      doc.fillColor("#1a1625").font("Helvetica").fontSize(11)
        .text(body, 56, doc.y, { width: pageWidth, lineGap: 3 });
      doc.moveDown(0.9);
    }

    function accentSection(title: string, body: string) {
      if (!body.trim()) return;
      const startY = doc.y;
      doc.rect(56, startY, pageWidth, 14).fill("#f0eef8");
      doc.fillColor(PURPLE).font("Helvetica-Bold").fontSize(9)
        .text(title.toUpperCase(), 64, startY + 3, { characterSpacing: 0.6, lineBreak: false });
      doc.y = startY + 18;
      doc.fillColor("#1a1625").font("Helvetica").fontSize(11)
        .text(body, 56, doc.y, { width: pageWidth, lineGap: 3 });
      doc.moveDown(0.9);
    }

    // ── Content sections ─────────────────────────────────────────────────────
    if (data.primaryConstraint) {
      section("Primary Constraint Identified", data.primaryConstraint);
    }

    if (data.rootCause) {
      section("Root Cause Analysis", data.rootCause);
    }

    if (data.strategicInsights) {
      section("Strategic Insights", data.strategicInsights);
    }

    if (data.firstWin) {
      accentSection("Your First Win This Week", data.firstWin);
    }

    if (data.recommendedNextStep) {
      accentSection("Recommended Next Step", data.recommendedNextStep);
    }

    if (data.actionItems) {
      section("Action Plan", data.actionItems);
    }

    if (data.recommendedService) {
      section("Recommended Next Service", data.recommendedService);
    }

    if (data.notes) {
      section("Session Notes", data.notes);
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 48;
    doc.moveTo(56, footerY).lineTo(56 + pageWidth, footerY).strokeColor(LIGHT_GRAY).lineWidth(0.5).stroke();
    doc.fillColor(GRAY).font("Helvetica").fontSize(8)
      .text(
        "This document is confidential and prepared exclusively for the client named above. \u00A9 TymFlo \u2022 tymflo.com \u2022 hello@tymflo.com",
        56,
        footerY + 10,
        { width: pageWidth, align: "center" },
      );

    doc.end();
  });
}
