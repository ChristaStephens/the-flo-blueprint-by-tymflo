import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { TymFloLogo } from "@/components/TymFloLogo";
import { loadState, saveState, computeResults } from "@/lib/state";
import { AssessmentAnswers } from "@/lib/scoring";
import { trackFunnelEvent } from "@/lib/trackEvent";

const QUESTIONS = [
  {
    id: "q1_stage",
    question: "Which best describes your business today?",
    type: "single" as const,
    options: [
      "Building the foundation",
      "Growing consistently",
      "We've hit a plateau",
      "Scaling our team",
      "Expanding into new markets or locations",
    ],
  },
  {
    id: "q2_size",
    question: "How many people help run your business?",
    type: "single" as const,
    options: ["Just me", "2 to 5", "6 to 15", "16 to 50", "50+"],
  },
  {
    id: "q3_challenge",
    question: "Which statement best describes your business today?",
    type: "single" as const,
    options: [
      "We don't know what to focus on",
      "We know what to do but don't have time",
      "Our team is stretched too thin",
      "Our systems aren't keeping up",
      "We need better visibility into what's working",
      "We need help executing our strategy",
    ],
  },
  {
    id: "q4_friction",
    question: "Where do you experience the most friction?",
    type: "multi" as const,
    maxSelect: 3,
    options: [
      "Lead Generation",
      "Sales",
      "Client Onboarding",
      "Marketing",
      "Operations",
      "Team Communication",
      "Reporting",
      "Technology",
      "AI",
    ],
  },
  {
    id: "q5_impact",
    question: "What would create the biggest impact in your business this quarter?",
    type: "single" as const,
    options: [
      "More qualified leads",
      "Better marketing",
      "Better systems",
      "More time",
      "AI implementation",
      "Better customer experience",
      "Stronger operations",
      "Better reporting",
    ],
  },
  {
    id: "q6_fix",
    question: "What is the ONE thing you would fix tomorrow if you could?",
    type: "text" as const,
    placeholder: "Describe your biggest business challenge in your own words...",
  },
  {
    id: "q7_timeline",
    question: "How soon are you looking to improve this?",
    type: "single" as const,
    options: [
      "Immediately",
      "Within 30 Days",
      "Within 90 Days",
      "Within 6 Months",
      "Just Exploring",
    ],
  },
];

const ESTIMATED_MINUTES = ["1:00", "0:50", "0:40", "0:30", "0:20", "0:10", "0:05"];

const ROTATING_LINES = [
  "Less Work. More Flo.",
  "Every answer helps identify what's creating unnecessary work.",
  "Your diagnostic is being built in real time.",
];

const INTRO_SEEN_KEY = "flo_blueprint_intro_seen";

function IntroScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 px-6 md:px-12 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/" aria-label="TymFlo — return to homepage">
            <TymFloLogo variant="horizontal" className="h-7 w-auto" alt="TymFlo" />
          </a>
          <span className="font-sans text-xs text-muted-foreground uppercase tracking-widest">
            Business Diagnostic
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full">
          <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] mb-5 font-medium">
            Before We Begin
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6">
            This isn't a personality quiz.
          </h1>
          <p className="font-sans text-base text-foreground/70 leading-relaxed mb-8">
            It's a consulting-grade diagnostic built from hundreds of hours of strategy work. Each question is designed to surface the real constraint limiting your business — not the symptom you're treating.
          </p>
          <div className="space-y-4 mb-10">
            {[
              "Seven questions. No filler.",
              "Your answers drive the diagnosis in real time.",
              "Results are specific to your business — not a generic score.",
            ].map((line) => (
              <div key={line} className="flex items-start gap-3">
                <span
                  className="mt-1 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ background: "#463176" }}
                  aria-hidden="true"
                >
                  <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="font-sans text-sm text-foreground/80">{line}</span>
              </div>
            ))}
          </div>
          <button
            onClick={onBegin}
            data-testid="button-begin-diagnostic"
            className="px-8 py-4 font-sans font-semibold text-white rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-all duration-200 hover:opacity-90 active:scale-[0.98] min-h-[52px]"
            style={{ background: "#463176" }}
          >
            Begin My Diagnostic
          </button>
        </div>
      </main>

      <footer className="border-t border-border/60 px-6 md:px-12 py-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-xs text-muted-foreground">
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
              Powered by TymFlo
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default function AssessmentPage() {
  const [, setLocation] = useLocation();
  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(INTRO_SEEN_KEY);
    setShowIntro(!seen);
    if (seen) {
      const s = loadState();
      trackFunnelEvent("assessment_started", s.lead?.id);
    }
  }, []);

  useEffect(() => {
    const state = loadState();
    if (state.answers) {
      const loaded: Record<string, string | string[]> = {};
      for (const [k, v] of Object.entries(state.answers)) {
        if (v !== undefined) loaded[k] = v as string | string[];
      }
      setAnswers(loaded);
    }
  }, []);

  useEffect(() => {
    const state = loadState();
    saveState({ ...state, answers: answers as Partial<AssessmentAnswers> });
  }, [answers]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingIndex((i) => (i + 1) % ROTATING_LINES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  function handleBeginDiagnostic() {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
    setShowIntro(false);
    const s = loadState();
    trackFunnelEvent("assessment_started", s.lead?.id);
  }

  const question = QUESTIONS[step];
  const currentValue = answers[question.id];

  const isAnswered = useCallback(() => {
    if (question.type === "text") return typeof currentValue === "string" && currentValue.trim().length > 0;
    if (question.type === "multi") return Array.isArray(currentValue) && currentValue.length > 0;
    return typeof currentValue === "string" && currentValue.length > 0;
  }, [question.type, currentValue]);

  const transition = (newStep: number, dir: "forward" | "back") => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setStep(newStep); setDirection(dir); return; }
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => { setStep(newStep); setAnimating(false); }, 200);
  };

  function handleNext() {
    if (!isAnswered()) return;
    if (step < QUESTIONS.length - 1) {
      transition(step + 1, "forward");
    } else {
      const completeAnswers = answers as unknown as AssessmentAnswers;
      const { diagnostic, profile } = computeResults(completeAnswers);
      const state = loadState();
      trackFunnelEvent("assessment_completed", state.lead?.id);
      saveState({ ...state, currentStep: "dashboard", answers: completeAnswers, diagnostic, profile });
      setLocation("/dashboard");
    }
  }

  function handleBack() {
    if (step > 0) { transition(step - 1, "back"); }
    else { setLocation("/"); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && question.type !== "text" && isAnswered()) handleNext();
  }

  function selectSingle(option: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
  }

  function toggleMulti(option: string) {
    const q = question as Extract<typeof question, { type: "multi" }>;
    const prev = (answers[question.id] as string[]) || [];
    if (prev.includes(option)) {
      setAnswers((a) => ({ ...a, [question.id]: prev.filter((x) => x !== option) }));
    } else if (prev.length < q.maxSelect) {
      setAnswers((a) => ({ ...a, [question.id]: [...prev, option] }));
    }
  }

  if (showIntro === null) return null;

  if (showIntro) {
    return <IntroScreen onBegin={handleBeginDiagnostic} />;
  }

  return (
    <>
      <a href="#assessment-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded">
        Skip to content
      </a>
      <div className="min-h-screen bg-background flex flex-col" onKeyDown={handleKeyDown}>
        <header className="border-b border-border/60 px-6 md:px-12 py-5">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <a href="/" aria-label="TymFlo — return to homepage">
              <TymFloLogo variant="horizontal" className="h-7 w-auto" alt="TymFlo" />
            </a>
            <div className="flex items-center gap-4 font-sans text-sm text-muted-foreground" aria-live="polite">
              <span>Question {step + 1} of {QUESTIONS.length}</span>
              <span aria-label={`Estimated time remaining: ${ESTIMATED_MINUTES[step]}`}>~{ESTIMATED_MINUTES[step]} remaining</span>
            </div>
          </div>
        </header>

        <div className="h-0.5 bg-muted" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={QUESTIONS.length} aria-label={`Assessment progress: question ${step + 1} of ${QUESTIONS.length}`}>
          <div className="h-full transition-all duration-500" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%`, background: "#F69679" }} />
        </div>

        <main id="assessment-content" className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl" style={{ opacity: animating ? 0 : 1, transform: animating ? direction === "forward" ? "translateX(16px)" : "translateX(-16px)" : "translateX(0)", transition: "opacity 0.2s ease, transform 0.2s ease" }}>
            <div className="mb-10">
              <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-4" aria-hidden="true">
                {String(step + 1).padStart(2, "0")} / {QUESTIONS.length}
              </p>
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground leading-tight" id="question-heading">
                {question.question}
              </h2>
              {question.type === "multi" && (
                <p className="font-sans text-sm text-muted-foreground mt-2">Select up to {(question as Extract<typeof question, { type: "multi" }>).maxSelect}</p>
              )}
            </div>

            {question.type === "single" && (
              <fieldset aria-labelledby="question-heading">
                <legend className="sr-only">{question.question}</legend>
                <div className="space-y-3">
                  {question.options!.map((option) => {
                    const selected = currentValue === option;
                    return (
                      <label key={option} data-testid={`option-${option.replace(/\s+/g, "-").toLowerCase()}`}
                        className="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary min-h-[56px]"
                        style={{ borderColor: selected ? "#463176" : "hsl(var(--border))", background: selected ? "rgba(70,49,118,0.05)" : "hsl(var(--card))" }}>
                        <input type="radio" name={question.id} value={option} checked={selected} onChange={() => selectSingle(option)} className="sr-only" />
                        <span className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-150"
                          style={{ borderColor: selected ? "#463176" : "hsl(var(--border))", background: selected ? "#463176" : "transparent" }} aria-hidden="true">
                          {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                        </span>
                        <span className="font-sans text-sm md:text-base text-foreground">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {question.type === "multi" && (
              <fieldset aria-labelledby="question-heading">
                <legend className="sr-only">{question.question}</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {question.options!.map((option) => {
                    const selected = Array.isArray(currentValue) && currentValue.includes(option);
                    const maxed = Array.isArray(currentValue) && currentValue.length >= (question as Extract<typeof question, { type: "multi" }>).maxSelect && !selected;
                    return (
                      <label key={option} data-testid={`option-${option.replace(/\s+/g, "-").toLowerCase()}`}
                        className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary min-h-[52px]"
                        style={{ borderColor: selected ? "#463176" : "hsl(var(--border))", background: selected ? "rgba(70,49,118,0.05)" : "hsl(var(--card))", opacity: maxed ? 0.5 : 1 }}>
                        <input type="checkbox" name={question.id} value={option} checked={selected} disabled={maxed} onChange={() => toggleMulti(option)} className="sr-only" />
                        <span className="w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all duration-150"
                          style={{ borderColor: selected ? "#463176" : "hsl(var(--border))", background: selected ? "#463176" : "transparent" }} aria-hidden="true">
                          {selected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </span>
                        <span className="font-sans text-sm text-foreground">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {question.type === "text" && (
              <div>
                <label htmlFor="q6-textarea" className="sr-only">{question.question}</label>
                <textarea id="q6-textarea" data-testid="input-q6-fix"
                  className="w-full min-h-[160px] p-5 rounded-xl border-2 border-border bg-card font-sans text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary resize-none transition-colors"
                  placeholder={(question as Extract<typeof question, { type: "text" }>).placeholder}
                  value={(currentValue as string) || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                  aria-describedby="q6-hint" />
                <p id="q6-hint" className="font-sans text-xs text-muted-foreground mt-2">Be specific. This feeds directly into your diagnostic and makes the recommendations more precise.</p>
              </div>
            )}

            <div className="mt-10 flex items-center justify-between">
              <button onClick={handleBack} data-testid="button-back"
                className="px-6 py-3 font-sans text-sm text-foreground/70 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded-lg transition-colors min-h-[44px]"
                aria-label={step === 0 ? "Return to home" : "Go to previous question"}>
                {step === 0 ? "Home" : "Back"}
              </button>
              <button onClick={handleNext} disabled={!isAnswered()} data-testid="button-next"
                className="px-8 py-3 font-sans font-semibold text-white rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary min-h-[48px] disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                style={{ background: "#463176" }}
                aria-label={step === QUESTIONS.length - 1 ? "View my results" : "Continue to next question"}>
                {step === QUESTIONS.length - 1 ? "View My Results" : "Continue"}
              </button>
            </div>
          </div>
        </main>

        {/* Rotating footer tagline */}
        <div className="border-t border-border/40 px-6 py-3 flex items-center justify-between gap-4">
          <p
            className="font-sans text-xs text-muted-foreground/70 transition-opacity duration-700"
            key={rotatingIndex}
            aria-live="polite"
            aria-atomic="true"
          >
            {ROTATING_LINES[rotatingIndex]}
          </p>
          <a
            href="https://tymflo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-muted-foreground/70 hover:text-foreground transition-colors whitespace-nowrap flex-shrink-0"
          >
            Powered by TymFlo
          </a>
        </div>
      </div>
    </>
  );
}
