import { DiagnosisKey, DiagnosticResult, AssessmentAnswers } from "./scoring";

export interface FloProfile {
  id: string;
  name: string;
  description: string;
  strengths: string;
  risks: string;
  focus: string;
  tymFloService: string;
  stopDoing: string[];
  priorities: Array<{ title: string; detail: string }>;
  impactOutcomes: string[];
  whatThisMeans: string;
  whatToDoNext: string;
}

const DIAGNOSIS_PROFILES: Record<DiagnosisKey, FloProfile> = {
  customerAcquisition: {
    id: "growthAccelerator",
    name: "Growth Accelerator",
    description: "You're good at delivering. Getting new clients is the gap. We build the system that fills your pipeline consistently.",
    strengths: "Proven service delivery, existing client relationships, clear market position",
    risks: "Feast-or-famine revenue cycles, over-reliance on referrals, inconsistent lead quality",
    focus: "Build a reliable client pipeline",
    tymFloService: "Marketing Systems Review or Executive Growth Strategy Session",
    stopDoing: [
      "Chasing tactics without a lead capture system",
      "Relying on referrals with no backup plan",
      "Posting content that leads nowhere",
      "Measuring marketing by spend, not by clients",
    ],
    priorities: [
      {
        title: "Your best lead source isn't working hard enough",
        detail: "We audit where your last 10 clients actually came from and identify which source converts best. Then we double down on that channel — not the loudest one, the most effective one.",
      },
      {
        title: "Leads are falling through the cracks",
        detail: "We design a follow-up system for every inquiry that enters your orbit. No lead goes uncontacted. No conversation dies because of a missed follow-up.",
      },
      {
        title: "The path from stranger to booked call is too complicated",
        detail: "We simplify the buyer journey to one clear path. Every marketing touch moves a prospect closer to a conversation with you — no dead ends, no confusion.",
      },
    ],
    impactOutcomes: [
      "Consistent leads without increasing spend",
      "Faster response times, shorter sales cycles",
      "A clear path from awareness to booked call",
      "Marketing that tracks to revenue",
    ],
    whatThisMeans: "We identified that your delivery is strong — the constraint is upstream. Your client acquisition system doesn't match the quality of your service. That's a fixable system problem, not a product problem. Acquisition systems are among the fastest constraints to build and measure.",
    whatToDoNext: "Book your Executive Debrief. We map your acquisition gaps and build the system together — so new clients start coming in more consistently.",
  },

  salesProcess: {
    id: "revenueOptimizer",
    name: "Revenue Optimizer",
    description: "Leads are coming in. Too many aren't closing. We fix what's happening between interest and yes.",
    strengths: "Market presence, product/service quality, some established pipeline",
    risks: "Revenue inconsistency, over-reliance on relationship selling, long sales cycles",
    focus: "Convert more of the leads you already have",
    tymFloService: "Sales Systems Review or Executive Growth Strategy Session",
    stopDoing: [
      "Winging every sales conversation",
      "Sending proposals with no follow-up plan",
      "Measuring calls made, not deals closed",
      "Treating sales as a talent problem",
    ],
    priorities: [
      {
        title: "Prospects go quiet after the first conversation",
        detail: "We map every step from first contact to signed agreement and find exactly where deals stall. That moment — not marketing, not product — is your constraint.",
      },
      {
        title: "Proposals go out and nothing comes back",
        detail: "We build a follow-up sequence for every open proposal. Five touches, defined timing, ready to use. No proposal leaves without a plan behind it.",
      },
      {
        title: "You're spending time on leads that will never close",
        detail: "We define a qualification checklist so your best sales time goes to the prospects most likely to close. Bad-fit leads get filtered early — before they cost you hours.",
      },
    ],
    impactOutcomes: [
      "Higher close rates on existing leads",
      "Shorter time from first call to signed",
      "Revenue up without more marketing spend",
      "Less time on leads that never convert",
    ],
    whatThisMeans: "We identified that the bottleneck isn't reach — it's conversion. Your pipeline has the right people in it. The system for moving them to a decision is what's missing. Fixing the sales process almost always produces revenue results faster than any other investment.",
    whatToDoNext: "Book your Executive Debrief. We diagnose exactly where prospects are going quiet and build the conversion system to fix it.",
  },

  operationalCapacity: {
    id: "systemsOptimizer",
    name: "Systems Optimizer",
    description: "Your business is growing but the back end can't keep up. We find what's breaking and fix it before it breaks you.",
    strengths: "Proven product or service, active client base, experienced team",
    risks: "Burnout from manual processes, inability to scale without breaking, inconsistent delivery quality",
    focus: "Fix the systems slowing you down",
    tymFloService: "Operations Assessment or AI Opportunity Assessment",
    stopDoing: [
      "Adding tools before fixing the process",
      "Manually repeating tasks that should be automated",
      "Scaling marketing before delivery can handle it",
      "Hiring people to solve a systems problem",
    ],
    priorities: [
      {
        title: "Your delivery process has too many manual steps",
        detail: "We walk through your entire client delivery process and identify every handoff, gap, and friction point. You don't have to map it — we do.",
      },
      {
        title: "The same tasks are being done manually every week",
        detail: "We identify your top three most time-consuming manual tasks and design a system or automation around each. We document what exists, then replace it with something that runs itself.",
      },
      {
        title: "Growth is adding work instead of removing it",
        detail: "We build one consistent client workflow so every new engagement runs the same way. Consistency is what makes growth manageable — and what frees leadership from being in every delivery decision.",
      },
    ],
    impactOutcomes: [
      "8–12 hours recovered per week",
      "Consistent delivery without constant oversight",
      "Leadership time freed for growth, not operations",
      "More clients served without more chaos",
    ],
    whatThisMeans: "We identified that the ceiling is operational — not strategic. Your offering is proven, the demand is there, but the infrastructure behind it is the bottleneck. Fixing systems before scaling protects your team, your clients, and your margin.",
    whatToDoNext: "Book your Executive Debrief. We audit your highest-friction operations and hand you a clear fix — no homework required.",
  },

  leadershipAlignment: {
    id: "executionLeader",
    name: "Execution Leader",
    description: "Your team has the skills. Work is still bottlenecking through you. We build the structure that lets them run without you in every decision.",
    strengths: "Team capability, established business model, strategic awareness",
    risks: "Bottlenecks through leadership, team underperformance from unclear ownership, execution gaps",
    focus: "Get out of your team's way",
    tymFloService: "Executive Growth Strategy Session or Operations Assessment",
    stopDoing: [
      "Making decisions your team should own",
      "Running meetings with no clear outcomes",
      "Expecting accountability without building it",
      "Letting unclear ownership stall momentum",
    ],
    priorities: [
      {
        title: "Too many decisions are landing on your desk",
        detail: "We audit where your time is going and identify which decisions only you can make. Everything else gets delegated — with the structure to support it.",
      },
      {
        title: "Initiatives have no clear owner",
        detail: "We assign one clear owner to every active priority, with defined success criteria and a review cadence. No more shared responsibility that nobody takes.",
      },
      {
        title: "Your team is capable but not fully accountable",
        detail: "We design a weekly execution rhythm so your team stays aligned without needing you in every conversation. Accountability becomes a system, not a personality.",
      },
    ],
    impactOutcomes: [
      "Leadership time back on high-leverage decisions",
      "Team runs without constant check-ins",
      "Faster decisions, fewer bottlenecks",
      "Higher output from the team you already have",
    ],
    whatThisMeans: "We identified a leadership alignment constraint — not a team performance problem. The root cause is typically unclear ownership, insufficient accountability infrastructure, or a founder who hasn't yet transitioned from operator to executive. That transition is structural, not personal — and we build the structure.",
    whatToDoNext: "Book your Executive Debrief. We map where decisions are stacking up and build the accountability structure your team needs to run.",
  },

  customerJourney: {
    id: "experienceArchitect",
    name: "Experience Architect",
    description: "Clients are signing — but something between yes and done is creating friction. We find it and remove it.",
    strengths: "Core service delivery capability, established client relationships, market proof",
    risks: "Inconsistent client experience, reduced referral rates, churn from avoidable friction",
    focus: "Make every client experience worth talking about",
    tymFloService: "Operations Assessment or Customer Experience Review",
    stopDoing: [
      "Improvising onboarding every time",
      "Assuming clients are satisfied",
      "Underinvesting in the post-delivery moment",
      "Reacting to client issues instead of preventing them",
    ],
    priorities: [
      {
        title: "What happens after a client signs is inconsistent",
        detail: "We document every touchpoint, handoff, and communication a client experiences from first inquiry through post-delivery. Gaps and friction become visible immediately — and fixable.",
      },
      {
        title: "Onboarding is different every time",
        detail: "We design a structured onboarding process with a clear, repeatable checklist. Every client gets the same strong start — no improvisation, no dropped steps.",
      },
      {
        title: "Referrals aren't coming in at the rate they should",
        detail: "We build a structured feedback loop at 30 days and post-completion. Satisfied clients tell us what's working. Every touchpoint becomes a potential referral moment.",
      },
    ],
    impactOutcomes: [
      "Faster onboarding, faster client results",
      "Higher retention through proactive experience",
      "More referrals from a systematized ask",
      "Fewer escalations, fewer revisions",
    ],
    whatThisMeans: "We identified that acquisition isn't the constraint — it's what happens after the sale. Sustainable growth requires clients who stay, refer, and come back. That starts with an experience they're proud to talk about. We help you build that experience as a system, not a happy accident.",
    whatToDoNext: "Book your Executive Debrief. We map your client journey and identify exactly where experience is breaking down — then we fix it.",
  },

  aiAdoption: {
    id: "aiIntegrator",
    name: "AI Integrator",
    description: "Your business is ready for AI. Most owners are using it wrong. We identify where it actually saves you time and get it running.",
    strengths: "Openness to innovation, existing processes to optimize, technology-forward mindset",
    risks: "Tool sprawl without ROI, AI adoption without a strategy, data exposure without governance",
    focus: "Put AI where it creates real leverage",
    tymFloService: "AI Opportunity Assessment or AI Implementation Strategy",
    stopDoing: [
      "Adding AI tools without a clear use case",
      "Copying what others are doing instead of your own audit",
      "Waiting for the perfect tool before starting",
      "Using AI without a governance policy",
    ],
    priorities: [
      {
        title: "AI tools are being added without a strategy",
        detail: "We audit your five most time-intensive manual tasks and identify which ones are best suited for automation. The right process comes first — the tool comes last.",
      },
      {
        title: "The highest-ROI automation hasn't been identified yet",
        detail: "We identify one high-ROI AI implementation and get it running within 60 days. One use case, fully implemented, with measurable results before expanding.",
      },
      {
        title: "Your team needs clear rules for using AI safely",
        detail: "We help you establish guidelines for how AI tools are used, what data can be shared, and how outputs are reviewed. Your clients and your business stay protected as you scale AI use.",
      },
    ],
    impactOutcomes: [
      "5–10 hours per week recovered through automation",
      "Faster, more consistent service delivery",
      "Lower operational costs without cutting headcount",
      "A competitive advantage that compounds over time",
    ],
    whatThisMeans: "We identified that the timing is right and the friction points are clear. The businesses that implement AI strategically over the next 12–18 months will build an efficiency advantage that's hard to close. This isn't about every tool — it's about the right applications in the right sequence.",
    whatToDoNext: "Book your Executive Debrief. We identify your top AI opportunities and build a roadmap you can act on immediately.",
  },

  strategicPositioning: {
    id: "strategyArchitect",
    name: "Strategy Architect",
    description: "The effort is there. The direction isn't clear enough. We give you a focused 90-day plan so the work starts producing results.",
    strengths: "Business experience, adaptability, opportunity awareness",
    risks: "Effort without momentum, unfocused growth attempts, team misalignment on priorities",
    focus: "Get clear, get focused, get moving",
    tymFloService: "Creative Roadmap or Executive Growth Strategy Session",
    stopDoing: [
      "Chasing every opportunity that comes in",
      "Changing your offer before testing the best one",
      "Investing in marketing before strategy is clear",
      "Measuring busyness instead of outcomes",
    ],
    priorities: [
      {
        title: "You're serving the wrong mix of clients",
        detail: "We audit your most profitable and most enjoyable clients — not the most recent, the best. We identify the common profile and help you build your strategy around attracting more of exactly that.",
      },
      {
        title: "Too many offers are diluting your results",
        detail: "We help you narrow to the single strongest offer for your best client segment. Fewer services for a more defined audience at a higher price point almost always outperforms offer sprawl.",
      },
      {
        title: "Activity is high but progress feels slow",
        detail: "We build a 90-day execution plan with three non-negotiable priorities, measurable milestones, and a weekly review rhythm. Clarity of direction is a competitive advantage — and we provide it.",
      },
    ],
    impactOutcomes: [
      "Team aligned around one shared 90-day direction",
      "Less effort wasted on low-probability work",
      "Stronger positioning in a competitive market",
      "Faster decisions with a clear priority filter",
    ],
    whatThisMeans: "We identified that the constraint is direction, not effort or capability. Without a clear strategic foundation, every other investment — marketing, hiring, technology — produces fragmented results. Strategy isn't a planning exercise. It's the infrastructure that makes everything else work.",
    whatToDoNext: "Book your Executive Debrief. We define your 90-day strategic direction together so you leave with a plan already made — not another thing to figure out.",
  },

  dataVisibility: {
    id: "intelligenceBuilder",
    name: "Intelligence Builder",
    description: "Decisions are being made on gut and assumption. We build the reporting system that shows you what's actually working.",
    strengths: "Business experience, intuition-driven decision making, operational awareness",
    risks: "Resource misallocation, slow problem identification, strategy based on incomplete information",
    focus: "See clearly what's driving your business",
    tymFloService: "Business Intelligence Review or Data Visibility Assessment",
    stopDoing: [
      "Making big calls without performance data",
      "Reviewing metrics only when something goes wrong",
      "Tracking engagement instead of revenue outcomes",
      "Waiting for perfect data before starting",
    ],
    priorities: [
      {
        title: "The wrong numbers are being tracked",
        detail: "We identify the five metrics that most directly reflect business health for your specific model. Not follower counts or impressions — the numbers that actually move revenue.",
      },
      {
        title: "Performance issues show up too late",
        detail: "We build a simple weekly dashboard that surfaces what matters in one view. A one-page snapshot used consistently is more valuable than a complex system that nobody opens.",
      },
      {
        title: "Leadership isn't aligned on what good looks like",
        detail: "We establish a monthly business review rhythm for your leadership team. Data reviewed together creates shared context and evidence-based resource decisions — not gut-driven debates.",
      },
    ],
    impactOutcomes: [
      "Problems caught early, before they become crises",
      "Resources allocated by evidence, not instinct",
      "Strategy backed by real performance data",
      "Leadership team aligned on shared benchmarks",
    ],
    whatThisMeans: "We identified that decisions are being made on assumptions rather than evidence. Without visibility into what's working, effort gets distributed by intuition rather than performance. Data visibility isn't a technology problem — it's a decision-making infrastructure problem. We build the infrastructure.",
    whatToDoNext: "Book your Executive Debrief. We define the metrics that matter most for your business and show you exactly where to look.",
  },

  marketingConsistency: {
    id: "marketingArchitect",
    name: "Marketing Architect",
    description: "Marketing is happening but not consistently. We build the system that runs reliably — with or without the founder's daily involvement.",
    strengths: "Brand presence, market awareness, some established channels",
    risks: "Sporadic results from inconsistent effort, unclear ROI on marketing spend, messaging that doesn't convert",
    focus: "Build marketing that runs without you",
    tymFloService: "Marketing Systems Review or Creative Roadmap",
    stopDoing: [
      "Posting without a conversion path",
      "Measuring marketing by likes, not leads",
      "Switching channels before testing one properly",
      "Marketing to everyone instead of your best client",
    ],
    priorities: [
      {
        title: "You're spread across too many channels",
        detail: "We identify the one or two channels where your best clients are most active and build a consistent, high-quality presence there. Less spread, more depth — and measurably better results.",
      },
      {
        title: "Content goes out but leads don't come in",
        detail: "We connect every piece of content and every outreach effort to a specific conversion goal — booked calls, email captures, or proposal requests. Marketing without a conversion path is just noise.",
      },
      {
        title: "Prospects who aren't ready to buy are being lost",
        detail: "We design a lead nurture sequence for prospects who aren't ready yet. Most leads need 5–12 touches before a decision. We capture that value instead of losing it.",
      },
    ],
    impactOutcomes: [
      "Predictable lead flow from consistent effort",
      "Higher conversion rates from clearer messaging",
      "Better ROI by concentrating on proven channels",
      "Marketing that runs without founder involvement",
    ],
    whatThisMeans: "We identified that the issue isn't what you're doing in marketing — it's that it's happening without enough consistency, structure, or connection to revenue. Marketing systems, not marketing moments, produce reliable growth. We build the system so results stop depending on heroic effort.",
    whatToDoNext: "Book your Executive Debrief. We design a consistent marketing system built around the channels already working for you.",
  },

  executionCapacity: {
    id: "executionAccelerator",
    name: "Execution Accelerator",
    description: "The strategy is clear. The to-do list is long. Work isn't moving fast enough. We build the structure that closes the gap.",
    strengths: "Strategic awareness, decisiveness, business clarity",
    risks: "Stalled implementation, initiative fatigue, strategy without traction",
    focus: "Turn strategy into momentum",
    tymFloService: "Executive Growth Strategy Session or Operations Assessment",
    stopDoing: [
      "Planning without defining the first action",
      "Assigning work without a clear owner",
      "Letting perfect delay done",
      "Reviewing progress monthly instead of weekly",
    ],
    priorities: [
      {
        title: "Plans exist but don't have clear first actions",
        detail: "We define the specific first action that makes each plan real. Not the full roadmap — the first move that creates momentum. Plans without a defined start stall before they begin.",
      },
      {
        title: "Initiatives have no owner and no deadline",
        detail: "We assign one clear owner to every active initiative with defined milestones and a deadline. One owner. One set of success criteria. Accountability becomes concrete, not implied.",
      },
      {
        title: "Progress is reviewed too infrequently to stay on track",
        detail: "We design a weekly execution rhythm — not a status update, a commitment review. Milestones at risk are caught and adjusted before they become missed deadlines.",
      },
    ],
    impactOutcomes: [
      "Meaningful progress within 30 days",
      "Faster movement from decision to action",
      "Higher team accountability without micromanaging",
      "Strategic initiatives off the backlog and into motion",
    ],
    whatThisMeans: "We identified that the constraint is in the translation from strategy to action — not in the quality of the strategy itself. Execution capacity problems are solved with structure, not more planning. We provide that structure so the next 90 days become a proof point, not another planning cycle.",
    whatToDoNext: "Book your Executive Debrief. We build the 90-day execution structure so priorities stop waiting and start moving.",
  },
};

export type { AssessmentAnswers, DiagnosticResult };

export function getProfile(result: DiagnosticResult): FloProfile {
  return DIAGNOSIS_PROFILES[result.primaryDiagnosis] ?? DIAGNOSIS_PROFILES.customerAcquisition;
}

export function getSecondaryNote(result: DiagnosticResult): string {
  const secondaryLabel = result.diagnosisScores
    ? Object.entries(result.diagnosisScores).sort((a, b) => b[1] - a[1])[1]?.[0]
    : null;

  const notes: Partial<Record<DiagnosisKey, string>> = {
    operationalCapacity: "As you grow, your delivery systems will need to scale too. We'll flag this in your debrief.",
    customerAcquisition: "Once the primary constraint is solved, lead flow will be the next lever. We'll address it in sequence.",
    leadershipAlignment: "As the team grows, accountability structures become critical. Building them now saves friction later.",
    strategicPositioning: "As operations mature, clearer strategic direction will amplify every investment you make.",
    dataVisibility: "As growth accelerates, real-time performance data becomes essential for fast, confident decisions.",
    marketingConsistency: "Once the foundation is solid, consistent marketing will multiply its impact significantly.",
    executionCapacity: "As initiative volume increases, execution rhythm becomes the difference between momentum and stall.",
    salesProcess: "Once lead flow strengthens, a tighter sales system will dramatically increase what you close.",
    customerJourney: "As acquisition scales, client experience quality becomes your most powerful growth differentiator.",
    aiAdoption: "Once the primary constraint is addressed, AI implementation will compound your operational leverage.",
  };

  const key = (secondaryLabel || result.secondaryDiagnosis) as DiagnosisKey;
  return notes[key] ?? notes.operationalCapacity!;
}
