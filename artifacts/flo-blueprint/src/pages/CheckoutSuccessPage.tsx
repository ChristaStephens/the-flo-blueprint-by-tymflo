import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { TymFloLogo } from "@/components/TymFloLogo";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const SERVICE_DETAILS: Record<
  string,
  { title: string; nextSteps: string[]; duration: string }
> = {
  "executive-growth-strategy": {
    title: "Executive Growth Strategy Session",
    duration: "90-minute session",
    nextSteps: [
      "You will receive a confirmation email with scheduling details within 24 hours.",
      "A TymFlo executive consultant will reach out to confirm your preferred time.",
      "Before your session, review your Flo Blueprint diagnostic and note your top priorities.",
      "Your 90-day action plan will be delivered within 48 hours after the session.",
    ],
  },
  "marketing-systems-review": {
    title: "Marketing Systems Review",
    duration: "Delivered within 2 weeks",
    nextSteps: [
      "You will receive a confirmation email with next steps within 24 hours.",
      "A TymFlo marketing consultant will contact you to schedule an intake call.",
      "The intake call will collect access to your current marketing assets and channels.",
      "Your prioritized build plan will be delivered within 14 business days.",
    ],
  },
  "ai-workflow-accelerator": {
    title: "AI Workflow Accelerator",
    duration: "60-day implementation",
    nextSteps: [
      "You will receive a confirmation email within 24 hours.",
      "A TymFlo AI specialist will schedule your workflow audit call.",
      "Together you will identify your highest-friction workflows and automation targets.",
      "Your 60-day implementation plan with two to three AI automations will be delivered within one week.",
    ],
  },
};

export default function CheckoutSuccessPage() {
  const [, setLocation] = useLocation();
  const [serviceId, setServiceId] = useState<string | null>(null);
  const calendlyUrl = import.meta.env.VITE_CALENDLY_URL || "#";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("service");
    setServiceId(id);
  }, []);

  const details = serviceId ? SERVICE_DETAILS[serviceId] : null;

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
            Payment Confirmed
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
            {details ? details.title : "Your purchase is confirmed."}
          </h1>
          {details && (
            <p className="font-sans text-foreground/70 text-base leading-relaxed">
              {details.duration}
            </p>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-8 mb-8">
          <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-4 font-medium">
            What Happens Next
          </p>
          {details ? (
            <ol className="space-y-4">
              {details.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span
                    className="mt-0.5 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-sans text-xs font-bold text-white"
                    style={{ background: "#463176" }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <p className="font-sans text-sm text-foreground/80 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="font-sans text-sm text-foreground/80 leading-relaxed">
              A TymFlo team member will be in touch within 24 hours to confirm your purchase and
              schedule your next step.
            </p>
          )}
        </div>

        <div
          className="border border-border rounded-2xl p-8 text-center"
          style={{ background: "rgba(70,49,118,0.03)" }}
        >
          <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">
            Optional — Accelerate Your Start
          </p>
          <h2 className="font-serif text-xl font-bold text-foreground mb-3">
            Schedule your kickoff call now
          </h2>
          <p className="font-sans text-sm text-foreground/70 mb-6 max-w-md mx-auto leading-relaxed">
            Skip the back-and-forth. Pick a time that works for you and we will reach out to
            confirm.
          </p>
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 font-sans font-semibold text-white rounded-full transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary min-h-[44px]"
            style={{ background: "#463176" }}
          >
            Schedule a Call
          </a>
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => setLocation("/report")}
            className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Return to your executive report
          </button>
        </div>
      </main>

      <footer className="border-t border-border/60 px-6 md:px-12 py-8 mt-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <TymFloLogo variant="horizontal" className="h-6 w-auto" alt="TymFlo" />
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
    </div>
  );
}
