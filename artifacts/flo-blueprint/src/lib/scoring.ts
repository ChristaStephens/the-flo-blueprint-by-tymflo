// ─── Assessment Answer Types ─────────────────────────────────────────────────

export interface AssessmentAnswers {
  q1_stage: string;
  q2_size: string;
  q3_challenge: string;
  q4_friction: string[];
  q5_impact: string;
  q6_fix: string;
  q7_timeline: string;
}

// ─── Diagnosis Keys ───────────────────────────────────────────────────────────

export type DiagnosisKey =
  | "customerAcquisition"
  | "salesProcess"
  | "operationalCapacity"
  | "leadershipAlignment"
  | "customerJourney"
  | "aiAdoption"
  | "strategicPositioning"
  | "dataVisibility"
  | "marketingConsistency"
  | "executionCapacity";

export const DIAGNOSIS_LABELS: Record<DiagnosisKey, string> = {
  customerAcquisition: "Customer Acquisition System",
  salesProcess: "Sales Process",
  operationalCapacity: "Operational Capacity",
  leadershipAlignment: "Leadership Alignment",
  customerJourney: "Customer Journey",
  aiAdoption: "AI Adoption",
  strategicPositioning: "Strategic Positioning",
  dataVisibility: "Data Visibility",
  marketingConsistency: "Marketing Consistency",
  executionCapacity: "Execution Capacity",
};

export type DiagnosisScores = Record<DiagnosisKey, number>;

// ─── Legacy category scores (kept for score bar display) ──────────────────────

export interface CategoryScores {
  strategy: number;
  marketing: number;
  operations: number;
  customerExperience: number;
  aiReadiness: number;
  leadershipCapacity: number;
  execution: number;
}

// ─── Diagnostic Result ────────────────────────────────────────────────────────

export interface DiagnosticResult {
  primaryDiagnosis: DiagnosisKey;
  secondaryDiagnosis: DiagnosisKey;
  diagnosisScores: DiagnosisScores;
  confidence: number;
  businessHealthScore: number;
  evidenceBullets: string[];
  contradictions: string[];
  categoryScores: CategoryScores;
  // Derived composite metrics
  growthReadiness: number;
  aiOpportunityScore: number;
  operationalEfficiency: number;
  estimatedHoursLostWeekly: string;
  revenueLeakageLevel: string;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

function sorted(scores: DiagnosisScores): Array<[DiagnosisKey, number]> {
  return (Object.entries(scores) as Array<[DiagnosisKey, number]>).sort((a, b) => b[1] - a[1]);
}

// ─── Text keyword analysis ────────────────────────────────────────────────────

function analyzeText(text: string): Partial<Record<DiagnosisKey, number>> {
  const t = text.toLowerCase();
  const result: Partial<Record<DiagnosisKey, number>> = {};

  const add = (key: DiagnosisKey, v: number) => {
    result[key] = (result[key] ?? 0) + v;
  };

  if (/\b(lead|outreach|prospect|pipeline|referral|client|customer|revenue|sale)\b/.test(t)) {
    add("customerAcquisition", 12);
    add("marketingConsistency", 8);
  }
  if (/\b(follow.?up|conversion|close|pitch|proposal)\b/.test(t)) {
    add("salesProcess", 12);
  }
  if (/\b(system|process|automat|workflow|tool|platform|software|crm|manual)\b/.test(t)) {
    add("operationalCapacity", 12);
  }
  if (/\b(team|hire|delegate|manage|staff|bandwidth|capacity|people)\b/.test(t)) {
    add("leadershipAlignment", 10);
    add("executionCapacity", 6);
  }
  if (/\b(onboard|delivery|experience|client.?service|satisfaction)\b/.test(t)) {
    add("customerJourney", 12);
  }
  if (/\b(ai|artificial intelligence|chatgpt|automat|gpt|machine)\b/.test(t)) {
    add("aiAdoption", 14);
  }
  if (/\b(focus|clarity|strategy|priorit|direction|goal|mission)\b/.test(t)) {
    add("strategicPositioning", 12);
  }
  if (/\b(report|data|metric|kpi|dashboard|visibility|analytic|track)\b/.test(t)) {
    add("dataVisibility", 12);
  }
  if (/\b(market|brand|content|post|social|advertising|email|campaign)\b/.test(t)) {
    add("marketingConsistency", 12);
  }
  if (/\b(time|busy|overwhelm|juggl|execut|implement|deadline)\b/.test(t)) {
    add("executionCapacity", 12);
  }

  return result;
}

// ─── Main Diagnostic Engine ───────────────────────────────────────────────────

export function runDiagnosticEngine(answers: AssessmentAnswers): DiagnosticResult {
  // Initialize all diagnosis scores to 40 (neutral/low baseline)
  const scores: DiagnosisScores = {
    customerAcquisition: 40,
    salesProcess: 40,
    operationalCapacity: 40,
    leadershipAlignment: 40,
    customerJourney: 40,
    aiAdoption: 40,
    strategicPositioning: 40,
    dataVisibility: 40,
    marketingConsistency: 40,
    executionCapacity: 40,
  };

  const evidence: string[] = [];
  const contradictions: string[] = [];

  // ── Q1: Business stage ────────────────────────────────────────────────────
  switch (answers.q1_stage) {
    case "Building the foundation":
      scores.strategicPositioning += 30;
      scores.executionCapacity += 15;
      scores.operationalCapacity += 5;
      evidence.push("You're at the foundation-building stage, where strategic clarity is the highest-leverage investment.");
      break;
    case "Growing consistently":
      scores.operationalCapacity += 20;
      scores.marketingConsistency += 15;
      scores.executionCapacity += 10;
      evidence.push("Consistent growth signals your model is working — the opportunity is in systematizing what's driving that growth.");
      break;
    case "We've hit a plateau":
      scores.customerAcquisition += 25;
      scores.strategicPositioning += 20;
      scores.marketingConsistency += 15;
      scores.executionCapacity -= 10;
      evidence.push("A plateau typically signals that the original growth engine has reached its ceiling — a new constraint has emerged.");
      break;
    case "Scaling our team":
      scores.leadershipAlignment += 30;
      scores.operationalCapacity += 20;
      scores.dataVisibility += 10;
      evidence.push("Scaling a team introduces leadership alignment as the primary bottleneck — systems and communication must scale with headcount.");
      break;
    case "Expanding into new markets or locations":
      scores.strategicPositioning += 20;
      scores.marketingConsistency += 20;
      scores.operationalCapacity += 15;
      evidence.push("Market expansion requires both a differentiated positioning strategy and operational infrastructure that can scale across contexts.");
      break;
  }

  // ── Q2: Team size ─────────────────────────────────────────────────────────
  switch (answers.q2_size) {
    case "Just me":
      scores.executionCapacity += 20;
      scores.leadershipAlignment += 10;
      break;
    case "2 to 5":
      scores.leadershipAlignment += 10;
      scores.executionCapacity += 10;
      break;
    case "6 to 15":
      scores.leadershipAlignment += 15;
      scores.operationalCapacity += 10;
      break;
    case "16 to 50":
      scores.leadershipAlignment += 20;
      scores.operationalCapacity += 15;
      scores.dataVisibility += 10;
      break;
    case "50+":
      scores.operationalCapacity += 20;
      scores.dataVisibility += 20;
      scores.leadershipAlignment += 15;
      break;
  }

  // ── Q3: Current challenge ─────────────────────────────────────────────────
  switch (answers.q3_challenge) {
    case "We don't know what to focus on":
      scores.strategicPositioning += 35;
      scores.leadershipAlignment += 20;
      scores.dataVisibility += 10;
      evidence.push("The inability to identify the right focus is typically a strategic positioning gap — not an execution problem.");
      break;
    case "We know what to do but don't have time":
      scores.operationalCapacity += 30;
      scores.executionCapacity += 25;
      scores.leadershipAlignment += 15;
      evidence.push("Knowing what to do but lacking capacity is a signature pattern of Operational Capacity and Execution constraints.");
      break;
    case "Our team is stretched too thin":
      scores.operationalCapacity += 30;
      scores.leadershipAlignment += 25;
      scores.executionCapacity += 10;
      evidence.push("A stretched team signals that delivery infrastructure is not scaling with demand — a systemic constraint, not a people problem.");
      break;
    case "Our systems aren't keeping up":
      scores.operationalCapacity += 35;
      scores.executionCapacity += 15;
      scores.aiAdoption += 10;
      evidence.push("Systems lagging behind growth is the most common constraint for businesses in the $1M–$10M range.");
      break;
    case "We need better visibility into what's working":
      scores.dataVisibility += 35;
      scores.strategicPositioning += 20;
      evidence.push("Without data visibility, strategy and resource allocation decisions are based on assumptions rather than evidence.");
      break;
    case "We need help executing our strategy":
      scores.executionCapacity += 35;
      scores.leadershipAlignment += 20;
      scores.strategicPositioning += 10;
      evidence.push("Execution gaps between strategy and implementation typically reflect accountability systems or leadership capacity constraints.");
      break;
  }

  // ── Q4: Friction areas (multi-select) ─────────────────────────────────────
  const frictions = answers.q4_friction;
  for (const friction of frictions) {
    switch (friction) {
      case "Lead Generation":
        scores.customerAcquisition += 20;
        scores.marketingConsistency += 12;
        evidence.push("Lead generation was identified as a friction point — a direct signal that the customer acquisition system is the active bottleneck.");
        break;
      case "Sales":
        scores.salesProcess += 25;
        scores.customerAcquisition += 10;
        break;
      case "Client Onboarding":
        scores.customerJourney += 25;
        scores.operationalCapacity += 10;
        evidence.push("Client onboarding friction points to a Customer Journey gap that limits retention, referrals, and delivery quality.");
        break;
      case "Marketing":
        scores.marketingConsistency += 20;
        scores.customerAcquisition += 15;
        break;
      case "Operations":
        scores.operationalCapacity += 22;
        break;
      case "Team Communication":
        scores.leadershipAlignment += 22;
        scores.operationalCapacity += 8;
        break;
      case "Reporting":
        scores.dataVisibility += 25;
        break;
      case "Technology":
        scores.operationalCapacity += 15;
        scores.aiAdoption += 15;
        break;
      case "AI":
        scores.aiAdoption += 28;
        evidence.push("AI was identified as an active friction point — this organization is ready for strategic AI adoption.");
        break;
    }
  }

  // ── Q5: Desired impact ────────────────────────────────────────────────────
  switch (answers.q5_impact) {
    case "More qualified leads":
      scores.customerAcquisition += 25;
      scores.marketingConsistency += 15;
      evidence.push("Customer acquisition was named as the highest-impact priority — this aligns strongly with the primary diagnosis.");
      break;
    case "Better marketing":
      scores.marketingConsistency += 25;
      scores.customerAcquisition += 15;
      break;
    case "Better systems":
      scores.operationalCapacity += 25;
      evidence.push("Systems improvement was identified as the highest-impact lever — consistent with an Operational Capacity constraint.");
      break;
    case "More time":
      scores.operationalCapacity += 20;
      scores.executionCapacity += 20;
      break;
    case "AI implementation":
      scores.aiAdoption += 30;
      evidence.push("AI implementation was named as the single highest-impact move — indicating both readiness and urgency.");
      break;
    case "Better customer experience":
      scores.customerJourney += 28;
      scores.salesProcess += 10;
      break;
    case "Stronger operations":
      scores.operationalCapacity += 28;
      break;
    case "Better reporting":
      scores.dataVisibility += 28;
      break;
  }

  // ── Q6: Text analysis ─────────────────────────────────────────────────────
  if (answers.q6_fix && answers.q6_fix.trim().length > 3) {
    const textSignals = analyzeText(answers.q6_fix);
    for (const [key, val] of Object.entries(textSignals) as Array<[DiagnosisKey, number]>) {
      scores[key] = (scores[key] ?? 0) + val;
    }
    evidence.push(`Your own words — "${answers.q6_fix.trim()}" — reinforced the primary diagnosis pattern.`);
  }

  // ── Q7: Timeline urgency ──────────────────────────────────────────────────
  let urgencyBoost = 0;
  switch (answers.q7_timeline) {
    case "Immediately":
      urgencyBoost = 15;
      scores.executionCapacity += 10;
      evidence.push("The urgency level — immediate action — indicates this constraint is actively limiting growth today.");
      break;
    case "Within 30 Days":
      urgencyBoost = 10;
      scores.executionCapacity += 5;
      break;
    case "Within 90 Days":
      urgencyBoost = 5;
      break;
    case "Within 6 Months":
      urgencyBoost = 0;
      break;
    case "Just Exploring":
      urgencyBoost = -5;
      break;
  }

  // ── Contradiction detection ───────────────────────────────────────────────
  if (
    answers.q1_stage === "Growing consistently" &&
    answers.q3_challenge === "We don't know what to focus on"
  ) {
    contradictions.push(
      "Your responses suggest a strategic alignment tension: growth is occurring, yet strategic clarity is the identified bottleneck. This typically means growth is happening despite the strategy, not because of it — and it may not be sustainable without a clearer direction."
    );
  }

  if (
    (answers.q3_challenge === "Our systems aren't keeping up" ||
      answers.q3_challenge === "Our team is stretched too thin") &&
    (answers.q5_impact === "More qualified leads" || answers.q5_impact === "Better marketing")
  ) {
    contradictions.push(
      "While customer acquisition appears to be the desired focus, your responses also suggest that operational capacity may limit your ability to convert and serve new demand. Adding lead volume before strengthening delivery systems could amplify existing friction rather than relieve it."
    );
    scores.operationalCapacity += 10;
  }

  if (answers.q7_timeline === "Immediately" && answers.q3_challenge === "We don't know what to focus on") {
    contradictions.push(
      "There is a tension between your stated urgency and the current clarity of direction. Moving fast without a clear constraint identified often results in effort without momentum."
    );
  }

  if (
    frictions.includes("Lead Generation") &&
    (frictions.includes("Operations") || answers.q3_challenge === "Our systems aren't keeping up")
  ) {
    contradictions.push(
      "Both marketing and operational signals are present. Increasing lead volume before your operational systems can support fulfillment could create a customer experience gap that offsets acquisition gains."
    );
  }

  // ── Clamp all scores ──────────────────────────────────────────────────────
  for (const key of Object.keys(scores) as DiagnosisKey[]) {
    scores[key] = clamp(scores[key], 0, 100);
  }

  // ── Determine primary & secondary diagnoses ───────────────────────────────
  const rank = sorted(scores);
  const primaryDiagnosis = rank[0][0];
  const secondaryDiagnosis = rank[1][0];

  // ── Confidence calculation ────────────────────────────────────────────────
  const spread = rank[0][1] - rank[1][1];
  const baseConfidence = clamp(60 + spread * 0.6 + urgencyBoost, 55, 95);
  const confidence = Math.round(clamp(baseConfidence - contradictions.length * 4, 50, 95));

  // ── Business Health Score ─────────────────────────────────────────────────
  const maxScore = rank[0][1];
  const clarity = spread;
  const complexityPenalty = Math.min(frictions.length, 5) * 2;
  const contradictionPenalty = contradictions.length * 5;

  let bhs = 55;
  if (clarity > 20) bhs += 12;
  else if (clarity > 10) bhs += 6;
  bhs += Math.round((maxScore - 60) * 0.3);
  bhs += Math.round(urgencyBoost * 0.4);
  bhs -= complexityPenalty;
  bhs -= contradictionPenalty;

  if (answers.q1_stage === "Expanding into new markets or locations") bhs += 8;
  else if (answers.q1_stage === "Scaling our team") bhs += 5;
  else if (answers.q1_stage === "We've hit a plateau") bhs -= 5;

  const businessHealthScore = clamp(Math.round(bhs), 30, 95);

  // ── Prune evidence to best 3–5 bullets ───────────────────────────────────
  const evidenceBullets = evidence.slice(0, 5);

  // ── Legacy category scores (for display bars) ─────────────────────────────
  const categoryScores: CategoryScores = {
    strategy: Math.round((scores.strategicPositioning + scores.leadershipAlignment) / 2),
    marketing: Math.round((scores.customerAcquisition + scores.marketingConsistency) / 2),
    operations: Math.round((scores.operationalCapacity + scores.executionCapacity) / 2),
    customerExperience: Math.round((scores.customerJourney + scores.salesProcess) / 2),
    aiReadiness: Math.round(scores.aiAdoption),
    leadershipCapacity: Math.round((scores.leadershipAlignment + scores.executionCapacity) / 2),
    execution: Math.round((scores.executionCapacity + scores.operationalCapacity) / 2),
  };

  // ── Derived composite metrics ─────────────────────────────────────────────

  // Growth Readiness: how positioned for growth based on health, confidence, and constraint clarity
  const growthReadiness = clamp(
    Math.round(businessHealthScore * 0.72 + confidence * 0.28 - contradictions.length * 5),
    20,
    90
  );

  // AI Opportunity Score: how much AI could help, based on adoption signals and operational friction
  const aiOpportunityBase =
    38 +
    (frictions.includes("AI") ? 22 : 0) +
    (frictions.includes("Technology") ? 14 : 0) +
    (answers.q5_impact === "AI implementation" ? 18 : 0) +
    Math.round((scores.operationalCapacity - 40) * 0.28);
  const aiOpportunityScore = clamp(Math.round(aiOpportunityBase), 20, 90);

  // Operational Efficiency: inverse of operational constraint level
  const operationalEfficiency = clamp(
    Math.round(100 - (scores.operationalCapacity + scores.executionCapacity - 80) * 0.48),
    15,
    88
  );

  // Estimated hours lost weekly: derived from friction count and operational scores
  const frictionCount = frictions.length;
  let estimatedHoursLostWeekly: string;
  if (frictionCount <= 1 && businessHealthScore >= 70) {
    estimatedHoursLostWeekly = "2–5 hrs/week";
  } else if (frictionCount <= 2 || businessHealthScore >= 65) {
    estimatedHoursLostWeekly = "5–10 hrs/week";
  } else if (frictionCount <= 4 || businessHealthScore >= 50) {
    estimatedHoursLostWeekly = "10–18 hrs/week";
  } else {
    estimatedHoursLostWeekly = "15–25 hrs/week";
  }

  // Revenue leakage level: based on business health score
  let revenueLeakageLevel: string;
  if (businessHealthScore >= 75) {
    revenueLeakageLevel = "Low";
  } else if (businessHealthScore >= 60) {
    revenueLeakageLevel = "Moderate";
  } else if (businessHealthScore >= 45) {
    revenueLeakageLevel = "High";
  } else {
    revenueLeakageLevel = "Critical";
  }

  return {
    primaryDiagnosis,
    secondaryDiagnosis,
    diagnosisScores: scores,
    confidence,
    businessHealthScore,
    evidenceBullets,
    contradictions,
    categoryScores,
    growthReadiness,
    aiOpportunityScore,
    operationalEfficiency,
    estimatedHoursLostWeekly,
    revenueLeakageLevel,
  };
}
