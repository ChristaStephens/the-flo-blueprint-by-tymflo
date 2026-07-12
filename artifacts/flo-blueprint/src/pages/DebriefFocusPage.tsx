import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { TymFloLogo } from "@/components/TymFloLogo";
import { loadState, saveState } from "@/lib/state";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const TIDYCAL_URL =
  import.meta.env.VITE_EXECUTIVE_DEBRIEF_TIDYCAL_URL ||
  "https://tidycal.com/tymflo-christa/the-flo-blueprint-executive-debrief";

const FOCUS_OPTIONS = [
  {
    id: "clarity",
    title: "I Need Clarity",
    description:
      "You have momentum but lack a clear direction. You want a structured framework to prioritize what matters most and build a focused 90-day plan.",
  },
  {
    id: "qualified_leads",
    title: "I Need More Qualified Leads",
    description:
      "Your pipeline is inconsistent or filled with the wrong prospects. You want a repeatable system that attracts and converts the right clients.",
  },
  {
    id: "save_time",
    title: "I Need to Save Time",
    description:
      "Your calendar is full but growth has stalled. You want to identify and eliminate your highest-friction bottlenecks so you can lead instead of react.",
  },
  {
    id: "implementation",
    title: "I Want Someone to Build This for Me",
    description:
      "You know what needs to happen but do not have the capacity to execute it. You want a partner who can take the blueprint and implement it alongside your team.",
  },
] as const;

type FocusId = (typeof FOCUS_OPTIONS)[number]["id"];

type PaymentState = "loading" | "verified" | "failed";

export default function DebriefFocusPage() {
  const [, setLocation] = useLocation();
  const [paymentState, setPaymentState] = useState<PaymentState>("loading");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<FocusId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sessionId = new URLSearchParams(window.location.search).get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setPaymentState("failed");
      return;
    }

    fetch(`/api/debrief/status?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (r) => {
        if (r.status === 402) {
          setPaymentState("failed");
          return;
        }
        const data = await r.json() as { paid?: boolean; leadId?: string | null };
        if (data.paid) {
          setPaymentState("verified");
          if (data.leadId) setLeadId(data.leadId);
        } else {
          setPaymentState("failed");
        }
      })
      .catch(() => setPaymentState("failed"));
  }, [sessionId]);

  async function handleSubmit() {
    if (!selectedFocus) return;
    setSubmitting(true);
    setSubmitError(null);

    const state = loadState();

    if (leadId) {
      try {
        const resp = await fetch("/api/debrief/focus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, selectedFocus, sessionId }),
        });
        if (!resp.ok) {
          const d = await resp.json() as { error?: string };
          setSubmitError(d.error ?? "Something went wrong. Please try again.");
          setSubmitting(false);
          return;
        }
      } catch {
        setSubmitError("Could not save your selection. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    saveState({ ...state, selectedFocus, stripeSessionId: sessionId ?? undefined });

    const lead = state.lead;
    const diagnostic = state.diagnostic;

    const params = new URLSearchParams();
    if (lead?.firstName) params.set("first_name", lead.firstName);
    if (lead?.lastName) params.set("last_name", lead.lastName);
    if (lead?.email) params.set("email", lead.email);
    if (lead?.company) params.set("company", lead.company);
    params.set("selected_focus", selectedFocus);
    if (diagnostic?.businessHealthScore != null)
      params.set("health_score", String(diagnostic.businessHealthScore));
    if (diagnostic?.primaryDiagnosis) params.set("primary_constraint", diagnostic.primaryDiagnosis);
    if (leadId) params.set("lead_id", leadId);
    if (state.tracking?.eventSource) params.set("event_source", state.tracking.eventSource);

    const separator = TIDYCAL_URL.includes("?") ? "&" : "?";
    window.location.href = `${TIDYCAL_URL}${separator}${params.toString()}`;
  }

  if (paymentState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-sans text-sm text-muted-foreground">Verifying your payment...</p>
      </div>
    );
  }

  if (paymentState === "failed") {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/60 px-6 md:px-12 py-4">
          <div className="max-w-3xl mx-auto">
            <a href={`${basePath}/`} aria-label="TymFlo — return to homepage">
              <TymFloLogo variant="horizontal" className="h-7 w-auto" alt="TymFlo" />
            </a>
          </div>
        </div>
        <main className="max-w-3xl mx-auto px-6 md:px-12 py-24 text-center">
          <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] mb-3 font-medium">
            Payment Required
          </p>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
            Payment not found
          </h1>
          <p className="font-sans text-foreground/70 mb-8 leading-relaxed max-w-md mx-auto">
            We could not verify a completed payment for this session. If you believe this is an
            error, please contact hello@tymflo.com.
          </p>
          <button
            onClick={() => setLocation("/report")}
            className="px-8 py-3 font-sans font-semibold text-white rounded-full transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary min-h-[44px]"
            style={{ background: "#463176" }}
          >
            Return to Your Report
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/60 px-6 md:px-12 py-4">
        <div className="max-w-3xl mx-auto">
          <a href={`${basePath}/`} aria-label="TymFlo — return to homepage">
            <TymFloLogo variant="horizontal" className="h-7 w-auto" alt="TymFlo" />
          </a>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="mb-12">
          <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] mb-3 font-medium">
            Payment Confirmed
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
            What Would You Like to Focus On?
          </h1>
          <p className="font-sans text-foreground/70 leading-relaxed max-w-xl">
            Select the area where you want the most traction from your Executive Debrief. Your
            consultant will orient the session around your chosen focus and your Blueprint results.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10" role="radiogroup" aria-label="Select your focus area">
          {FOCUS_OPTIONS.map((option) => {
            const isSelected = selectedFocus === option.id;
            return (
              <button
                key={option.id}
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedFocus(option.id)}
                className={`text-left p-7 border-2 rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#463176] ${
                  isSelected
                    ? "border-[#463176] bg-[#463176]/5"
                    : "border-border bg-card hover:border-[#463176]/40"
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      isSelected ? "border-[#463176]" : "border-muted-foreground/40"
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#463176]" />
                    )}
                  </span>
                  <h2
                    className={`font-serif text-lg font-bold leading-snug ${
                      isSelected ? "text-[#463176]" : "text-foreground"
                    }`}
                  >
                    {option.title}
                  </h2>
                </div>
                <p className="font-sans text-sm text-foreground/70 leading-relaxed pl-7">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        {submitError && (
          <p className="font-sans text-sm text-red-500 mb-4">{submitError}</p>
        )}

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={!selectedFocus || submitting}
            className="w-full sm:w-auto px-12 py-4 font-sans font-semibold text-white rounded-full transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary min-h-[52px] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#463176" }}
          >
            {submitting ? "Saving..." : "Schedule My Debrief"}
          </button>
          <p className="font-sans text-xs text-muted-foreground text-center">
            You will be redirected to our scheduling page to choose your appointment time.
          </p>
        </div>
      </main>

      <footer className="border-t border-border/60 px-6 md:px-12 py-8 mt-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <TymFloLogo variant="horizontal" className="h-6 w-auto" alt="TymFlo" />
          <nav aria-label="Legal" className="flex items-center gap-4">
            <a
              href={`${basePath}/terms`}
              className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms &amp; Conditions
            </a>
            <a
              href={`${basePath}/privacy`}
              className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
