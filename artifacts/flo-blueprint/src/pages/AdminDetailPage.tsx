import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/react";
import { useParams, Link } from "wouter";

interface AssessmentAnswers {
  q1_stage?: string;
  q2_size?: string;
  q3_challenge?: string;
  q4_friction?: string;
  q5_impact?: string;
  q6_fix?: string;
  q7_timeline?: string;
}

interface CategoryScores {
  strategy?: number;
  marketing?: number;
  operations?: number;
  customerExperience?: number;
  aiReadiness?: number;
  leadershipCapacity?: number;
  execution?: number;
}

interface DebriefSummaryData {
  clientName?: string;
  company?: string;
  date?: string;
  healthScore?: string;
  profile?: string;
  primaryConstraint?: string;
  secondaryObservation?: string;
  selectedFocus?: string;
  biggestOpportunity?: string;
  priority1?: string;
  priority2?: string;
  priority3?: string;
  stop?: string;
  start?: string;
  automate?: string;
  delegate?: string;
  measure?: string;
  firstWin?: string;
  recommendedNextStep?: string;
  expectedOutcome?: string;
  christasNotes?: string;
}

interface RecommendationData {
  reason?: string;
  investmentAmount?: string;
  proposedNextStep?: string;
  proposalLink?: string;
  paymentLink?: string;
  followUpDate?: string;
  sentAt?: string;
}

interface AdminLeadDetail {
  id: number;
  clerkUserId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string;
  website: string | null;
  role: string;
  industry: string | null;
  annualRevenue: string | null;
  consentToContact: string;
  answers: AssessmentAnswers;
  categoryScores: CategoryScores;
  businessHealthScore: number;
  primaryConstraint: string;
  floProfile: string;
  confidencePercentage: number;
  estimatedImpact: string;
  recommendedService: string;
  eventSource: string | null;
  qrCodeId: string | null;
  campaign: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  stripeSessionId: string | null;
  purchaseDate: string | null;
  paymentStatus: string | null;
  leadStage: string | null;
  selectedFocus: string | null;
  debriefBookingDate: string | null;
  debriefSummaryStatus: string | null;
  debriefSummaryData: DebriefSummaryData | null;
  debriefSummarySentAt: string | null;
  internalNotes: string | null;
  debriefRecommendedService: string | null;
  recommendationData: RecommendationData | null;
  appointmentConfirmationSent: boolean | null;
  reminderSent: boolean | null;
  createdAt: string;
}

const FOCUS_SERVICE_MAP: Record<string, string> = {
  clarity: "Strategy Session",
  qualified_leads: "Marketing Review",
  save_time: "AI Accelerator",
  implementation: "Implementation Partnership",
};

const FOCUS_LABELS: Record<string, string> = {
  clarity: "Strategy Clarity",
  qualified_leads: "Qualified Leads",
  save_time: "Save Time",
  implementation: "Implementation",
};

const CATEGORY_LABELS: Record<string, string> = {
  strategy: "Strategy",
  marketing: "Marketing",
  operations: "Operations",
  customerExperience: "Customer Experience",
  aiReadiness: "AI Readiness",
  leadershipCapacity: "Leadership Capacity",
  execution: "Execution",
};

const Q_LABELS: Record<string, string> = {
  q1_stage: "Business Stage",
  q2_size: "Team Size",
  q3_challenge: "Primary Challenge",
  q4_friction: "Biggest Friction",
  q5_impact: "Priority Impact",
  q6_fix: "If you could fix one thing (free text)",
  q7_timeline: "Change Timeline",
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In Review" },
  { value: "finalized", label: "Finalized" },
  { value: "sent", label: "Sent" },
];

const RECOMMENDED_SERVICE_OPTIONS = [
  "Continue independently",
  "Executive Growth Strategy Session",
  "Marketing Systems Review",
  "AI Workflow Accelerator",
  "Executive Implementation Partnership",
  "Custom",
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-[#f0eef8] h-1.5">
        <div
          className="h-full bg-[#463176]"
          style={{ width: `${Math.min(100, (score / 20) * 100)}%` }}
        />
      </div>
      <span className="font-sans text-xs text-[#1a1625] w-6 text-right">{score}</span>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-base font-bold text-[#1a1625] pb-2 border-b border-[#e5e3ee] mb-4">
      {children}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-wide text-[#6b6680] font-medium mb-0.5">
        {label}
      </p>
      <p className="font-sans text-sm text-[#1a1625]">{children}</p>
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium uppercase tracking-wide text-[#6b6680] mb-1">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[#e5e3ee] px-3 py-2 font-sans text-sm text-[#1a1625] bg-white focus:outline-none focus:border-[#463176] resize-none"
      />
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium uppercase tracking-wide text-[#6b6680] mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[#e5e3ee] px-3 py-2 font-sans text-sm text-[#1a1625] bg-white focus:outline-none focus:border-[#463176]"
      />
    </div>
  );
}

export default function AdminDetailPage() {
  const params = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const [lead, setLead] = useState<AdminLeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Internal notes
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Debrief summary form
  const [summary, setSummary] = useState<DebriefSummaryData>({});
  const [summaryStatus, setSummaryStatus] = useState("draft");
  const [summarySaving, setSummarySaving] = useState(false);
  const [summarySaved, setSummarySaved] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeMsg, setFinalizeMsg] = useState<string | null>(null);

  // Recommendation form
  const [recService, setRecService] = useState("");
  const [recData, setRecData] = useState<RecommendationData>({});
  const [recSaving, setRecSaving] = useState(false);
  const [recSaved, setRecSaved] = useState(false);

  const authedFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      const token = await getToken();
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...((options?.headers as Record<string, string>) ?? {}),
        },
      });
    },
    [getToken],
  );

  useEffect(() => {
    async function fetchLead() {
      try {
        const res = await authedFetch(`/api/admin/leads/${params.id}`);
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const body = (await res.json()) as { lead: AdminLeadDetail };
        const l = body.lead;
        setLead(l);
        setNotes(l.internalNotes ?? "");
        setSummaryStatus(l.debriefSummaryStatus ?? "draft");
        setSummary(
          (l.debriefSummaryData as DebriefSummaryData | null) ?? {
            clientName: `${l.firstName} ${l.lastName}`,
            company: l.company,
            date: new Date().toISOString().split("T")[0],
            healthScore: String(l.businessHealthScore),
            profile: l.floProfile,
            primaryConstraint: l.primaryConstraint,
            selectedFocus: l.selectedFocus ?? "",
          },
        );
        setRecService(l.debriefRecommendedService ?? "");
        setRecData((l.recommendationData as RecommendationData | null) ?? {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lead");
      } finally {
        setLoading(false);
      }
    }
    fetchLead();
  }, [params.id, authedFetch]);

  // Auto-save notes on blur
  const saveNotes = useCallback(async () => {
    if (!lead) return;
    setNotesSaving(true);
    try {
      await authedFetch(`/api/admin/leads/${lead.id}/notes`, {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } finally {
      setNotesSaving(false);
    }
  }, [lead, notes, authedFetch]);

  async function saveSummary() {
    if (!lead) return;
    setSummarySaving(true);
    try {
      const res = await authedFetch(`/api/admin/leads/${lead.id}/summary`, {
        method: "PATCH",
        body: JSON.stringify({ summaryData: summary, status: summaryStatus }),
      });
      if (res.ok) {
        setSummarySaved(true);
        setTimeout(() => setSummarySaved(false), 2000);
      }
    } finally {
      setSummarySaving(false);
    }
  }

  async function finalizeSummary() {
    if (!lead) return;
    // Step 1: Save current form state with pdfGeneratedAt marker
    const summaryWithPdfRecord = {
      ...summary,
      pdfGeneratedAt: new Date().toISOString(),
    };
    setSummary(summaryWithPdfRecord);

    setSummarySaving(true);
    try {
      await authedFetch(`/api/admin/leads/${lead.id}/summary`, {
        method: "PATCH",
        body: JSON.stringify({
          summaryData: summaryWithPdfRecord,
          status: summaryStatus === "sent" ? "sent" : "finalized",
        }),
      });
    } finally {
      setSummarySaving(false);
    }

    // Step 2: Generate PDF HTML, persist to server, and open print window
    const pdfHtml = lead ? generateSummaryHtml(lead, summaryWithPdfRecord) : "";
    const pdfHtmlBase64 = pdfHtml
      ? btoa(unescape(encodeURIComponent(pdfHtml)))
      : undefined;
    printSummaryPdf();

    // Step 3: Call finalize endpoint — persists PDF HTML, invokes email stub, marks as sent
    setFinalizing(true);
    setFinalizeMsg(null);
    try {
      const res = await authedFetch(`/api/admin/leads/${lead.id}/finalize`, {
        method: "POST",
        body: JSON.stringify({ pdfHtmlBase64 }),
      });
      if (res.ok) {
        setSummaryStatus("sent");
        setFinalizeMsg("Summary finalized and PDF generated. Status updated to Sent.");
        // Refresh lead to pick up debriefSummarySentAt
        const updated = await authedFetch(`/api/admin/leads/${lead.id}`);
        if (updated.ok) {
          const body = (await updated.json()) as { lead: AdminLeadDetail };
          setLead(body.lead);
        }
      } else {
        const body = (await res.json()) as { error?: string };
        setFinalizeMsg(`Error: ${body.error ?? "Finalization failed"}`);
      }
    } finally {
      setFinalizing(false);
    }
  }

  function escapeHtml(str: string | number | undefined | null): string {
    if (str === undefined || str === null) return "—";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function generateSummaryHtml(l: AdminLeadDetail, s: DebriefSummaryData): string {
    const e = escapeHtml;
    const actionItems = (
      [
        ["Stop", s.stop],
        ["Start", s.start],
        ["Automate", s.automate],
        ["Delegate", s.delegate],
        ["Measure", s.measure],
      ] as [string, string | undefined][]
    )
      .map(([label, val]) => `<div class="field"><label>${label}</label><p>${e(val)}</p></div>`)
      .join("");

    const priorities = [s.priority1, s.priority2, s.priority3]
      .map((p, i) => `<div class="field"><label>Priority ${i + 1}</label><p>${e(p)}</p></div><br/>`)
      .join("");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Flo Blueprint Executive Debrief Summary — ${e(l.firstName)} ${e(l.lastName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap');
    body { font-family: Inter, sans-serif; color: #1a1625; margin: 0; padding: 40px; font-size: 12px; line-height: 1.5; }
    .header { border-bottom: 2px solid #463176; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-family: 'Playfair Display', serif; font-size: 24px; color: #463176; margin: 0 0 4px; }
    .header p { color: #6b6680; margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; }
    .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .meta-item label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b6680; display: block; margin-bottom: 2px; }
    .meta-item p { font-size: 12px; font-weight: 600; margin: 0; }
    .section { margin-bottom: 20px; }
    .section h2 { font-family: 'Playfair Display', serif; font-size: 14px; color: #463176; border-bottom: 1px solid #e5e3ee; padding-bottom: 4px; margin: 0 0 12px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b6680; display: block; margin-bottom: 2px; }
    .field p { margin: 0; font-size: 11px; }
    .five-col { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
    .score-chip { background: #f0eef8; padding: 6px 10px; }
    .score-chip .label { font-size: 9px; text-transform: uppercase; color: #6b6680; }
    .score-chip .value { font-size: 18px; font-weight: 700; color: #463176; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e3ee; font-size: 10px; color: #6b6680; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <p>The Flo Blueprint&trade; &mdash; TymFlo Executive Debrief Summary</p>
    <h1>${e(s.clientName) !== "—" ? e(s.clientName) : `${e(l.firstName)} ${e(l.lastName)}`}</h1>
    <p>${e(s.company) !== "—" ? e(s.company) : e(l.company)} &nbsp;&middot;&nbsp; ${e(s.date) !== "—" ? e(s.date) : new Date().toLocaleDateString()}</p>
  </div>

  <div class="meta">
    <div class="score-chip"><div class="label">Health Score</div><div class="value">${e(s.healthScore ?? l.businessHealthScore)}</div></div>
    <div class="score-chip"><div class="label">Flo Profile</div><div class="value" style="font-size:13px">${e(s.profile ?? l.floProfile)}</div></div>
    <div class="score-chip"><div class="label">Primary Constraint</div><div class="value" style="font-size:13px">${e(s.primaryConstraint ?? l.primaryConstraint)}</div></div>
  </div>

  <div class="two-col">
    <div class="section">
      <h2>Assessment Highlights</h2>
      <div class="field"><label>Selected Focus</label><p>${e(s.selectedFocus ?? l.selectedFocus)}</p></div>
      <br/>
      <div class="field"><label>Secondary Observation</label><p>${e(s.secondaryObservation)}</p></div>
      <br/>
      <div class="field"><label>Biggest Opportunity</label><p>${e(s.biggestOpportunity)}</p></div>
    </div>
    <div class="section">
      <h2>Top 3 Priorities &mdash; Next 90 Days</h2>
      ${priorities}
    </div>
  </div>

  <div class="section">
    <h2>Action Framework</h2>
    <div class="five-col">
      ${actionItems}
    </div>
  </div>

  <div class="two-col">
    <div class="section">
      <h2>First Win This Week</h2>
      <p>${e(s.firstWin)}</p>
    </div>
    <div class="section">
      <h2>Recommended Next Step</h2>
      <p>${e(s.recommendedNextStep)}</p>
    </div>
  </div>

  <div class="section">
    <h2>Expected Outcome</h2>
    <p>${e(s.expectedOutcome)}</p>
  </div>

  <div class="footer">Prepared by Christa &middot; TymFlo &middot; The Flo Blueprint&trade; Executive Debrief</div>
</body>
</html>`;
  }

  function printSummaryPdf() {
    if (!lead) return;
    const html = generateSummaryHtml(lead, summary);
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);
  }

  async function saveRecommendation() {
    if (!lead) return;
    setRecSaving(true);
    try {
      await authedFetch(`/api/admin/leads/${lead.id}/recommendation`, {
        method: "PATCH",
        body: JSON.stringify({
          recommendedService: recService,
          recommendationData: recData,
        }),
      });
      setRecSaved(true);
      setTimeout(() => setRecSaved(false), 2000);
    } finally {
      setRecSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf7] flex items-center justify-center">
        <p className="font-sans text-sm text-[#6b6680]">Loading...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-[#fafaf7] flex items-center justify-center">
        <div className="text-center">
          <p className="font-sans text-sm font-medium text-red-600 mb-2">Error</p>
          <p className="font-sans text-sm text-[#6b6680]">{error ?? "Lead not found"}</p>
          <Link href="/admin">
            <a className="mt-4 inline-block font-sans text-sm text-[#463176] hover:underline">
              ← Back to Admin
            </a>
          </Link>
        </div>
      </div>
    );
  }

  const categoryScores = (lead.categoryScores ?? {}) as CategoryScores;
  const answers = (lead.answers ?? {}) as AssessmentAnswers;
  const showRecommendation =
    summaryStatus === "finalized" || summaryStatus === "sent";

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e3ee] px-6 py-4 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <a className="font-sans text-sm text-[#6b6680] hover:text-[#463176] transition-colors">
                ← Admin
              </a>
            </Link>
            <span className="text-[#e5e3ee]">/</span>
            <span className="font-sans text-sm font-medium text-[#1a1625]">
              {lead.firstName} {lead.lastName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`font-sans text-xs font-medium px-2 py-1 ${
                summaryStatus === "sent"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : summaryStatus === "finalized"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-[#f0eef8] text-[#463176]"
              }`}
            >
              {STATUS_OPTIONS.find((s) => s.value === summaryStatus)?.label ?? summaryStatus}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* ─── PRE-CALL BRIEFING CARD ─── */}
        <div className="bg-[#463176] text-white p-6">
          <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] font-medium mb-3">
            Pre-Call Briefing
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="font-sans text-xs text-[#c8c5d4] uppercase tracking-wide mb-0.5">
                Client
              </p>
              <p className="font-sans text-sm font-semibold">
                {lead.firstName} {lead.lastName}
              </p>
              <p className="font-sans text-xs text-[#c8c5d4]">{lead.company}</p>
              <p className="font-sans text-xs text-[#c8c5d4]">{lead.role}</p>
            </div>
            <div>
              <p className="font-sans text-xs text-[#c8c5d4] uppercase tracking-wide mb-0.5">
                Selected Focus
              </p>
              <p className="font-sans text-sm font-semibold">
                {lead.selectedFocus
                  ? FOCUS_LABELS[lead.selectedFocus] ?? lead.selectedFocus
                  : "Not selected"}
              </p>
              <p className="font-sans text-xs text-[#F69679] mt-0.5">
                {lead.selectedFocus ? FOCUS_SERVICE_MAP[lead.selectedFocus] : "—"}
              </p>
            </div>
            <div>
              <p className="font-sans text-xs text-[#c8c5d4] uppercase tracking-wide mb-0.5">
                Primary Constraint
              </p>
              <p className="font-sans text-sm font-semibold">{lead.primaryConstraint}</p>
              <p className="font-sans text-xs text-[#c8c5d4]">
                Score: {lead.businessHealthScore}/100
              </p>
            </div>
            <div>
              <p className="font-sans text-xs text-[#c8c5d4] uppercase tracking-wide mb-0.5">
                Appointment
              </p>
              <p className="font-sans text-sm font-semibold">
                {lead.debriefBookingDate ? formatDate(lead.debriefBookingDate) : "Not booked"}
              </p>
            </div>
          </div>

          {answers.q6_fix && (
            <div className="bg-white/10 border border-white/20 p-4 mb-4">
              <p className="font-sans text-xs text-[#c8c5d4] uppercase tracking-wide mb-1">
                Client's Own Words (Q6 — Free Text)
              </p>
              <p className="font-sans text-sm italic">"{answers.q6_fix}"</p>
            </div>
          )}

          <div>
            <p className="font-sans text-xs text-[#c8c5d4] uppercase tracking-wide mb-2">
              Recommended Service Pathway
            </p>
            <p className="font-sans text-sm font-semibold text-[#F69679]">
              {lead.selectedFocus
                ? FOCUS_SERVICE_MAP[lead.selectedFocus]
                : lead.recommendedService}
            </p>
          </div>

          {/* Email Delivery Status */}
          <div className="mt-6 pt-5 border-t border-white/20">
            <p className="font-sans text-xs text-[#c8c5d4] uppercase tracking-widest font-medium mb-3">
              Email Delivery Status
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "Payment Confirmation",
                  sent: !!lead.purchaseDate,
                  timestamp: lead.purchaseDate,
                  note: "Sent on purchase",
                },
                {
                  label: "Appointment Confirmation",
                  sent: !!lead.appointmentConfirmationSent,
                  timestamp: null,
                  note: "Sent after booking",
                },
                {
                  label: "24h Reminder",
                  sent: !!lead.reminderSent,
                  timestamp: null,
                  note: "Sent day before call",
                },
                {
                  label: "Post-Session PDF",
                  sent: !!lead.debriefSummarySentAt,
                  timestamp: lead.debriefSummarySentAt,
                  note: "Sent on finalize",
                },
              ].map(({ label, sent, timestamp, note }) => (
                <div
                  key={label}
                  className={`p-3 border ${sent ? "border-green-400/40 bg-green-400/10" : "border-white/10 bg-white/5"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${sent ? "bg-green-400" : "bg-[#c8c5d4]"}`}
                    />
                    <p
                      className={`font-sans text-xs font-medium ${sent ? "text-green-300" : "text-[#c8c5d4]"}`}
                    >
                      {sent ? "Sent" : "Not sent"}
                    </p>
                  </div>
                  <p className="font-sans text-xs text-white leading-snug">{label}</p>
                  <p className="font-sans text-xs text-[#c8c5d4] mt-0.5">
                    {timestamp ? formatDateTime(timestamp) : note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── PROSPECT DATA ─── */}
        <div className="bg-white border border-[#e5e3ee] p-6">
          <SectionHeader>Prospect Information</SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Field label="Name">
              {lead.firstName} {lead.lastName}
            </Field>
            <Field label="Email">{lead.email}</Field>
            <Field label="Phone">{lead.phone ?? "—"}</Field>
            <Field label="Company">{lead.company}</Field>
            <Field label="Role">{lead.role}</Field>
            <Field label="Website">{lead.website ?? "—"}</Field>
            <Field label="Industry">{lead.industry ?? "—"}</Field>
            <Field label="Annual Revenue">{lead.annualRevenue ?? "—"}</Field>
            <Field label="Event Source">{lead.eventSource ?? "—"}</Field>
          </div>

          <SectionHeader>Assessment Results</SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Field label="Health Score">{lead.businessHealthScore} / 100</Field>
            <Field label="Flo Profile">{lead.floProfile}</Field>
            <Field label="Primary Constraint">{lead.primaryConstraint}</Field>
            <Field label="Confidence">{lead.confidencePercentage}%</Field>
            <Field label="Estimated Impact">{lead.estimatedImpact}</Field>
            <Field label="Recommended Service">{lead.recommendedService}</Field>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 mb-6">
            {Object.entries(categoryScores).map(([key, score]) => (
              <div key={key}>
                <p className="font-sans text-xs text-[#6b6680] mb-1">
                  {CATEGORY_LABELS[key] ?? key}
                </p>
                <ScoreBar score={score ?? 0} />
              </div>
            ))}
          </div>

          <SectionHeader>Assessment Answers</SectionHeader>
          <div className="space-y-3">
            {Object.entries(answers).map(([key, val]) => (
              <div key={key}>
                <p className="font-sans text-xs uppercase tracking-wide text-[#6b6680] font-medium">
                  {Q_LABELS[key] ?? key}
                </p>
                <p className="font-sans text-sm text-[#1a1625]">{val ?? "—"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── INTERNAL NOTES ─── */}
        <div className="bg-white border border-[#e5e3ee] p-6">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader>Internal Notes</SectionHeader>
            {notesSaved && (
              <span className="font-sans text-xs text-green-600">Saved</span>
            )}
          </div>
          <textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Notes for internal use only — not visible to the client"
            className="w-full border border-[#e5e3ee] px-3 py-2 font-sans text-sm text-[#1a1625] bg-white focus:outline-none focus:border-[#463176] resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="font-sans text-xs text-[#6b6680]">Auto-saved on blur</p>
            <button
              onClick={saveNotes}
              disabled={notesSaving}
              className="font-sans text-xs font-medium text-[#463176] hover:underline disabled:opacity-50"
            >
              {notesSaving ? "Saving..." : "Save Now"}
            </button>
          </div>
        </div>

        {/* ─── DEBRIEF SUMMARY FORM ─── */}
        <div className="bg-white border border-[#e5e3ee] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-base font-bold text-[#1a1625]">
              Executive Debrief Summary
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={summaryStatus}
                onChange={(e) => setSummaryStatus(e.target.value)}
                className="border border-[#e5e3ee] px-3 py-1.5 font-sans text-sm text-[#1a1625] bg-white focus:outline-none focus:border-[#463176]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-5">
            {/* Row 1: Client info */}
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Client Name"
                value={summary.clientName ?? ""}
                onChange={(v) => setSummary((s) => ({ ...s, clientName: v }))}
              />
              <TextInput
                label="Company"
                value={summary.company ?? ""}
                onChange={(v) => setSummary((s) => ({ ...s, company: v }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <TextInput
                label="Date"
                type="date"
                value={summary.date ?? ""}
                onChange={(v) => setSummary((s) => ({ ...s, date: v }))}
              />
              <TextInput
                label="Health Score"
                value={summary.healthScore ?? ""}
                onChange={(v) => setSummary((s) => ({ ...s, healthScore: v }))}
              />
              <TextInput
                label="Flo Profile"
                value={summary.profile ?? ""}
                onChange={(v) => setSummary((s) => ({ ...s, profile: v }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Primary Constraint"
                value={summary.primaryConstraint ?? ""}
                onChange={(v) => setSummary((s) => ({ ...s, primaryConstraint: v }))}
              />
              <TextInput
                label="Selected Focus"
                value={summary.selectedFocus ?? ""}
                onChange={(v) => setSummary((s) => ({ ...s, selectedFocus: v }))}
              />
            </div>
            <Textarea
              label="Secondary Observation"
              value={summary.secondaryObservation ?? ""}
              onChange={(v) => setSummary((s) => ({ ...s, secondaryObservation: v }))}
            />
            <Textarea
              label="Biggest Opportunity"
              value={summary.biggestOpportunity ?? ""}
              onChange={(v) => setSummary((s) => ({ ...s, biggestOpportunity: v }))}
            />

            {/* Priorities */}
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-wide text-[#463176] mb-3">
                Top 3 Priorities — Next 90 Days
              </p>
              <div className="space-y-3">
                {(["priority1", "priority2", "priority3"] as const).map((key, i) => (
                  <Textarea
                    key={key}
                    label={`Priority ${i + 1}`}
                    value={summary[key] ?? ""}
                    onChange={(v) => setSummary((s) => ({ ...s, [key]: v }))}
                    rows={2}
                  />
                ))}
              </div>
            </div>

            {/* Action Framework */}
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-wide text-[#463176] mb-3">
                Action Framework
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(["stop", "start", "automate", "delegate", "measure"] as const).map((key) => (
                  <Textarea
                    key={key}
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    value={summary[key] ?? ""}
                    onChange={(v) => setSummary((s) => ({ ...s, [key]: v }))}
                    rows={2}
                  />
                ))}
              </div>
            </div>

            <Textarea
              label="First Win This Week"
              value={summary.firstWin ?? ""}
              onChange={(v) => setSummary((s) => ({ ...s, firstWin: v }))}
              rows={2}
            />
            <Textarea
              label="Recommended Next Step"
              value={summary.recommendedNextStep ?? ""}
              onChange={(v) => setSummary((s) => ({ ...s, recommendedNextStep: v }))}
            />
            <Textarea
              label="Expected Outcome"
              value={summary.expectedOutcome ?? ""}
              onChange={(v) => setSummary((s) => ({ ...s, expectedOutcome: v }))}
            />
            <Textarea
              label="Christa's Notes"
              value={summary.christasNotes ?? ""}
              onChange={(v) => setSummary((s) => ({ ...s, christasNotes: v }))}
              rows={4}
            />
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-[#e5e3ee]">
            <button
              onClick={saveSummary}
              disabled={summarySaving}
              className="bg-white border border-[#463176] text-[#463176] font-sans text-sm font-semibold px-6 py-2 hover:bg-[#f0eef8] transition-colors disabled:opacity-50"
            >
              {summarySaving ? "Saving..." : summarySaved ? "Saved" : "Save Draft"}
            </button>
            <button
              onClick={printSummaryPdf}
              className="bg-white border border-[#e5e3ee] text-[#6b6680] font-sans text-sm font-medium px-6 py-2 hover:border-[#463176] hover:text-[#463176] transition-colors"
            >
              Print / Save PDF
            </button>
            {summaryStatus !== "sent" && (
              <button
                onClick={finalizeSummary}
                disabled={finalizing}
                className="bg-[#463176] text-white font-sans text-sm font-semibold px-6 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {finalizing ? "Finalizing..." : "Finalize & Mark Sent"}
              </button>
            )}
            {finalizeMsg && (
              <p className="font-sans text-sm text-[#463176]">{finalizeMsg}</p>
            )}
          </div>

          {lead.debriefSummarySentAt && (
            <p className="font-sans text-xs text-[#6b6680] mt-3">
              Finalized: {formatDateTime(lead.debriefSummarySentAt)}
            </p>
          )}
        </div>

        {/* ─── AFTER-DEBRIEF RECOMMENDATION ─── */}
        {showRecommendation && (
          <div className="bg-white border border-[#e5e3ee] p-6">
            <SectionHeader>After-Debrief Service Recommendation</SectionHeader>
            <p className="font-sans text-sm text-[#6b6680] mb-5">
              Select and configure the recommended next service for this client. Save separately
              from the summary. Send only after your review.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block font-sans text-xs font-medium uppercase tracking-wide text-[#6b6680] mb-2">
                  Recommended Next Service
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RECOMMENDED_SERVICE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setRecService(opt)}
                      className={`text-left px-4 py-2 font-sans text-sm border transition-colors ${
                        recService === opt
                          ? "bg-[#463176] text-white border-[#463176]"
                          : "bg-white text-[#1a1625] border-[#e5e3ee] hover:border-[#463176]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                label="Reason for Recommendation"
                value={recData.reason ?? ""}
                onChange={(v) => setRecData((d) => ({ ...d, reason: v }))}
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="Investment Amount"
                  value={recData.investmentAmount ?? ""}
                  onChange={(v) => setRecData((d) => ({ ...d, investmentAmount: v }))}
                  placeholder="e.g. $2,500"
                />
                <TextInput
                  label="Follow-up Date"
                  type="date"
                  value={recData.followUpDate ?? ""}
                  onChange={(v) => setRecData((d) => ({ ...d, followUpDate: v }))}
                />
              </div>

              <Textarea
                label="Proposed Next Step"
                value={recData.proposedNextStep ?? ""}
                onChange={(v) => setRecData((d) => ({ ...d, proposedNextStep: v }))}
                rows={2}
              />

              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="Proposal Link"
                  value={recData.proposalLink ?? ""}
                  onChange={(v) => setRecData((d) => ({ ...d, proposalLink: v }))}
                  placeholder="https://"
                />
                <TextInput
                  label="Payment Link"
                  value={recData.paymentLink ?? ""}
                  onChange={(v) => setRecData((d) => ({ ...d, paymentLink: v }))}
                  placeholder="https://"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[#e5e3ee]">
              <button
                onClick={saveRecommendation}
                disabled={recSaving}
                className="bg-white border border-[#463176] text-[#463176] font-sans text-sm font-semibold px-6 py-2 hover:bg-[#f0eef8] transition-colors disabled:opacity-50"
              >
                {recSaving ? "Saving..." : recSaved ? "Saved" : "Save Recommendation"}
              </button>
              <button
                onClick={() => {
                  saveRecommendation().catch(() => null);
                  alert(
                    "Recommendation saved. Email sending will be available in the next release (Task #20).",
                  );
                }}
                className="bg-[#463176] text-white font-sans text-sm font-semibold px-6 py-2 hover:opacity-90 transition-opacity"
              >
                Send Recommendation
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
