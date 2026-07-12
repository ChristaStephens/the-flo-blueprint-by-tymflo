import { useLocation, Link } from "wouter";
import { TymFloLogo } from "@/components/TymFloLogo";
import { loadState, saveState } from "@/lib/state";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  function handleStart() {
    const state = loadState();
    saveState({ ...state, currentStep: "assessment", answers: {} });
    setLocation("/assessment");
  }

  function handleLearnMore() {
    document.getElementById("learn-more")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
      >
        Skip to main content
      </a>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Nav */}
        <header className="border-b border-border/60 px-6 md:px-12 py-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" aria-label="TymFlo — return to homepage">
              <TymFloLogo variant="horizontal" className="h-8 w-auto" alt="TymFlo" />
            </a>
            <span className="text-xs text-muted-foreground tracking-widest uppercase font-sans">
              Growth Intelligence Partner
            </span>
          </div>
        </header>

        {/* Hero */}
        <main id="main-content" className="flex-1">
          <section
            aria-labelledby="hero-heading"
            className="max-w-6xl mx-auto px-6 md:px-12 pt-20 pb-24 md:pt-32 md:pb-40"
          >
            <div className="max-w-3xl">
              <p className="text-xs font-sans tracking-widest uppercase text-muted-foreground mb-4 font-medium">
                TYMFLO &nbsp;/&nbsp; Less Work. More Flo.
              </p>

              <h1
                id="hero-heading"
                className="font-serif text-5xl md:text-7xl font-bold text-foreground leading-tight mb-4"
                style={{ letterSpacing: "-0.02em" }}
              >
                The Flo Blueprint™
              </h1>

              <p className="text-xl md:text-2xl font-serif text-foreground/70 mb-6 leading-relaxed">
                Discover the one thing holding your business back.
              </p>

              <p className="font-sans text-base text-foreground/60 mb-10 leading-relaxed max-w-2xl">
                Diagnose hidden bottlenecks, uncover your biggest opportunity, and get a personalized roadmap to grow your business with less effort.
              </p>

              <ul className="space-y-3 mb-12" aria-label="What you get">
                {[
                  "Pinpoint the operational constraint blocking your growth",
                  "Identify AI and automation opportunities you're missing",
                  "Get a prioritized roadmap — not generic advice",
                  "Immediate results, no sales call required",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-foreground/80 font-sans">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "#463176" }}
                      aria-hidden="true"
                    >
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStart}
                  data-testid="button-start-blueprint"
                  className="px-8 py-4 font-sans font-semibold text-white rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-all duration-200 hover:opacity-90 active:scale-[0.98] min-h-[52px]"
                  style={{ background: "#463176" }}
                >
                  Start My Blueprint
                </button>
                <button
                  onClick={handleLearnMore}
                  data-testid="button-learn-more"
                  className="px-8 py-4 font-sans font-semibold text-foreground border border-border rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-all duration-200 hover:bg-muted/60 min-h-[52px]"
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Decorative score preview */}
            <div
              className="mt-20 md:mt-0 md:absolute md:right-12 md:top-1/2 md:-translate-y-1/2 max-w-sm w-full"
              aria-hidden="true"
            >
              <div className="hidden md:block bg-card border border-card-border rounded-2xl p-8 shadow-lg">
                <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-6">
                  Sample Output
                </p>
                <div className="mb-6">
                  <div className="flex items-end gap-2 mb-1">
                    <span className="font-serif text-5xl font-bold" style={{ color: "#463176" }}>82</span>
                    <span className="font-sans text-muted-foreground mb-2">/100</span>
                  </div>
                  <p className="font-sans text-sm text-muted-foreground">Business Health Score</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Operations", pct: 58 },
                    { label: "AI Readiness", pct: 45 },
                    { label: "Strategy", pct: 74 },
                    { label: "Automation", pct: 52 },
                  ].map(({ label, pct }) => (
                    <div key={label}>
                      <div className="flex justify-between font-sans text-xs text-muted-foreground mb-1">
                        <span>{label}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: "#463176" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="font-sans text-xs text-muted-foreground uppercase tracking-widest mb-1">
                    Flo Blueprint Profile
                  </p>
                  <p className="font-serif text-base font-semibold text-foreground">Growth Accelerator</p>
                </div>
              </div>
            </div>
          </section>

          {/* Learn More section */}
          <section
            id="learn-more"
            aria-labelledby="about-heading"
            className="border-t border-border/60 bg-muted/30"
          >
            <div className="max-w-6xl mx-auto px-6 md:px-12 py-20">
              <div className="max-w-2xl">
                <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] mb-4 font-medium">
                  How It Works
                </p>
                <h2
                  id="about-heading"
                  className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6"
                >
                  A diagnostic tool built for executives.
                </h2>
                <p className="font-sans text-foreground/70 leading-relaxed mb-8">
                  The Flo Blueprint™ isn't a quiz. It's a structured business intelligence assessment that
                  analyzes seven key dimensions of your operation — including Operations, AI readiness, and
                  Automation capacity — to identify the primary constraint holding your growth back, and exactly what to do about it.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {[
                  {
                    step: "01",
                    title: "Complete the Assessment",
                    body: "Seven focused questions. No fluff, no filler. Built to surface what's actually limiting your growth — across operations, AI readiness, execution, and automation.",
                  },
                  {
                    step: "02",
                    title: "Receive Your Dashboard",
                    body: "An instant business intelligence snapshot: health score, category breakdowns, your primary constraint, and your Flo Blueprint profile.",
                  },
                  {
                    step: "03",
                    title: "Get Your Executive Report",
                    body: "A consulting-grade diagnostic with prioritized recommendations and a clear implementation roadmap — built around your business, not a template.",
                  },
                ].map(({ step, title, body }) => (
                  <div key={step} className="border-t-2 pt-6" style={{ borderColor: "#463176" }}>
                    <p className="font-sans text-xs text-muted-foreground mb-3">{step}</p>
                    <h3 className="font-serif text-lg font-semibold text-foreground mb-3">{title}</h3>
                    <p className="font-sans text-sm text-foreground/70 leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-16">
                <button
                  onClick={handleStart}
                  data-testid="button-start-blueprint-bottom"
                  className="px-8 py-4 font-sans font-semibold text-white rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-all duration-200 hover:opacity-90 min-h-[52px]"
                  style={{ background: "#463176" }}
                >
                  Start My Blueprint
                </button>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-border/60 px-6 md:px-12 py-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <TymFloLogo variant="icon" className="h-6 w-auto" alt="TymFlo" />
            <p className="font-sans text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} TymFlo. All rights reserved.
            </p>
            <nav aria-label="Legal" className="flex items-center gap-4">
              <Link href="/terms" className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors">
                Terms &amp; Conditions
              </Link>
              <Link href="/privacy" className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
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
    </>
  );
}
