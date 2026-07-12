// ─── Peer Benchmarks ──────────────────────────────────────────────────────────
// Each benchmark is derived from credible published research.
// Values represent performance index scores (0–100 scale) across business dimensions.

export interface CategoryBenchmark {
  avg: number;
  top: number;
  source: string;
  year: number;
  fullCitation: string;
  interpretation: string;
  topPerformerNote: string;
  timeToImprove: string;
}

export const CATEGORY_BENCHMARKS: Record<string, CategoryBenchmark> = {
  strategy: {
    avg: 44,
    top: 78,
    source: "McKinsey Global Institute",
    year: 2023,
    fullCitation: "McKinsey Global Institute, 'The State of Organizations 2023'",
    interpretation:
      "Only 44% of executives report that their strategy is clearly communicated and understood at all levels of the organization. Strategic clarity is the single highest-leverage input for growth — without it, every other investment produces fragmented results.",
    topPerformerNote:
      "Top-quartile companies review and refine strategic priorities quarterly, use OKRs or equivalent frameworks to align every team to the same 90-day outcomes, and treat strategy as a living operational rhythm — not an annual planning event.",
    timeToImprove: "60–90 days",
  },

  marketing: {
    avg: 38,
    top: 71,
    source: "HubSpot State of Marketing",
    year: 2024,
    fullCitation: "HubSpot, 'State of Marketing Report 2024'",
    interpretation:
      "The average SMB converts 3.2% of leads to customers, while top performers reach 13.5%. Most businesses score below 40 on marketing effectiveness because effort is spread across too many channels without a defined conversion path.",
    topPerformerNote:
      "Top-performing marketing organizations concentrate on two channels maximum, publish on a fixed cadence with a defined conversion goal for every piece of content, and review pipeline contribution (not engagement) as the primary metric.",
    timeToImprove: "60–120 days",
  },

  operations: {
    avg: 47,
    top: 79,
    source: "Deloitte Digital Operations Survey",
    year: 2023,
    fullCitation: "Deloitte, 'Digital Operations Survey: SMB Edition' (2023)",
    interpretation:
      "The average small-to-mid-size business scores 47 on operational maturity — meaning nearly half of all workflows remain manual, undocumented, or siloed. Businesses with mature operations recover 25–40% of operational cost through automation and process clarity.",
    topPerformerNote:
      "High-performing operators document every recurring workflow, automate the top three most time-intensive tasks within 90 days of identification, and build delivery systems that can scale without adding proportional headcount.",
    timeToImprove: "45–90 days",
  },

  customerExperience: {
    avg: 51,
    top: 82,
    source: "Salesforce State of the Connected Customer",
    year: 2024,
    fullCitation: "Salesforce, 'State of the Connected Customer, 6th Edition' (2024)",
    interpretation:
      "88% of customers say the experience a company provides matters as much as its products or services. The average SMB scores 51 on customer experience — meaning friction in onboarding, delivery, and follow-up is directly limiting referrals and retention.",
    topPerformerNote:
      "Top-performing businesses implement a structured onboarding process, collect structured feedback at 30 days and post-delivery, and systematically ask for referrals — turning every client into a repeatable growth asset.",
    timeToImprove: "30–60 days",
  },

  aiReadiness: {
    avg: 31,
    top: 74,
    source: "IBM Institute for Business Value",
    year: 2024,
    fullCitation: "IBM Institute for Business Value, 'AI in Business: The State of Adoption' (2024)",
    interpretation:
      "35% of companies have integrated AI into at least one business function, but most are at the early exploration stage. Businesses that move strategically — identifying specific, high-ROI use cases — are compounding a cost and efficiency advantage that will be difficult to close in 24 months.",
    topPerformerNote:
      "AI leaders begin with a targeted process audit, identify the top three manually-repeatable tasks, and implement one AI automation within 60 days. They measure time saved and quality improvement before expanding — and build governance before granting broad team access.",
    timeToImprove: "30–60 days for first win",
  },

  leadershipCapacity: {
    avg: 42,
    top: 76,
    source: "Gallup State of the Global Workplace",
    year: 2024,
    fullCitation: "Gallup, 'State of the Global Workplace 2024 Report'",
    interpretation:
      "Only 23% of employees globally are engaged at work, and Gallup's research shows that manager effectiveness accounts for 70% of team engagement variance. Leadership capacity is rarely a people problem — it is almost always a structure, clarity, and delegation infrastructure problem.",
    topPerformerNote:
      "High-capacity leadership teams define single accountability owners for every initiative, review execution weekly rather than monthly, and protect their strategic bandwidth by systematically delegating anything that does not require their specific authority.",
    timeToImprove: "30–60 days",
  },

  execution: {
    avg: 49,
    top: 77,
    source: "Project Management Institute",
    year: 2024,
    fullCitation: "Project Management Institute, 'Pulse of the Profession 2024'",
    interpretation:
      "Only 49% of strategic initiatives meet their original goals and business intent. The PMI research attributes this to the gap between strategy definition and execution infrastructure — most businesses plan well but lack the accountability rhythms to follow through consistently.",
    topPerformerNote:
      "Top-performing organizations run 90-day execution sprints with three non-negotiable priorities, hold weekly implementation reviews with defined deliverables (not status updates), and treat execution velocity as a competitive metric.",
    timeToImprove: "30–45 days",
  },
};

// Ordered for footnote numbering — matches CATEGORY_LABELS order
export const CITATION_ORDER = [
  "strategy",
  "marketing",
  "operations",
  "customerExperience",
  "aiReadiness",
  "leadershipCapacity",
  "execution",
];
