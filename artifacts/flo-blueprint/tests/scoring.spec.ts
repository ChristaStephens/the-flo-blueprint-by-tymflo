/**
 * Unit tests for the diagnostic scoring engine.
 * These run in Playwright's Node.js test-runner context (no browser needed),
 * so they are fast and can be batched with the e2e suite.
 *
 * Validates that every new DiagnosticResult field introduced after the
 * dashboard/report rewrite — growthReadiness, aiOpportunityScore,
 * operationalEfficiency, estimatedHoursLostWeekly, revenueLeakageLevel —
 * is a valid, non-NaN value for all 10 possible primary diagnosis paths.
 *
 * Each answer set is crafted by manually tracing the scoring engine's
 * additive score table to ensure the named key wins the primary diagnosis.
 */

import { test, expect } from "@playwright/test";
import {
  runDiagnosticEngine,
  AssessmentAnswers,
  DiagnosticResult,
  DiagnosisKey,
} from "../src/lib/scoring";

// ---------------------------------------------------------------------------
// Answer sets crafted to produce each of the 10 DiagnosisKey values as
// primaryDiagnosis. Scores are derived by manually tracing the engine logic.
// ---------------------------------------------------------------------------

const ANSWER_SETS: Array<{
  label: string;
  expectedPrimary: DiagnosisKey;
  answers: AssessmentAnswers;
}> = [
  {
    label: "customerAcquisition — plateau + lead gen focus",
    expectedPrimary: "customerAcquisition",
    answers: {
      // q1 "plateau": cA+25, stratPos+20, mC+15, eC-10
      // q2 "2-5": lA+10, eC+10
      // q3 "team stretched": oC+30, lA+25, eC+10
      // q4 LeadGen: cA+20, mC+12
      // q5 "More qualified leads": cA+25, mC+15
      // q6 "lead…": cA+12, mC+8
      // Final approx: cA≈122, lA≈75, oC≈70
      q1_stage: "We've hit a plateau",
      q2_size: "2 to 5",
      q3_challenge: "Our team is stretched too thin",
      q4_friction: ["Lead Generation"],
      q5_impact: "More qualified leads",
      q6_fix: "lead pipeline referral outreach prospect client revenue sale",
      q7_timeline: "Within 30 Days",
    },
  },
  {
    label: "salesProcess — plateau + sales friction + conversion text",
    expectedPrimary: "salesProcess",
    answers: {
      // q1 "plateau": cA+25=65, stratPos+20=60, mC+15=55, eC-10
      // q2 "2-5": lA+10, eC+10
      // q3 "team stretched": oC+30=70, lA+25=75, eC+10
      // q4 Sales: sP+25=65
      // q5 "Better customer experience": cJ+28=68, sP+10=75
      // q6 "follow-up…": sP+12=87
      // Final approx: sP≈87, lA≈75, oC≈70, cA≈65
      q1_stage: "We've hit a plateau",
      q2_size: "2 to 5",
      q3_challenge: "Our team is stretched too thin",
      q4_friction: ["Sales"],
      q5_impact: "Better customer experience",
      q6_fix: "follow up conversion close pitch proposal",
      q7_timeline: "Within 30 Days",
    },
  },
  {
    label: "operationalCapacity — growing biz + systems lagging",
    expectedPrimary: "operationalCapacity",
    answers: {
      // q1 "growing": oC+20, mC+15, eC+10
      // q2 "6-15": lA+15, oC+10
      // q3 "systems lagging": oC+35, eC+15, aiAdoption+10
      // q4 Operations+Technology: oC+22+15=37, aiAdoption+15
      // q5 "Better systems": oC+25
      // q6 "system process automat…": oC+12
      // Final approx: oC≈159, eC≈65, lA≈55
      q1_stage: "Growing consistently",
      q2_size: "6 to 15",
      q3_challenge: "Our systems aren't keeping up",
      q4_friction: ["Operations", "Technology"],
      q5_impact: "Better systems",
      q6_fix: "system process automat workflow tool platform software crm manual",
      q7_timeline: "Within 30 Days",
    },
  },
  {
    label: "leadershipAlignment — scaling team + team communication",
    expectedPrimary: "leadershipAlignment",
    answers: {
      // q1 "scaling team": lA+30=70, oC+20=60, dV+10=50
      // q2 "2-5" (NOT 16-50 — larger sizes push oC too close to the 100 cap):
      //         lA+10=80, eC+10=50
      // q3 "team stretched": oC+30=90, lA+25=105→clamped to 100, eC+10=60
      // After clamping: lA=100, oC=90
      // q4 TeamCommunication: lA+22=122→100, oC+8=98
      // q5 "Better reporting": dV+28=78  (no oC boost)
      // q6 "team hire…": lA+10→100 (already capped), eC+6=66
      // Final: lA=100, oC=98 → lA wins ✓
      q1_stage: "Scaling our team",
      q2_size: "2 to 5",
      q3_challenge: "Our team is stretched too thin",
      q4_friction: ["Team Communication"],
      q5_impact: "Better reporting",
      q6_fix: "team hire delegate manage staff bandwidth capacity people",
      q7_timeline: "Within 90 Days",
    },
  },
  {
    label: "customerJourney — growing biz + onboarding friction",
    expectedPrimary: "customerJourney",
    answers: {
      // q1 "growing": oC+20=60, mC+15=55, eC+10=50
      // q2 "2-5": lA+10=50, eC+10=60
      // q3 "don't know focus": stratPos+35=75, lA+20=70, dV+10=50
      // q4 ClientOnboarding: cJ+25=65, oC+10=70
      // q5 "Better customer experience": cJ+28=93, sP+10=50
      // q6 "onboard delivery…": cJ+12=105
      // Final approx: cJ≈105, stratPos≈75, oC≈70
      q1_stage: "Growing consistently",
      q2_size: "2 to 5",
      q3_challenge: "We don't know what to focus on",
      q4_friction: ["Client Onboarding"],
      q5_impact: "Better customer experience",
      q6_fix: "client onboarding delivery experience satisfaction",
      q7_timeline: "Within 30 Days",
    },
  },
  {
    label: "aiAdoption — foundation stage + AI friction + AI impact",
    expectedPrimary: "aiAdoption",
    answers: {
      // q1 "building foundation": stratPos+30=70, eC+15=55, oC+5=45
      // q2 "Just me": eC+20=75, lA+10=50
      // q3 "systems lagging": oC+35=80, eC+15=90, aiAdoption+10=50
      // q4 AI: aiAdoption+28=78
      // q5 "AI implementation": aiAdoption+30=108
      // q6 "ai chatgpt…": aiAdoption+14=122
      // q7 Immediately: eC+10=100
      // Final approx: aiAdoption≈122, eC≈100, oC≈80
      q1_stage: "Building the foundation",
      q2_size: "Just me",
      q3_challenge: "Our systems aren't keeping up",
      q4_friction: ["AI"],
      q5_impact: "AI implementation",
      q6_fix: "ai chatgpt artificial intelligence machine automat gpt",
      q7_timeline: "Immediately",
    },
  },
  {
    label: "strategicPositioning — market expansion + focus gap",
    expectedPrimary: "strategicPositioning",
    answers: {
      // q1 "expanding markets": stratPos+20=60, mC+20=60, oC+15=55
      // q2 "2-5": lA+10=50, eC+10=50
      // q3 "don't know focus": stratPos+35=95, lA+20=70, dV+10=50
      // q4 []: no friction boosts
      // q5 "Better marketing": mC+25=85, cA+15=55
      // q6 "focus clarity strategy…": stratPos+12=107
      // q7 "Just Exploring": urgency -5 (no score boost)
      // Final approx: stratPos≈107, mC≈85, lA≈70
      q1_stage: "Expanding into new markets or locations",
      q2_size: "2 to 5",
      q3_challenge: "We don't know what to focus on",
      q4_friction: [],
      q5_impact: "Better marketing",
      q6_fix: "focus clarity strategy priority direction goal mission",
      q7_timeline: "Just Exploring",
    },
  },
  {
    label: "dataVisibility — scaling team + visibility gap",
    expectedPrimary: "dataVisibility",
    answers: {
      // q1 "scaling team": lA+30=70, oC+20=60, dV+10=50
      // q2 "16-50": lA+20=90, oC+15=75, dV+10=60
      // q3 "better visibility": dV+35=95, stratPos+20=60
      // q4 Reporting: dV+25=120
      // q5 "Better reporting": dV+28=148
      // q6 "report data…": dV+12=160
      // Final approx: dV≈160, lA≈90, oC≈75
      q1_stage: "Scaling our team",
      q2_size: "16 to 50",
      q3_challenge: "We need better visibility into what's working",
      q4_friction: ["Reporting"],
      q5_impact: "Better reporting",
      q6_fix: "report data metric kpi dashboard visibility analytic track",
      q7_timeline: "Within 30 Days",
    },
  },
  {
    label: "marketingConsistency — plateau + marketing friction",
    expectedPrimary: "marketingConsistency",
    answers: {
      // q1 "plateau": cA+25=65, stratPos+20=60, mC+15=55, eC-10
      // q2 "2-5": lA+10=50, eC+10=40
      // q3 "team stretched": oC+30=70, lA+25=75, eC+10=50
      // q4 Marketing: mC+20=75, cA+15=80
      // q5 "Better marketing": mC+25=100, cA+15=95
      // q6 "market brand…": mC+12=112
      // Final approx: mC≈112, cA≈95, lA≈75
      q1_stage: "We've hit a plateau",
      q2_size: "2 to 5",
      q3_challenge: "Our team is stretched too thin",
      q4_friction: ["Marketing"],
      q5_impact: "Better marketing",
      q6_fix: "market brand content post social advertising email campaign",
      q7_timeline: "Within 30 Days",
    },
  },
  {
    label: "executionCapacity — foundation stage + execution gap",
    expectedPrimary: "executionCapacity",
    answers: {
      // q1 "building foundation": stratPos+30=70, eC+15=55, oC+5=45
      // q2 "Just me": eC+20=75, lA+10=50
      // q3 "help executing strategy": eC+35=110, lA+20=70, stratPos+10=80
      // q4 []: no friction
      // q5 "More time": oC+20=65, eC+20=130
      // q6 "time busy overwhelm…": eC+12=142
      // q7 "Immediately": eC+10=152, urgencyBoost=15
      // Final approx: eC≈152, stratPos≈80, lA≈70
      q1_stage: "Building the foundation",
      q2_size: "Just me",
      q3_challenge: "We need help executing our strategy",
      q4_friction: [],
      q5_impact: "More time",
      q6_fix: "time busy overwhelm execute implement deadline juggle",
      q7_timeline: "Immediately",
    },
  },
];

// ---------------------------------------------------------------------------
// Helper assertions
// ---------------------------------------------------------------------------

function assertDiagnosticFields(result: DiagnosticResult, label: string) {
  const ctx = `[${label}]`;

  // businessHealthScore must be finite in [30, 95]
  expect(
    Number.isFinite(result.businessHealthScore),
    `${ctx} businessHealthScore is not finite`
  ).toBe(true);
  expect(result.businessHealthScore, `${ctx} businessHealthScore must be >= 30`).toBeGreaterThanOrEqual(30);
  expect(result.businessHealthScore, `${ctx} businessHealthScore must be <= 95`).toBeLessThanOrEqual(95);

  // confidence in [50, 95]
  expect(Number.isFinite(result.confidence), `${ctx} confidence is not finite`).toBe(true);
  expect(result.confidence, `${ctx} confidence must be >= 50`).toBeGreaterThanOrEqual(50);
  expect(result.confidence, `${ctx} confidence must be <= 95`).toBeLessThanOrEqual(95);

  // ── New composite metric fields ────────────────────────────────────────────

  expect(
    Number.isFinite(result.growthReadiness),
    `${ctx} growthReadiness is not finite (got: ${result.growthReadiness})`
  ).toBe(true);
  expect(result.growthReadiness, `${ctx} growthReadiness must be >= 20`).toBeGreaterThanOrEqual(20);
  expect(result.growthReadiness, `${ctx} growthReadiness must be <= 90`).toBeLessThanOrEqual(90);

  expect(
    Number.isFinite(result.aiOpportunityScore),
    `${ctx} aiOpportunityScore is not finite (got: ${result.aiOpportunityScore})`
  ).toBe(true);
  expect(result.aiOpportunityScore, `${ctx} aiOpportunityScore must be >= 20`).toBeGreaterThanOrEqual(20);
  expect(result.aiOpportunityScore, `${ctx} aiOpportunityScore must be <= 90`).toBeLessThanOrEqual(90);

  expect(
    Number.isFinite(result.operationalEfficiency),
    `${ctx} operationalEfficiency is not finite (got: ${result.operationalEfficiency})`
  ).toBe(true);
  expect(result.operationalEfficiency, `${ctx} operationalEfficiency must be >= 15`).toBeGreaterThanOrEqual(15);
  expect(result.operationalEfficiency, `${ctx} operationalEfficiency must be <= 88`).toBeLessThanOrEqual(88);

  // estimatedHoursLostWeekly — non-empty string
  expect(
    typeof result.estimatedHoursLostWeekly === "string" &&
      result.estimatedHoursLostWeekly.length > 0,
    `${ctx} estimatedHoursLostWeekly is empty/not a string (got: ${String(result.estimatedHoursLostWeekly)})`
  ).toBe(true);

  // revenueLeakageLevel — one of 4 valid values
  const validLeakageLevels = ["Low", "Moderate", "High", "Critical"];
  expect(
    typeof result.revenueLeakageLevel === "string" &&
      result.revenueLeakageLevel.length > 0,
    `${ctx} revenueLeakageLevel is empty/not a string`
  ).toBe(true);
  expect(
    validLeakageLevels.includes(result.revenueLeakageLevel),
    `${ctx} revenueLeakageLevel must be one of [${validLeakageLevels.join(", ")}] (got: "${result.revenueLeakageLevel}")`
  ).toBe(true);

  // ── Category scores [0, 100] ───────────────────────────────────────────────
  const catKeys = [
    "strategy",
    "marketing",
    "operations",
    "customerExperience",
    "aiReadiness",
    "leadershipCapacity",
    "execution",
  ] as const;
  for (const key of catKeys) {
    const val = result.categoryScores[key];
    expect(
      Number.isFinite(val),
      `${ctx} categoryScores.${key} is not finite (got: ${val})`
    ).toBe(true);
    expect(val, `${ctx} categoryScores.${key} must be >= 0`).toBeGreaterThanOrEqual(0);
    expect(val, `${ctx} categoryScores.${key} must be <= 100`).toBeLessThanOrEqual(100);
  }

  // evidence bullets must be an array
  expect(Array.isArray(result.evidenceBullets), `${ctx} evidenceBullets must be an array`).toBe(true);

  // primary and secondary must be known DiagnosisKey values
  const knownKeys: DiagnosisKey[] = [
    "customerAcquisition",
    "salesProcess",
    "operationalCapacity",
    "leadershipAlignment",
    "customerJourney",
    "aiAdoption",
    "strategicPositioning",
    "dataVisibility",
    "marketingConsistency",
    "executionCapacity",
  ];
  expect(
    knownKeys.includes(result.primaryDiagnosis),
    `${ctx} primaryDiagnosis "${result.primaryDiagnosis}" is not a known key`
  ).toBe(true);
  expect(
    knownKeys.includes(result.secondaryDiagnosis),
    `${ctx} secondaryDiagnosis "${result.secondaryDiagnosis}" is not a known key`
  ).toBe(true);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Scoring engine — DiagnosticResult field validation", () => {
  // One test per DiagnosisKey path — verifies both the routing AND field validity
  for (const { label, answers, expectedPrimary } of ANSWER_SETS) {
    test(`${expectedPrimary} — ${label}`, () => {
      const result = runDiagnosticEngine(answers);

      expect(
        result.primaryDiagnosis,
        `Expected primaryDiagnosis="${expectedPrimary}" for "${label}" but got "${result.primaryDiagnosis}"`
      ).toBe(expectedPrimary);

      assertDiagnosticFields(result, label);
    });
  }

  test("all 10 DiagnosisKey paths appear at least once across answer sets", () => {
    const seen = new Set<DiagnosisKey>();

    for (const { answers } of ANSWER_SETS) {
      const result = runDiagnosticEngine(answers);
      seen.add(result.primaryDiagnosis);
    }

    const allKeys: DiagnosisKey[] = [
      "customerAcquisition",
      "salesProcess",
      "operationalCapacity",
      "leadershipAlignment",
      "customerJourney",
      "aiAdoption",
      "strategicPositioning",
      "dataVisibility",
      "marketingConsistency",
      "executionCapacity",
    ];

    for (const key of allKeys) {
      expect(
        seen.has(key),
        `DiagnosisKey "${key}" was not the primary diagnosis for any answer set`
      ).toBe(true);
    }
  });

  test("estimatedHoursLostWeekly produces at least 2 distinct bands across answer sets", () => {
    const bands = new Set<string>();
    for (const { answers } of ANSWER_SETS) {
      bands.add(runDiagnosticEngine(answers).estimatedHoursLostWeekly);
    }
    expect(bands.size, "Must see multiple estimatedHoursLostWeekly bands").toBeGreaterThanOrEqual(2);
  });

  test("revenueLeakageLevel produces at least 2 distinct levels across answer sets", () => {
    const levels = new Set<string>();
    for (const { answers } of ANSWER_SETS) {
      levels.add(runDiagnosticEngine(answers).revenueLeakageLevel);
    }
    expect(levels.size, "Must see multiple revenueLeakageLevel values").toBeGreaterThanOrEqual(2);
  });

  test("edge case: empty friction array and minimal text produce valid fields", () => {
    const result = runDiagnosticEngine({
      q1_stage: "Building the foundation",
      q2_size: "Just me",
      q3_challenge: "We don't know what to focus on",
      q4_friction: [],
      q5_impact: "More time",
      q6_fix: "",
      q7_timeline: "Just Exploring",
    });
    assertDiagnosticFields(result, "empty friction + minimal text");
  });

  test("edge case: 50+ team with max frictions produces valid fields", () => {
    const result = runDiagnosticEngine({
      q1_stage: "Scaling our team",
      q2_size: "50+",
      q3_challenge: "Our team is stretched too thin",
      q4_friction: ["Lead Generation", "Operations", "AI"],
      q5_impact: "AI implementation",
      q6_fix: "automat process system lead pipeline",
      q7_timeline: "Immediately",
    });
    assertDiagnosticFields(result, "50+ team + max frictions");
  });
});
