import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { useAuthUser } from "@/lib/useAuthUser";
import { TymFloLogo } from "@/components/TymFloLogo";
import { loadState, saveState, CATEGORY_LABELS } from "@/lib/state";
import { DiagnosticResult, DIAGNOSIS_LABELS } from "@/lib/scoring";
import { FloProfile, getSecondaryNote } from "@/lib/profiles";
import { CATEGORY_BENCHMARKS, CITATION_ORDER } from "@/lib/benchmarks";
import { trackFunnelEvent } from "@/lib/trackEvent";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ScoreBar({
  label,
  score,
  delay,
  avg,
  top,
  citationIndex,
}: {
  label: string;
  score: number;
  delay: number;
  avg?: number;
  top?: number;
  citationIndex?: number;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), delay);
    return () => clearTimeout(t);
  }, [score, delay]);
  const color = score >= 70 ? "#22C55E" : score >= 50 ? "#463176" : "#EF4444";
  return (
    <div>
      <div className="flex justify-between font-sans text-sm mb-1.5">
        <span className="text-foreground">
          {label}
          {citationIndex !== undefined && (
            <sup className="text-muted-foreground ml-0.5 font-sans text-[10px]">[{citationIndex + 1}]</sup>
          )}
        </span>
        <span className="font-semibold" style={{ color }}>
          {Math.round(score)}%
        </span>
      </div>
      <div
        className="h-2 bg-muted rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(score)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${Math.round(score)}%`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: color,
            transition: "width 0.9s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
      {avg !== undefined && top !== undefined && (
        <div className="flex justify-between font-sans text-[11px] text-muted-foreground mt-1">
          <span>Avg: {avg}%</span>
          <span>Top: {top}%</span>
        </div>
      )}
    </div>
  );
}

function HealthGauge({ score }: { score: number }) {
  const color = score >= 70 ? "#22C55E" : score >= 50 ? "#EAB308" : "#EF4444";
  return (
    <div
      className="flex flex-col items-center"
      aria-label={`Business Health Score: ${score} out of 100`}
    >
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 314} 314`}
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-3xl font-bold text-foreground">{score}</span>
          <span className="font-sans text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <p className="font-sans text-sm text-muted-foreground mt-2">Business Health Score</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
  accent,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-6 flex flex-col justify-between">
      <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-3">{label}</p>
      <p
        className="font-serif text-3xl font-bold leading-none mb-1"
        style={{ color: accent || "var(--foreground)" }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="font-sans text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function LeakageChip({ level }: { level: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    Low: { bg: "#22C55E", text: "white" },
    Moderate: { bg: "#EAB308", text: "white" },
    High: { bg: "#F97316", text: "white" },
    Critical: { bg: "#EF4444", text: "white" },
  };
  const c = config[level] ?? config.Moderate;
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full font-sans text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      {level}
    </span>
  );
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user, isLoaded } = useAuthUser();
  const { signOut } = useClerk();
  const state = loadState();
  const diagnostic = state.diagnostic as DiagnosticResult | null;
  const profile = state.profile as FloProfile | null;
  const answers = state.answers;

  useEffect(() => {
    if (!diagnostic || !profile) setLocation("/");
  }, [diagnostic, profile]);

  useEffect(() => {
    if (!diagnostic || !profile) return;
    const lid = state.lead?.id;
    trackFunnelEvent("results_viewed", lid);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!diagnostic || !profile) return null;

  const primaryLabel = DIAGNOSIS_LABELS[diagnostic.primaryDiagnosis];
  const secondaryNote = getSecondaryNote(diagnostic);

  function handleSaveBlueprint() {
    if (!isLoaded) return;
    if (user) {
      if (state.lead?.company && state.lead?.clerkUserId === user.id) {
        setLocation("/report");
      } else {
        setLocation("/profile");
      }
    } else {
      setLocation("/sign-in");
    }
  }

  // Build roadmap nodes
  const currentStageLabel = answers.q1_stage || "Current Stage";
  const firstPriority = profile.priorities[0]?.title || "Address primary constraint";
  const roadmapNodes = [
    { label: "Current Stage", desc: currentStageLabel, highlight: false },
    { label: "Primary Constraint", desc: primaryLabel, highlight: false },
    { label: "Recommended Focus", desc: profile.focus.length > 80 ? profile.focus.slice(0, 78) + "…" : profile.focus, highlight: false },
    { label: "90-Day Action", desc: firstPriority.length > 70 ? firstPriority.slice(0, 68) + "…" : firstPriority, highlight: false },
    { label: "TymFlo Service", desc: profile.tymFloService, highlight: false },
    { label: "Less Work. More Flo.", desc: null, highlight: true },
  ];

  // Build citations list from category benchmarks (ordered)
  const citations = CITATION_ORDER.map((key, i) => ({
    index: i,
    key,
    label: CATEGORY_LABELS[key] || key,
    benchmark: CATEGORY_BENCHMARKS[key],
  }));

  return (
    <>
      <a
        href="#dashboard-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
      >
        Skip to content
      </a>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/60 px-6 md:px-12 py-5">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <a href="/" aria-label="TymFlo — return to homepage">
              <TymFloLogo variant="horizontal" className="h-7 w-auto" alt="TymFlo" />
            </a>
            <div className="flex items-center gap-4">
              {isLoaded && user && (
                <button
                  onClick={() => signOut({ redirectUrl: `${basePath}/` })}
                  className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign out
                </button>
              )}
              <span className="font-sans text-xs text-muted-foreground uppercase tracking-widest">
                Your Results
              </span>
            </div>
          </div>
        </header>

        <main id="dashboard-content" className="max-w-5xl mx-auto px-6 md:px-12 py-12 md:py-16">
          <div className="mb-12 md:mb-14">
            <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] mb-3 font-medium">
              The Flo Blueprint™
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              Your Business Growth Snapshot
            </h1>
          </div>

          {/* Row 1: Core 3 metric cards */}
          <section aria-label="Diagnostic summary" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Health score gauge */}
            <div className="bg-card border border-card-border rounded-2xl p-8 flex flex-col items-center text-center">
              <HealthGauge score={diagnostic.businessHealthScore} />
            </div>

            {/* Primary diagnosis */}
            <div className="bg-card border border-card-border rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  Primary Business Constraint
                </p>
                <h2 className="font-serif text-2xl font-bold text-foreground leading-tight">
                  {primaryLabel}
                </h2>
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  Confidence
                </p>
                <p className="font-serif text-3xl font-bold" style={{ color: "#463176" }}>
                  {diagnostic.confidence}%
                </p>
              </div>
            </div>

            {/* Profile */}
            <div
              className="rounded-2xl p-8 flex flex-col justify-between text-white"
              style={{ background: "#463176" }}
            >
              <div>
                <p className="font-sans text-xs uppercase tracking-widest text-white/60 mb-3">
                  Flo Blueprint Profile
                </p>
                <h2 className="font-serif text-2xl font-bold leading-tight">{profile.name}</h2>
                <p className="font-sans text-sm text-white/80 mt-3 leading-relaxed line-clamp-3">
                  {profile.description}
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="font-sans text-xs text-white/60 uppercase tracking-widest mb-1">
                  Recommended Focus
                </p>
                <p className="font-sans text-sm text-white/90">{profile.focus}</p>
              </div>
            </div>
          </section>

          {/* Row 2: Additional metric cards */}
          <section
            aria-label="Additional business metrics"
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6"
          >
            <MetricCard
              label="Growth Readiness Score"
              value={`${diagnostic.growthReadiness}%`}
              subtitle="Composite readiness for scalable growth"
              accent={diagnostic.growthReadiness >= 65 ? "#22C55E" : diagnostic.growthReadiness >= 45 ? "#463176" : "#EF4444"}
            />
            <MetricCard
              label="AI Opportunity Score"
              value={`${diagnostic.aiOpportunityScore}%`}
              subtitle="Potential value of strategic AI adoption"
              accent="#463176"
            />
            <MetricCard
              label="Operational Efficiency Score"
              value={`${diagnostic.operationalEfficiency}%`}
              subtitle="Current process throughput effectiveness"
              accent={diagnostic.operationalEfficiency >= 65 ? "#22C55E" : diagnostic.operationalEfficiency >= 45 ? "#EAB308" : "#EF4444"}
            />
          </section>

          {/* Callout chips — hours lost & revenue leakage */}
          <div className="flex flex-wrap gap-3 mb-8" aria-label="Key business signals">
            <div className="bg-card border border-card-border rounded-full px-5 py-2.5 flex items-center gap-3">
              <span className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
                Est. Hours Lost Weekly
              </span>
              <span className="font-sans text-sm font-semibold text-foreground">
                {diagnostic.estimatedHoursLostWeekly}
              </span>
            </div>
            <div className="bg-card border border-card-border rounded-full px-5 py-2.5 flex items-center gap-3">
              <span className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
                Revenue Leakage Level
              </span>
              <LeakageChip level={diagnostic.revenueLeakageLevel} />
            </div>
          </div>

          {/* Diagnostic evidence */}
          {diagnostic.evidenceBullets.length > 0 && (
            <section
              aria-labelledby="evidence-heading"
              className="bg-card border border-card-border rounded-2xl p-8 mb-8"
            >
              <h2
                id="evidence-heading"
                className="font-serif text-xl font-semibold text-foreground mb-2"
              >
                Diagnostic Evidence
              </h2>
              <p className="font-sans text-sm text-muted-foreground mb-6">
                Why this constraint surfaced from your responses:
              </p>
              <ul className="space-y-3" aria-label="Evidence supporting your diagnosis">
                {diagnostic.evidenceBullets.map((bullet, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-4 font-sans text-sm text-foreground/80 leading-relaxed"
                  >
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: "#F69679" }}
                      aria-hidden="true"
                    />
                    {bullet}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Secondary observation + contradictions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border border-card-border rounded-2xl p-8">
              <h2 className="font-serif text-lg font-semibold text-foreground mb-3">
                Secondary Observation
              </h2>
              <p className="font-sans text-sm text-foreground/80 leading-relaxed">{secondaryNote}</p>
            </div>

            {diagnostic.contradictions.length > 0 ? (
              <div className="bg-card border border-card-border rounded-2xl p-8">
                <h2 className="font-serif text-lg font-semibold text-foreground mb-3">
                  Pattern Tensions Detected
                </h2>
                <div className="space-y-3">
                  {diagnostic.contradictions.slice(0, 2).map((c, i) => (
                    <p key={i} className="font-sans text-sm text-foreground/80 leading-relaxed">
                      {c}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-card border border-card-border rounded-2xl p-8">
                <h2 className="font-serif text-lg font-semibold text-foreground mb-3">
                  Signal Alignment
                </h2>
                <p className="font-sans text-sm text-foreground/80 leading-relaxed">
                  Your responses showed strong alignment across all seven diagnostic dimensions. The
                  primary constraint is clear, and there are no significant conflicting signals —
                  which means the recommended path forward is straightforward to prioritize.
                </p>
              </div>
            )}
          </div>

          {/* Category breakdown with peer benchmarks */}
          <section
            aria-labelledby="scores-heading"
            className="bg-card border border-card-border rounded-2xl p-8 mb-8"
          >
            <h2
              id="scores-heading"
              className="font-serif text-xl font-semibold text-foreground mb-1"
            >
              Category Breakdown
            </h2>
            <p className="font-sans text-sm text-muted-foreground mb-6">
              Performance index across seven business dimensions — with peer benchmarks
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-7">
              {CITATION_ORDER.map((key, i) => {
                const score = diagnostic.categoryScores[key as keyof typeof diagnostic.categoryScores];
                const bm = CATEGORY_BENCHMARKS[key];
                return (
                  <ScoreBar
                    key={key}
                    label={CATEGORY_LABELS[key] || key}
                    score={score}
                    delay={i * 120}
                    avg={bm?.avg}
                    top={bm?.top}
                    citationIndex={i}
                  />
                );
              })}
            </div>
            <p className="font-sans text-xs text-muted-foreground mt-6 pt-4 border-t border-border">
              Green (70–100): Strength area &nbsp;&middot;&nbsp; Purple (50–69): Growth opportunity
              &nbsp;&middot;&nbsp; Red (0–49): Priority focus
            </p>

            {/* Benchmark footnotes */}
            <div className="mt-4 space-y-1">
              {citations.map(({ index, benchmark }) => (
                <p key={index} className="font-sans text-[11px] text-muted-foreground leading-snug">
                  <sup>[{index + 1}]</sup> {benchmark.fullCitation}
                </p>
              ))}
            </div>
          </section>

          {/* Priority preview + CTA */}
          <section
            aria-labelledby="next-steps-heading"
            className="bg-card border border-card-border rounded-2xl p-8 mb-8"
          >
            <h2
              id="next-steps-heading"
              className="font-serif text-xl font-semibold text-foreground mb-4"
            >
              Recommended Solution
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="flex-1">
                <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  TymFlo Service
                </p>
                <p className="font-sans text-base font-semibold text-foreground mb-4">
                  {profile.tymFloService}
                </p>
                <p className="font-sans text-sm text-foreground/70 leading-relaxed">
                  {profile.whatToDoNext}
                </p>
              </div>
              <button
                onClick={handleSaveBlueprint}
                data-testid="button-unlock-report"
                className="flex-shrink-0 px-7 py-3.5 font-sans font-semibold text-white rounded-full transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary min-h-[48px] whitespace-nowrap"
                style={{ background: "#F69679" }}
              >
                Save My Blueprint
              </button>
            </div>
          </section>

          {/* Visual Implementation Roadmap — 6 nodes */}
          <section aria-labelledby="roadmap-heading" className="mb-8 print:hidden">
            <div
              className="border border-border rounded-2xl p-8"
              style={{ background: "rgba(70,49,118,0.03)" }}
            >
              <h2
                id="roadmap-heading"
                className="font-serif text-xl font-bold text-foreground mb-2"
              >
                Your Implementation Roadmap
              </h2>
              <p className="font-sans text-sm text-muted-foreground mb-8">
                From where you are today to Less Work. More Flo.
              </p>

              {/* Desktop: horizontal */}
              <div className="hidden md:flex items-start">
                {roadmapNodes.map((node, i, arr) => (
                  <div key={node.label} className="flex items-start flex-1 min-w-0">
                    <div className="flex flex-col items-center text-center min-w-0 flex-1 px-1">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-sans text-sm font-bold mb-3 flex-shrink-0"
                        style={{
                          background: node.highlight ? "#F69679" : "#463176",
                          color: "white",
                        }}
                        aria-hidden="true"
                      >
                        {i + 1}
                      </div>
                      <p
                        className="font-sans text-[10px] font-semibold uppercase tracking-widest mb-1.5 leading-tight"
                        style={{ color: node.highlight ? "#F69679" : "#463176" }}
                      >
                        {node.label}
                      </p>
                      {node.desc && (
                        <p className="font-sans text-[11px] text-muted-foreground leading-snug max-w-[110px]">
                          {node.desc}
                        </p>
                      )}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex items-center mt-4 flex-shrink-0" aria-hidden="true">
                        <div className="h-px w-4 bg-border" />
                        <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                          <path
                            d="M1 1L7 6L1 11"
                            stroke="hsl(var(--border))"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile: vertical */}
              <div className="flex flex-col md:hidden gap-0">
                {roadmapNodes.map((node, i, arr) => (
                  <div key={node.label} className="flex flex-col">
                    <div className="flex items-start gap-4 py-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-sans text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{
                          background: node.highlight ? "#F69679" : "#463176",
                          color: "white",
                        }}
                        aria-hidden="true"
                      >
                        {i + 1}
                      </div>
                      <div>
                        <p
                          className="font-sans text-xs font-semibold uppercase tracking-widest mb-0.5"
                          style={{ color: node.highlight ? "#F69679" : "#463176" }}
                        >
                          {node.label}
                        </p>
                        {node.desc && (
                          <p className="font-sans text-xs text-muted-foreground leading-snug">
                            {node.desc}
                          </p>
                        )}
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="ml-4 pl-[14px] border-l border-border h-4" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Print-only static roadmap — no transitions, visible only when printing */}
          <section aria-label="Your Implementation Roadmap" className="hidden print:block mb-8">
            <div
              style={{
                border: "1px solid #e2e0e8",
                borderRadius: "0",
                padding: "24px",
                background: "rgba(70,49,118,0.03)",
                breakInside: "avoid",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "18px",
                  fontWeight: "700",
                  marginBottom: "4px",
                  color: "#1a1a2e",
                }}
              >
                Your Implementation Roadmap
              </h2>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "20px",
                }}
              >
                From where you are today to Less Work. More Flo.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {roadmapNodes.map((node, i, arr) => (
                  <div key={node.label} style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "8px 0" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: node.highlight ? "#F69679" : "#463176",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          fontWeight: "700",
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <p
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "10px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: node.highlight ? "#F69679" : "#463176",
                            marginBottom: "2px",
                          }}
                        >
                          {node.label}
                        </p>
                        {node.desc && (
                          <p
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "11px",
                              color: "#6b7280",
                              lineHeight: "1.4",
                            }}
                          >
                            {node.desc}
                          </p>
                        )}
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div
                        style={{
                          marginLeft: "14px",
                          paddingLeft: "14px",
                          borderLeft: "1px solid #e2e0e8",
                          height: "12px",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Save Blueprint CTA section */}
          <section
            aria-labelledby="save-blueprint-heading"
            className="border-t border-border pt-16"
            id="unlock-report"
          >
            <div className="max-w-2xl">
              <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] mb-3 font-medium">
                Next Step
              </p>
              <h2
                id="save-blueprint-heading"
                className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3"
              >
                Save Your Executive Report
              </h2>
              <p className="font-sans text-foreground/70 mb-8 leading-relaxed">
                Create your account to access your full consulting-grade executive report — including
                your complete diagnostic breakdown, prioritized action plan, and Flo Blueprint
                implementation roadmap.
              </p>

              <div className="bg-card border border-card-border rounded-2xl p-8 mb-6">
                <div className="space-y-4 mb-8">
                  {[
                    "Full consulting-grade executive report with prioritized recommendations",
                    "Your complete diagnostic breakdown across all seven business dimensions",
                    "Personalized implementation roadmap based on your Flo Blueprint profile",
                    "Access to your report from any device, any time",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span
                        className="mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "#463176" }}
                        aria-hidden="true"
                      >
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <p className="font-sans text-sm text-foreground/80">{item}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSaveBlueprint}
                  data-testid="button-save-blueprint"
                  className="w-full px-8 py-4 font-sans font-semibold text-white rounded-full transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary min-h-[52px]"
                  style={{ background: "#463176" }}
                >
                  {isLoaded && user ? "Complete Your Profile" : "Save My Blueprint"}
                </button>

                <p className="font-sans text-xs text-muted-foreground text-center mt-4">
                  Continue with Google, Microsoft, or your email — no password required.
                </p>
                <p className="font-sans text-xs text-muted-foreground text-center mt-2">
                  By continuing, you agree to our{" "}
                  <a href="/terms" className="underline hover:text-foreground transition-colors">
                    Terms &amp; Conditions
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="underline hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-border/60 px-6 md:px-12 py-6 mt-8">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <TymFloLogo variant="horizontal" className="h-6 w-auto" alt="TymFlo" />
            <p className="font-sans text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} TymFlo. All rights reserved.
            </p>
            <nav aria-label="Legal" className="flex items-center gap-4">
              <a
                href="/terms"
                className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms &amp; Conditions
              </a>
              <a
                href="/privacy"
                className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="https://tymflo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                tymflo.com
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
