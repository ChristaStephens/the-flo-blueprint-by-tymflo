import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { useAuthUser } from "@/lib/useAuthUser";
import { TymFloLogo } from "@/components/TymFloLogo";
import { loadState, CATEGORY_LABELS } from "@/lib/state";
import { DiagnosticResult, DIAGNOSIS_LABELS } from "@/lib/scoring";
import { FloProfile, getSecondaryNote } from "@/lib/profiles";
import { CATEGORY_BENCHMARKS, CITATION_ORDER } from "@/lib/benchmarks";
import { trackFunnelEvent } from "@/lib/trackEvent";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] mb-2 font-medium">
      {children}
    </p>
  );
}

function WhyThisScore({
  categoryKey,
  score,
}: {
  categoryKey: string;
  score: number;
}) {
  const [open, setOpen] = useState(false);
  const bm = CATEGORY_BENCHMARKS[categoryKey];
  const citationIndex = CITATION_ORDER.indexOf(categoryKey);
  if (!bm) return null;

  const scoreStatus =
    score >= 70 ? "strength area" : score >= 50 ? "growth opportunity" : "priority focus";

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="font-sans text-xs text-[#463176] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#463176] focus-visible:rounded"
        aria-expanded={open}
        aria-label={`Why this score for ${CATEGORY_LABELS[categoryKey] || categoryKey}`}
      >
        {open ? "Hide" : "Why this score"} {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="mt-3 p-4 bg-muted/40 border border-border rounded-xl space-y-3">
          <div>
            <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-1">
              What this means
            </p>
            <p className="font-sans text-sm text-foreground/80 leading-relaxed">
              Your score of {Math.round(score)}% places this category as a{" "}
              <strong>{scoreStatus}</strong> relative to your peer group (avg: {bm.avg}%, top: {bm.top}%). {bm.interpretation}
            </p>
          </div>
          <div>
            <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-1">
              What top performers do differently
            </p>
            <p className="font-sans text-sm text-foreground/80 leading-relaxed">{bm.topPerformerNote}</p>
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-0.5">
                Time to improve
              </p>
              <p className="font-sans text-sm font-semibold text-foreground">{bm.timeToImprove}</p>
            </div>
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-0.5">
                Peer average
              </p>
              <p className="font-sans text-sm font-semibold text-foreground">{bm.avg}%</p>
            </div>
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-0.5">
                Top performer
              </p>
              <p className="font-sans text-sm font-semibold text-foreground">{bm.top}%</p>
            </div>
            {citationIndex >= 0 && (
              <div>
                <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-0.5">
                  Source
                </p>
                <p className="font-sans text-sm text-muted-foreground">
                  <sup>[{citationIndex + 1}]</sup> {bm.source}, {bm.year}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreRow({
  label,
  score,
  categoryKey,
}: {
  label: string;
  score: number;
  categoryKey: string;
}) {
  const color = score >= 70 ? "#22C55E" : score >= 50 ? "#EAB308" : "#EF4444";
  const status = score >= 70 ? "Strength" : score >= 50 ? "Developing" : "Priority";
  const bm = CATEGORY_BENCHMARKS[categoryKey];
  const citationIndex = CITATION_ORDER.indexOf(categoryKey);

  return (
    <tr className="border-b border-border align-top">
      <td className="py-3 pr-4">
        <p className="font-sans text-sm text-foreground">
          {label}
          {citationIndex >= 0 && (
            <sup className="text-muted-foreground ml-0.5 text-[10px]">[{citationIndex + 1}]</sup>
          )}
        </p>
        <WhyThisScore categoryKey={categoryKey} score={score} />
      </td>
      <td className="py-3 w-32 hidden md:table-cell align-top">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.round(score)}%`, background: color }}
          />
        </div>
        {bm && (
          <div className="flex justify-between font-sans text-[10px] text-muted-foreground mt-1">
            <span>Avg: {bm.avg}%</span>
            <span>Top: {bm.top}%</span>
          </div>
        )}
      </td>
      <td className="py-3 font-sans text-sm font-semibold text-right align-top" style={{ color }}>
        {Math.round(score)}%
      </td>
      <td className="py-3 font-sans text-xs text-muted-foreground text-right pl-4 hidden sm:table-cell align-top">
        {status}
      </td>
    </tr>
  );
}


const NEXT_STEP_SERVICES = [
  {
    id: "executive-growth-strategy",
    category: "Strategy",
    title: "Executive Growth Strategy Session",
    description:
      "A deep-dive strategic review with a TymFlo consultant focused on your highest-leverage growth opportunities. We build your 90-day execution roadmap together.",
    ctaText: "Book This Session",
    type: "stripe" as const,
  },
  {
    id: "marketing-systems-review",
    category: "Marketing",
    title: "Marketing Systems Review",
    description:
      "A comprehensive audit of your marketing systems, funnel, and messaging with a prioritized optimization plan you can implement immediately.",
    ctaText: "Book This Review",
    type: "stripe" as const,
  },
  {
    id: "ai-workflow-accelerator",
    category: "AI & Automation",
    title: "AI Workflow Accelerator",
    description:
      "Identify and implement AI automation opportunities that eliminate manual work, reduce decision fatigue, and compound your output over time.",
    ctaText: "Start the Accelerator",
    type: "stripe" as const,
  },
  {
    id: "executive-implementation-partnership",
    category: "Partnership",
    title: "Executive Implementation Partnership",
    description:
      "A long-term strategic partnership for founders ready to rebuild their operations with TymFlo embedded as your implementation team.",
    ctaText: "Explore Partnership",
    type: "calendly" as const,
  },
];

const CONTACT_EMAIL = "hello@tymflo.com";

const CHECKOUT_ERROR_AUTO_CLEAR_MS = 30_000;

function CheckoutErrorBlock({
  message,
  testIdPrefix,
  onRetry,
  onDismiss,
}: {
  message: string;
  testIdPrefix: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, CHECKOUT_ERROR_AUTO_CLEAR_MS);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <div
      role="alert"
      data-testid={`${testIdPrefix}-error-block`}
      className="mb-4 p-4 border border-red-200 rounded-xl bg-red-50 relative"
    >
      <button
        onClick={onDismiss}
        data-testid={`${testIdPrefix}-dismiss`}
        aria-label="Dismiss error"
        className="absolute top-3 right-3 text-red-400 hover:text-red-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-400 focus-visible:rounded leading-none"
      >
        &times;
      </button>
      <p className="font-sans text-sm font-semibold text-red-700 mb-1">
        Checkout unavailable
      </p>
      <p className="font-sans text-xs text-red-600 mb-3 leading-relaxed pr-5">
        {message}
      </p>
      <div className="flex flex-wrap gap-3 items-center">
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=Executive%20Debrief%20Purchase`}
          data-testid={`${testIdPrefix}-contact-link`}
          className="font-sans text-xs font-semibold text-[#463176] underline underline-offset-2 hover:opacity-80 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#463176] focus-visible:rounded"
        >
          Contact us instead
        </a>
        <span className="font-sans text-xs text-muted-foreground" aria-hidden="true">
          —
        </span>
        <button
          onClick={onRetry}
          className="font-sans text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#463176] focus-visible:rounded"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  leadId,
  priceDisplay,
}: {
  service: (typeof NEXT_STEP_SERVICES)[number];
  leadId: string | null;
  priceDisplay?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calendlyUrl = import.meta.env.VITE_CALENDLY_URL as string | undefined;

  async function handleStripeCheckout() {
    setLoading(true);
    setError(null);
    try {
      const origin = window.location.origin;
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const successUrl = `${origin}${base}/report?service_purchased=${service.id}`;
      const cancelUrl = `${origin}${base}/report`;

      const resp = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          leadId: leadId ?? null,
          successUrl,
          cancelUrl,
        }),
      });
      const data = (await resp.json()) as { url?: string; error?: string };
      if (!resp.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not connect to checkout. Please try again.");
      setLoading(false);
    }
  }

  function handleCalendly() {
    const url = calendlyUrl || "https://calendly.com/tymflo";
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const handleClick = service.type === "stripe" ? handleStripeCheckout : handleCalendly;

  return (
    <div className="bg-white border border-border rounded-2xl p-8 flex flex-col">
      <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] mb-3 font-medium">
        {service.category}
      </p>
      <h3 className="font-serif text-lg font-bold text-foreground mb-3 leading-tight">
        {service.title}
      </h3>
      <p className="font-sans text-sm text-foreground/70 leading-relaxed mb-4 flex-1">
        {service.description}
      </p>
      {priceDisplay && (
        <p className="font-serif text-2xl font-bold text-foreground mb-6">
          {priceDisplay}
        </p>
      )}
      {error && (
        <CheckoutErrorBlock
          message={error}
          testIdPrefix={`service-card-${service.id}`}
          onRetry={handleStripeCheckout}
          onDismiss={() => setError(null)}
        />
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        data-testid={`button-purchase-${service.id}`}
        className="w-full px-6 py-3 font-sans text-sm font-semibold border-2 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
        style={{
          borderColor: "#463176",
          color: loading ? "#463176" : "#fff",
          background: loading ? "transparent" : "#463176",
        }}
        aria-label={`${service.ctaText} — ${service.title}`}
      >
        {loading ? "Redirecting to checkout..." : service.ctaText}
      </button>
    </div>
  );
}

function PrintRoadmap({
  nodes,
}: {
  nodes: Array<{ label: string; desc: string | null; highlight: boolean }>;
}) {
  return (
    <section aria-labelledby="print-roadmap-heading" className="mb-12">
      <SectionLabel>Implementation Roadmap</SectionLabel>
      <h2
        id="print-roadmap-heading"
        className="font-serif text-2xl font-bold text-foreground mb-2 leading-tight"
      >
        Your Path Forward
      </h2>
      <p className="font-sans text-sm text-muted-foreground mb-8">
        From where you are today to Less Work. More Flo.
      </p>
      <ol
        className="border border-border overflow-hidden"
        style={{
          background: "rgba(70,49,118,0.03)",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        }}
        aria-label="Implementation Roadmap steps"
      >
        {nodes.map((node, i) => (
          <li
            key={node.label}
            className="flex items-start gap-5 p-5 border-b border-border last:border-b-0"
            style={
              node.highlight
                ? {
                    background: "rgba(246,150,121,0.10)",
                    printColorAdjust: "exact",
                    WebkitPrintColorAdjust: "exact",
                  }
                : undefined
            }
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-sans text-sm font-bold flex-shrink-0 mt-0.5"
              style={{
                background: node.highlight ? "#F69679" : "#463176",
                color: "white",
                printColorAdjust: "exact",
                WebkitPrintColorAdjust: "exact",
              }}
              aria-hidden="true"
            >
              {i + 1}
            </div>
            <div className="pt-0.5">
              <p
                className="font-sans text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: node.highlight ? "#F69679" : "#463176" }}
              >
                {node.label}
              </p>
              {node.desc && (
                <p className="font-sans text-sm leading-snug" style={{ color: "rgba(0,0,0,0.70)" }}>
                  {node.desc}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ChooseNextStep({ leadId }: { leadId: string | null }) {
  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: { products?: Array<{ id: string; priceDisplay: string }> }) => {
        if (data.products) {
          const map: Record<string, string> = {};
          for (const p of data.products) {
            map[p.id] = p.priceDisplay;
          }
          setPrices(map);
        }
      })
      .catch(() => {
        // Non-fatal — cards render without a price if the fetch fails
      });
  }, []);

  return (
    <section aria-labelledby="next-step-heading" className="mb-12 no-print">
      <SectionLabel>TymFlo Services</SectionLabel>
      <h2
        id="next-step-heading"
        className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight"
      >
        Choose Your Next Step
      </h2>
      <p className="font-sans text-foreground/70 leading-relaxed mb-8 max-w-2xl">
        Your Blueprint has identified where to focus. Select the service that best matches your
        highest-priority constraint and begin building momentum today.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {NEXT_STEP_SERVICES.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            leadId={leadId}
            priceDisplay={service.type === "stripe" ? prices[service.id] : undefined}
          />
        ))}
      </div>
    </section>
  );
}

const DEBRIEF_BENEFITS = [
  "A senior TymFlo consultant reviews your full Flo Blueprint diagnostic before your session begins",
  "Expert interpretation of your primary constraint and its specific impact on your business",
  "A clear, prioritized 90-day action plan you can begin implementing immediately after the call",
  "Direct answers to your most pressing strategic questions — no sales pressure, no generic advice",
  "Identification of your highest-leverage growth opportunity based on your diagnostic scores",
  "A session built around your Blueprint results — we start where most consultants would spend weeks getting to",
  "A written session summary delivered within 24 hours so the momentum continues",
];

function DebriefOffer({
  leadId,
  clerkUserId,
  eventSource,
  primaryConstraint,
  campaign,
}: {
  leadId: string | null;
  clerkUserId: string;
  eventSource?: string;
  primaryConstraint?: string | null;
  campaign?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventName = import.meta.env.VITE_EXECUTIVE_DEBRIEF_EVENT_NAME as string | undefined;
  const priceDisplay = (import.meta.env.VITE_EXECUTIVE_DEBRIEF_PRICE as string | undefined) || "$197";
  const expiresDisplay = import.meta.env.VITE_EXECUTIVE_DEBRIEF_EXPIRES as string | undefined;
  const paymentLink = import.meta.env.VITE_EXECUTIVE_DEBRIEF_PAYMENT_LINK as string | undefined;

  useEffect(() => {
    trackFunnelEvent("debrief_offer_viewed", leadId);
  }, [leadId]);

  async function handlePurchase() {
    trackFunnelEvent("purchase_clicked", leadId);

    if (paymentLink) {
      window.location.href = paymentLink;
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/checkout/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: leadId ?? null,
          clerkUserId,
          eventSource: eventSource ?? null,
          primaryConstraint: primaryConstraint ?? null,
          campaign: campaign ?? null,
        }),
      });
      const data = await resp.json() as { url?: string; error?: string };
      if (!resp.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not connect to checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="debrief-offer-heading"
      className="mb-12 no-print"
    >
      <div
        className="rounded-2xl overflow-hidden border border-border"
        style={{ background: "rgba(70,49,118,0.03)" }}
      >
        {eventName && (
          <div
            className="px-8 py-3 flex items-center justify-between gap-4"
            style={{ background: "#463176" }}
          >
            <p className="font-sans text-xs uppercase tracking-widest text-white/80 font-medium">
              Exclusive {eventName} Offer
            </p>
            {expiresDisplay && (
              <p className="font-sans text-xs text-white/60">Expires {expiresDisplay}</p>
            )}
          </div>
        )}

        <div className="p-8 md:p-12">
          <SectionLabel>Your Next Step</SectionLabel>
          <h2
            id="debrief-offer-heading"
            className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight"
          >
            Turn Your Blueprint Into a Clear 90-Day Plan
          </h2>
          <p className="font-sans text-foreground/70 leading-relaxed mb-10 max-w-2xl">
            Your diagnostic has identified exactly where your business is losing momentum. The next
            step is a focused 45-minute session with a TymFlo executive consultant who has already
            reviewed your results and is ready to build your path forward.
          </p>

          {/* Product card */}
          <div className="bg-white border border-border rounded-2xl p-8 mb-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6 pb-6 border-b border-border">
              <div>
                <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] mb-2 font-medium">
                  TymFlo Service
                </p>
                <h3 className="font-serif text-xl font-bold text-foreground">
                  The Flo Blueprint™ Executive Debrief
                </h3>
                <p className="font-sans text-sm text-muted-foreground mt-1">45-minute session</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-3xl font-bold text-foreground">{priceDisplay}</p>
                <p className="font-sans text-xs text-muted-foreground mt-1">one-time</p>
              </div>
            </div>

            <ul className="space-y-3 mb-6" aria-label="What's included">
              {DEBRIEF_BENEFITS.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mt-1.5 w-4 h-4 rounded-full flex-shrink-0"
                    style={{ background: "#F69679" }}
                    aria-hidden="true"
                  />
                  <p className="font-sans text-sm text-foreground/80 leading-relaxed">{benefit}</p>
                </li>
              ))}
            </ul>

            {error && (
              <CheckoutErrorBlock
                message={error}
                testIdPrefix="debrief"
                onRetry={handlePurchase}
                onDismiss={() => setError(null)}
              />
            )}

            <button
              onClick={handlePurchase}
              disabled={loading}
              data-testid="button-purchase-debrief"
              className="w-full px-8 py-4 font-sans font-semibold text-white rounded-full transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary min-h-[52px] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#463176" }}
            >
              {loading ? "Redirecting to checkout..." : "Purchase My Executive Debrief"}
            </button>
          </div>

          <p className="font-sans text-sm text-foreground/60 leading-relaxed text-center mb-6 max-w-xl mx-auto">
            Designed for founders and leaders who want expert direction without committing to a full
            consulting engagement.
          </p>
          <p className="font-serif text-lg font-semibold text-[#463176] text-center tracking-tight">
            Less Work. More Flo.
          </p>
        </div>
      </div>
    </section>
  );
}

const SERVICE_PURCHASE_NAMES: Record<string, string> = {
  "executive-growth-strategy": "Executive Growth Strategy Session",
  "marketing-systems-review": "Marketing Systems Review",
  "ai-workflow-accelerator": "AI Workflow Accelerator",
};

const SERVICE_SCHEDULING_URLS: Record<string, string | undefined> = {
  "executive-growth-strategy": import.meta.env.VITE_EXECUTIVE_GROWTH_STRATEGY_SCHEDULING_URL as string | undefined,
  "marketing-systems-review": import.meta.env.VITE_MARKETING_SYSTEMS_REVIEW_SCHEDULING_URL as string | undefined,
  "ai-workflow-accelerator": import.meta.env.VITE_AI_WORKFLOW_ACCELERATOR_SCHEDULING_URL as string | undefined,
};

function ServicePurchaseSuccess({ serviceId }: { serviceId: string }) {
  const serviceName = SERVICE_PURCHASE_NAMES[serviceId] ?? "your service";
  const schedulingUrl =
    (SERVICE_SCHEDULING_URLS[serviceId] ||
      (import.meta.env.VITE_SERVICE_SCHEDULING_URL as string | undefined)) ??
    undefined;

  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid="service-purchase-success"
      className="mb-10 rounded-2xl overflow-hidden border border-border no-print"
      style={{ background: "rgba(70,49,118,0.03)" }}
    >
      <div className="px-8 py-3" style={{ background: "#463176" }}>
        <p className="font-sans text-xs uppercase tracking-widest text-white/80 font-medium">
          Purchase Confirmed
        </p>
      </div>
      <div className="px-8 py-8">
        <h2 className="font-serif text-xl font-bold text-foreground mb-2 leading-tight">
          You're booked for {serviceName}
        </h2>
        <p className="font-sans text-sm text-foreground/70 leading-relaxed mb-6 max-w-2xl">
          Your payment was received. A TymFlo consultant will review your Flo Blueprint diagnostic
          before your session so you arrive to a prepared, personalized conversation.
        </p>
        {schedulingUrl ? (
          <a
            href={schedulingUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="service-purchase-schedule-link"
            className="inline-block px-6 py-3 font-sans text-sm font-semibold text-white rounded-full hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-opacity min-h-[44px]"
            style={{ background: "#463176" }}
          >
            Schedule Your Session
          </a>
        ) : (
          <div className="flex items-start gap-3 p-4 border border-border rounded-xl bg-white max-w-lg">
            <span
              className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: "#F69679" }}
              aria-hidden="true"
            />
            <p className="font-sans text-sm text-foreground/80 leading-relaxed">
              TymFlo will be in touch within 24 hours to schedule your session. Check your email
              for a confirmation and next steps.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportPage() {
  const [, setLocation] = useLocation();
  const { user, isLoaded } = useAuthUser();
  const { signOut } = useClerk();
  const state = loadState();
  const diagnostic = state.diagnostic as DiagnosticResult | null;
  const profile = state.profile as FloProfile | null;
  const lead = state.lead;

  const [servicePurchased, setServicePurchased] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sp = params.get("service_purchased");
    if (sp && SERVICE_PURCHASE_NAMES[sp]) {
      setServicePurchased(sp);
      // Clean the URL so a hard-refresh doesn't re-show the banner
      params.delete("service_purchased");
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      window.history.replaceState(null, "", newUrl);
    }
  }, []);

  const leadBelongsToUser = !!user && (!lead?.clerkUserId || lead.clerkUserId === user.id);

  useEffect(() => {
    if (!isLoaded) return;
    if (!diagnostic || !profile || !lead) {
      setLocation("/");
      return;
    }
    if (!user) {
      setLocation("/sign-in");
      return;
    }
    if (!leadBelongsToUser) {
      setLocation("/dashboard");
      return;
    }
    if (!sessionStorage.getItem("_flo_report_viewed")) {
      sessionStorage.setItem("_flo_report_viewed", "1");
      const lid = lead.id ?? null;
      trackFunnelEvent("user_authenticated", lid);
      trackFunnelEvent("report_viewed", lid);
    }
  }, [diagnostic, profile, lead, user, isLoaded, leadBelongsToUser]);

  if (!isLoaded || !user || !diagnostic || !profile || !lead || !leadBelongsToUser) return null;

  const primaryLabel = DIAGNOSIS_LABELS[diagnostic.primaryDiagnosis];
  const secondaryNote = getSecondaryNote(diagnostic);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const executiveSummary = `${profile.description} ${profile.whatThisMeans}`;

  const leadId = lead.id ?? null;

  const answers = state.answers;
  const currentStageLabel = (answers as Record<string, string>).q1_stage || "Current Stage";
  const firstPriority = profile.priorities[0]?.title || "Address primary constraint";
  const roadmapNodes = [
    { label: "Current Stage", desc: currentStageLabel, highlight: false },
    { label: "Primary Constraint", desc: primaryLabel, highlight: false },
    {
      label: "Recommended Focus",
      desc: profile.focus.length > 80 ? profile.focus.slice(0, 78) + "…" : profile.focus,
      highlight: false,
    },
    {
      label: "90-Day Action",
      desc: firstPriority.length > 70 ? firstPriority.slice(0, 68) + "…" : firstPriority,
      highlight: false,
    },
    { label: "TymFlo Service", desc: profile.tymFloService, highlight: false },
    { label: "Less Work. More Flo.", desc: null, highlight: true },
  ];

  return (
    <>
      <a
        href="#report-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
      >
        Skip to content
      </a>

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/60 px-6 md:px-12 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" aria-label="TymFlo — return to homepage">
            <TymFloLogo variant="horizontal" className="h-7 w-auto" alt="TymFlo" />
          </a>
          <div className="flex items-center gap-3">
            {isLoaded && user && (
              <button
                onClick={() => signOut({ redirectUrl: `${basePath}/` })}
                className="px-4 py-2 font-sans text-sm text-foreground/70 border border-border rounded-full hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-colors min-h-[40px]"
              >
                Sign out
              </button>
            )}
            <button
              onClick={() => setLocation("/assessment")}
              data-testid="button-retake"
              className="px-4 py-2 font-sans text-sm text-foreground/70 border border-border rounded-full hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-colors min-h-[40px]"
            >
              Retake Assessment
            </button>
            <button
              onClick={() => window.print()}
              data-testid="button-print"
              className="px-5 py-2 font-sans text-sm font-semibold text-white rounded-full hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-opacity min-h-[40px]"
              style={{ background: "#463176" }}
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <main id="report-content" className="max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-16">

        {/* ── Service purchase confirmation ── */}
        {servicePurchased && <ServicePurchaseSuccess serviceId={servicePurchased} />}

        {/* ── Report header ── */}
        <header className="mb-14 pb-12 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <SectionLabel>The Flo Blueprint™</SectionLabel>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight">
                Executive Business Intelligence Report
              </h1>
              <p className="font-sans text-xs uppercase tracking-widest text-[#463176]/60 mt-3 font-medium">
                Less Work. More Flo.
              </p>
            </div>
            <TymFloLogo variant="full" className="h-20 w-auto opacity-80" alt="TymFlo" />
          </div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Prepared For", value: `${lead.firstName} ${lead.lastName}` },
              { label: "Company", value: lead.company },
              { label: "Role", value: lead.role },
              { label: "Assessment Date", value: today },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  {label}
                </p>
                <p className="font-sans text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
          {(lead.industry || lead.annualRevenue) && (
            <div className="mt-6 grid grid-cols-2 gap-6">
              {lead.industry && (
                <div>
                  <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-1">
                    Industry
                  </p>
                  <p className="font-sans text-sm font-semibold text-foreground">{lead.industry}</p>
                </div>
              )}
              {lead.annualRevenue && (
                <div>
                  <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-1">
                    Annual Revenue
                  </p>
                  <p className="font-sans text-sm font-semibold text-foreground">
                    {lead.annualRevenue}
                  </p>
                </div>
              )}
            </div>
          )}
        </header>

        {/* ── Executive Summary ── */}
        <section aria-labelledby="exec-summary-heading" className="mb-12">
          <SectionLabel>Executive Summary</SectionLabel>
          <h2
            id="exec-summary-heading"
            className="font-serif text-2xl font-bold text-foreground mb-6"
          >
            Diagnostic Overview
          </h2>
          <div className="bg-card border border-card-border rounded-2xl p-8">
            <p className="font-sans text-foreground/80 leading-relaxed">{executiveSummary}</p>
          </div>
        </section>

        {/* ── Key Metrics ── */}
        <section aria-labelledby="metrics-heading" className="mb-12">
          <SectionLabel>Business Intelligence Metrics</SectionLabel>
          <h2
            id="metrics-heading"
            className="font-serif text-2xl font-bold text-foreground mb-6"
          >
            Headline Indicators
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {[
              {
                label: "Business Health Score",
                value: `${diagnostic.businessHealthScore}/100`,
                accent: diagnostic.businessHealthScore >= 70 ? "#22C55E" : diagnostic.businessHealthScore >= 50 ? "#EAB308" : "#EF4444",
              },
              {
                label: "Diagnosis Confidence",
                value: `${diagnostic.confidence}%`,
                accent: "#463176",
              },
              {
                label: "Growth Readiness",
                value: `${diagnostic.growthReadiness}%`,
                accent: diagnostic.growthReadiness >= 65 ? "#22C55E" : diagnostic.growthReadiness >= 45 ? "#463176" : "#EF4444",
              },
              {
                label: "AI Opportunity Score",
                value: `${diagnostic.aiOpportunityScore}%`,
                accent: "#463176",
              },
              {
                label: "Operational Efficiency",
                value: `${diagnostic.operationalEfficiency}%`,
                accent: diagnostic.operationalEfficiency >= 65 ? "#22C55E" : diagnostic.operationalEfficiency >= 45 ? "#EAB308" : "#EF4444",
              },
              {
                label: "Revenue Leakage Level",
                value: diagnostic.revenueLeakageLevel,
                accent:
                  diagnostic.revenueLeakageLevel === "Low"
                    ? "#22C55E"
                    : diagnostic.revenueLeakageLevel === "Moderate"
                    ? "#EAB308"
                    : diagnostic.revenueLeakageLevel === "High"
                    ? "#F97316"
                    : "#EF4444",
              },
            ].map(({ label, value, accent }) => (
              <div key={label} className="bg-card border border-card-border rounded-2xl p-5">
                <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  {label}
                </p>
                <p className="font-serif text-2xl font-bold" style={{ color: accent }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-card border border-card-border rounded-2xl px-6 py-4 flex items-center gap-3">
            <span className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
              Estimated hours lost weekly
            </span>
            <span className="font-sans text-sm font-semibold text-foreground">
              {diagnostic.estimatedHoursLostWeekly}
            </span>
          </div>
        </section>

        {/* ── Primary Constraint + Score + Profile ── */}
        <section aria-labelledby="constraint-heading" className="mb-12">
          <SectionLabel>Primary Business Constraint</SectionLabel>
          <h2
            id="constraint-heading"
            className="font-serif text-2xl font-bold text-foreground mb-6"
          >
            Diagnosis &amp; Confidence
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Constraint card */}
            <div className="rounded-2xl p-8 text-white" style={{ background: "#463176" }}>
              <p className="font-sans text-xs uppercase tracking-widest text-white/60 mb-2">
                Primary Constraint
              </p>
              <p className="font-serif text-3xl font-bold mb-4">{primaryLabel}</p>
              <div className="flex items-end gap-4">
                <div>
                  <p className="font-sans text-xs text-white/60 uppercase tracking-widest mb-1">
                    Confidence
                  </p>
                  <p className="font-serif text-4xl font-bold">{diagnostic.confidence}%</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-sans text-xs text-white/60 uppercase tracking-widest mb-1">
                    Health Score
                  </p>
                  <p className="font-serif text-4xl font-bold">
                    {diagnostic.businessHealthScore}
                    <span className="font-sans text-lg font-normal text-white/60">/100</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Profile card */}
            <div className="bg-card border border-card-border rounded-2xl p-8">
              <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Flo Blueprint Profile
              </p>
              <p className="font-serif text-2xl font-bold text-foreground mb-3">{profile.name}</p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-sans text-xs uppercase text-muted-foreground mb-1">
                    Strengths
                  </p>
                  <p className="font-sans text-foreground/80">{profile.strengths}</p>
                </div>
                <div>
                  <p className="font-sans text-xs uppercase text-muted-foreground mb-1">
                    Risks to Monitor
                  </p>
                  <p className="font-sans text-foreground/80">{profile.risks}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Snapshot table with Why This Score */}
          <div className="bg-card border border-card-border rounded-2xl p-8">
            <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
              Growth Snapshot — Category Index
            </h3>
            <p className="font-sans text-xs text-muted-foreground mb-6">
              Click "Why this score" beneath any category to see what it means, what top performers do differently, and how quickly it can improve.
            </p>
            <table className="w-full" aria-label="Category scores breakdown">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 font-sans text-xs uppercase tracking-widest text-muted-foreground text-left">
                    Category
                  </th>
                  <th className="pb-3 font-sans text-xs uppercase tracking-widest text-muted-foreground text-left hidden md:table-cell">
                    Index &amp; Benchmarks
                  </th>
                  <th className="pb-3 font-sans text-xs uppercase tracking-widest text-muted-foreground text-right">
                    Score
                  </th>
                  <th className="pb-3 font-sans text-xs uppercase tracking-widest text-muted-foreground text-right hidden sm:table-cell pl-4">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {CITATION_ORDER.map((key) => {
                  const score =
                    diagnostic.categoryScores[key as keyof typeof diagnostic.categoryScores];
                  return (
                    <ScoreRow
                      key={key}
                      label={CATEGORY_LABELS[key] || key}
                      score={score}
                      categoryKey={key}
                    />
                  );
                })}
              </tbody>
            </table>

            {/* Citations */}
            <div className="mt-6 pt-5 border-t border-border space-y-1">
              <p className="font-sans text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-widest">
                Research Citations
              </p>
              {CITATION_ORDER.map((key, i) => {
                const bm = CATEGORY_BENCHMARKS[key];
                return (
                  <p key={key} className="font-sans text-[11px] text-muted-foreground leading-snug">
                    <sup>[{i + 1}]</sup> {bm.fullCitation}
                  </p>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Why This Surfaced ── */}
        <section aria-labelledby="why-heading" className="mb-12">
          <SectionLabel>Diagnostic Evidence</SectionLabel>
          <h2
            id="why-heading"
            className="font-serif text-2xl font-bold text-foreground mb-6"
          >
            Why This Surfaced
          </h2>
          <div className="bg-card border border-card-border rounded-2xl p-8">
            <p className="font-sans text-sm text-muted-foreground mb-5">
              Your responses produced a consistent diagnostic pattern across multiple dimensions. The
              following signals drove the primary constraint identification:
            </p>
            <ul className="space-y-4" aria-label="Evidence bullets">
              {diagnostic.evidenceBullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span
                    className="mt-1.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "#463176" }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <p className="font-sans text-sm text-foreground/80 leading-relaxed">{bullet}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Secondary Observation ── */}
        <section aria-labelledby="secondary-heading" className="mb-12">
          <SectionLabel>Secondary Observation</SectionLabel>
          <h2
            id="secondary-heading"
            className="font-serif text-2xl font-bold text-foreground mb-6"
          >
            {DIAGNOSIS_LABELS[diagnostic.secondaryDiagnosis]} — Emerging Signal
          </h2>
          <div className="bg-card border border-card-border rounded-2xl p-8">
            <p className="font-sans text-foreground/80 leading-relaxed">{secondaryNote}</p>
          </div>
        </section>

        {/* ── Contradictions (if any) ── */}
        {diagnostic.contradictions.length > 0 && (
          <section aria-labelledby="tensions-heading" className="mb-12">
            <SectionLabel>Pattern Analysis</SectionLabel>
            <h2
              id="tensions-heading"
              className="font-serif text-2xl font-bold text-foreground mb-6"
            >
              Diagnostic Tensions
            </h2>
            <div className="bg-card border border-card-border rounded-2xl p-8">
              <p className="font-sans text-sm text-muted-foreground mb-5">
                Your responses indicated more than one active constraint. The following tensions were
                detected and factored into the diagnosis:
              </p>
              <div className="space-y-5">
                {diagnostic.contradictions.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 pb-5 border-b border-border last:border-0 last:pb-0"
                  >
                    <span
                      className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: "#F69679" }}
                      aria-hidden="true"
                    />
                    <p className="font-sans text-sm text-foreground/80 leading-relaxed">{c}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── What This Means ── */}
        <section aria-labelledby="means-heading" className="mb-12">
          <SectionLabel>Interpretation</SectionLabel>
          <h2
            id="means-heading"
            className="font-serif text-2xl font-bold text-foreground mb-6"
          >
            What This Means
          </h2>
          <div className="bg-card border border-card-border rounded-2xl p-8">
            <p className="font-sans text-foreground/80 leading-relaxed">{profile.whatThisMeans}</p>
          </div>
        </section>

        {/* ── Top 3 Priorities ── */}
        <section aria-labelledby="priorities-heading" className="mb-12">
          <SectionLabel>Action Plan</SectionLabel>
          <h2
            id="priorities-heading"
            className="font-serif text-2xl font-bold text-foreground mb-6"
          >
            Top Three Priorities
          </h2>
          <div className="space-y-4">
            {profile.priorities.map(({ title, detail }, i) => (
              <div key={title} className="bg-card border border-card-border rounded-2xl p-8">
                <div className="flex items-start gap-5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-sans text-sm font-bold text-white mt-0.5"
                    style={{ background: "#463176" }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
                      {title}
                    </h3>
                    <p className="font-sans text-sm text-foreground/70 leading-relaxed">{detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── What To Stop Doing ── */}
        <section aria-labelledby="stop-heading" className="mb-12">
          <SectionLabel>Consulting Guidance</SectionLabel>
          <h2
            id="stop-heading"
            className="font-serif text-2xl font-bold text-foreground mb-6"
          >
            What To Stop Doing
          </h2>
          <div className="bg-card border border-card-border rounded-2xl p-8">
            <p className="font-sans text-sm text-muted-foreground mb-6">
              The following activities are likely consuming time and resources without producing
              proportional results. Stopping these is as important as starting the right priorities.
            </p>
            <ul className="space-y-4" aria-label="Activities to stop">
              {profile.stopDoing.map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span
                    className="mt-1.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={{ borderColor: "#EF4444" }}
                    aria-hidden="true"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "#EF4444" }}
                    />
                  </span>
                  <p className="font-sans text-sm text-foreground/80 leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── What To Do Next ── */}
        <section aria-labelledby="next-heading" className="mb-12">
          <SectionLabel>Next Move</SectionLabel>
          <h2
            id="next-heading"
            className="font-serif text-2xl font-bold text-foreground mb-6"
          >
            What To Do Next
          </h2>
          <div className="bg-card border border-card-border rounded-2xl p-8">
            <p className="font-sans text-foreground/80 leading-relaxed">{profile.whatToDoNext}</p>
          </div>
        </section>

        {/* ── Estimated Business Impact + Solution ── */}
        <section
          aria-labelledby="impact-heading"
          className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-card border border-card-border rounded-2xl p-8">
            <SectionLabel>Projected Outcomes</SectionLabel>
            <h2
              id="impact-heading"
              className="font-serif text-xl font-semibold text-foreground mb-5"
            >
              Estimated Business Impact
            </h2>
            <ul className="space-y-3" aria-label="Estimated outcomes">
              {profile.impactOutcomes.map((item, i) => (
                <li key={i} className="flex items-start gap-3 font-sans text-sm text-foreground/80">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ background: "#F69679" }}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card border border-card-border rounded-2xl p-8">
            <SectionLabel>TymFlo Solution</SectionLabel>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
              Recommended Service
            </h2>
            <div
              className="inline-block px-4 py-2 rounded-full font-sans text-sm font-semibold text-white mb-5"
              style={{ background: "#F69679" }}
            >
              {profile.tymFloService}
            </div>
            <p className="font-sans text-sm text-foreground/70 leading-relaxed mb-6">
              {profile.focus}
            </p>
            <div className="border-t border-border pt-6">
              <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Implementation Path
              </p>
              <ol className="space-y-2">
                {[
                  "Review your Flo Blueprint diagnostic with your leadership team",
                  "Identify which of the three priorities to address first",
                  "Schedule a strategy session with TymFlo to build your implementation plan",
                ].map((step, i) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 font-sans text-sm text-foreground/80"
                  >
                    <span className="font-semibold text-muted-foreground flex-shrink-0">
                      {i + 1}.
                    </span>{" "}
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── Implementation Roadmap — print-safe, no transitions ── */}
        <PrintRoadmap nodes={roadmapNodes} />

        {/* ── Executive Debrief Offer ── */}
        <DebriefOffer
          leadId={leadId}
          clerkUserId={user.id}
          eventSource={state.tracking?.eventSource}
          primaryConstraint={diagnostic?.primaryDiagnosis ?? null}
          campaign={(state.tracking as Record<string, string> | undefined)?.campaign ?? null}
        />

        {/* ── Choose Your Next Step ── */}
        <ChooseNextStep leadId={leadId} />
      </main>

      <footer className="border-t border-border/60 px-6 md:px-12 py-8 mt-8 no-print">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <TymFloLogo variant="horizontal" className="h-6 w-auto" alt="TymFlo" />
          <p className="font-sans text-xs text-muted-foreground text-center">
            Confidential — Prepared exclusively for {lead.firstName} {lead.lastName} at{" "}
            {lead.company}
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
              Powered by TymFlo
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
