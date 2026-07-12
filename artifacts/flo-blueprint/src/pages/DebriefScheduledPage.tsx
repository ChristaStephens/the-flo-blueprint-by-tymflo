import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { TymFloLogo } from "@/components/TymFloLogo";
import { loadState } from "@/lib/state";
import { DIAGNOSIS_LABELS } from "@/lib/scoring";
import { trackFunnelEvent } from "@/lib/trackEvent";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const FOCUS_LABELS: Record<string, string> = {
  clarity: "Gaining Strategic Clarity",
  qualified_leads: "Generating More Qualified Leads",
  save_time: "Recovering Time and Reducing Friction",
  implementation: "Full Implementation Support",
};

async function saveBookingDate(leadId: string, bookingDate: string, sessionId: string): Promise<boolean> {
  try {
    const resp = await fetch(`${basePath}/api/debrief/booking`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, bookingDate, sessionId }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export default function DebriefScheduledPage() {
  const [, setLocation] = useLocation();
  const state = loadState();
  const lead = state.lead;
  const diagnostic = state.diagnostic;
  const selectedFocus = state.selectedFocus;

  // Try to capture booking date from TidyCal URL param (?booking_date=...) or allow manual entry
  const urlParams = new URLSearchParams(window.location.search);
  const urlBookingDate = urlParams.get("booking_date") ?? urlParams.get("date") ?? "";
  const stripeSessionId = state.stripeSessionId ?? "";
  const [sessionDate, setSessionDate] = useState(urlBookingDate);
  const [dateSaved, setDateSaved] = useState(false);

  useEffect(() => {
    trackFunnelEvent("booking_scheduled", lead?.id);

    // Auto-save booking date if passed via URL param and we have the session ID for ownership verification
    if (urlBookingDate && lead?.id && stripeSessionId) {
      saveBookingDate(String(lead.id), new Date(urlBookingDate).toISOString(), stripeSessionId).then((ok) => {
        if (ok) setDateSaved(true);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveSessionDate() {
    if (!sessionDate || !lead?.id || !stripeSessionId) return;
    const ok = await saveBookingDate(String(lead.id), new Date(sessionDate).toISOString(), stripeSessionId);
    if (ok) setDateSaved(true);
  }

  const focusLabel = selectedFocus ? (FOCUS_LABELS[selectedFocus] ?? selectedFocus) : null;
  const constraintLabel = diagnostic?.primaryDiagnosis
    ? DIAGNOSIS_LABELS[diagnostic.primaryDiagnosis]
    : null;

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
        <div className="mb-10">
          <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] mb-3 font-medium">
            Session Confirmed
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
            Your Debrief Is Scheduled
          </h1>
          {lead && (
            <p className="font-sans text-foreground/70 leading-relaxed">
              Thank you, {lead.firstName}. Your Executive Debrief has been booked.
            </p>
          )}
        </div>

        {(focusLabel || constraintLabel) && (
          <div className="bg-card border border-card-border rounded-2xl p-8 mb-8">
            <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-4 font-medium">
              Your Session Profile
            </p>
            <div className="space-y-4">
              {focusLabel && (
                <div>
                  <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-1">
                    Focus Area
                  </p>
                  <p className="font-sans text-sm font-semibold text-foreground">{focusLabel}</p>
                </div>
              )}
              {constraintLabel && (
                <div>
                  <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-1">
                    Primary Constraint Identified
                  </p>
                  <p className="font-sans text-sm font-semibold text-foreground">{constraintLabel}</p>
                </div>
              )}
              {diagnostic?.businessHealthScore != null && (
                <div>
                  <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-1">
                    Business Health Score
                  </p>
                  <p className="font-sans text-sm font-semibold text-foreground">
                    {diagnostic.businessHealthScore}/100
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-card border border-card-border rounded-2xl p-8 mb-8">
          <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-4 font-medium">
            What to Expect
          </p>
          <p className="font-sans text-sm text-foreground/80 leading-relaxed mb-5">
            We have already reviewed the information you submitted. Your session will begin with
            your results, not with repeating your business history. Come prepared to go deep on your
            focus area.
          </p>
          <ul className="space-y-3" aria-label="Session preparation tips">
            {[
              "Have your Flo Blueprint Executive Report open during the session.",
              "Identify one or two decisions or initiatives you want direction on.",
              "Block 45 minutes with no interruptions — this session is built around your constraints.",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-1.5 w-4 h-4 rounded-full flex-shrink-0"
                  style={{ background: "#F69679" }}
                  aria-hidden="true"
                />
                <p className="font-sans text-sm text-foreground/80 leading-relaxed">{tip}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Session date capture — auto-saved if TidyCal passes ?booking_date param */}
        {lead && !dateSaved && (
          <div className="bg-card border border-card-border rounded-2xl p-6 mb-8">
            <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">
              Confirm Your Session Time
            </p>
            <p className="font-sans text-sm text-foreground/70 mb-4 leading-relaxed">
              Enter your session date and time to receive a personalized confirmation email with everything you need to prepare.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="datetime-local"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="flex-1 px-4 py-2.5 font-sans text-sm border border-border rounded-none bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Session date and time"
              />
              <button
                onClick={handleSaveSessionDate}
                disabled={!sessionDate}
                className="px-6 py-2.5 font-sans text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#463176" }}
              >
                Send Confirmation Email
              </button>
            </div>
          </div>
        )}

        {dateSaved && (
          <div className="border border-[#F69679]/40 bg-[#F69679]/5 rounded-2xl p-5 mb-8">
            <p className="font-sans text-sm text-foreground/80 leading-relaxed">
              <strong>Confirmation email sent</strong> — check your inbox for your session details and preparation checklist.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => window.print()}
            className="flex-1 px-6 py-3 font-sans font-semibold text-white rounded-full transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary min-h-[44px] text-sm"
            style={{ background: "#463176" }}
          >
            Download My Blueprint Report
          </button>
          <a
            href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Flo+Blueprint%E2%84%A2+Executive+Debrief+with+TymFlo&details=Your+TidyCal+confirmation+email+contains+your+booking+link+and+calendar+invite.+Bring+your+Blueprint+Executive+Report+to+the+session.&location=Online+%E2%80%94+link+in+TidyCal+confirmation+email&duration=4500"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-6 py-3 font-sans font-semibold text-foreground border border-border rounded-full transition-all duration-200 hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary min-h-[44px] text-sm text-center flex items-center justify-center"
          >
            Add to Calendar
          </a>
          <button
            onClick={() => setLocation("/report")}
            className="flex-1 px-6 py-3 font-sans font-semibold text-foreground border border-border rounded-full transition-all duration-200 hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary min-h-[44px] text-sm"
          >
            Return to Your Report
          </button>
        </div>

        <p className="font-sans text-xs text-muted-foreground mt-8 text-center">
          Less Work. More Flo.
        </p>
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
    </div>
  );
}
