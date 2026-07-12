import { AssessmentAnswers, DiagnosticResult, runDiagnosticEngine } from "./scoring";
import { FloProfile, getProfile } from "./profiles";

export type { AssessmentAnswers };

export interface AppState {
  currentStep: "landing" | "assessment" | "dashboard" | "report";
  answers: Partial<AssessmentAnswers>;
  diagnostic: DiagnosticResult | null;
  profile: FloProfile | null;
  lead: LeadInfo | null;
  tracking: TrackingParams;
  selectedFocus?: string;
  stripeSessionId?: string;
}

export interface LeadInfo {
  id?: string;
  clerkUserId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  website?: string;
  role: string;
  industry?: string;
  annualRevenue?: string;
}

export interface TrackingParams {
  eventSource?: string;
  qrCodeId?: string;
  campaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const STORAGE_KEY = "flo_blueprint_state";

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {}
  return createInitialState();
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function createInitialState(): AppState {
  return {
    currentStep: "landing",
    answers: {},
    diagnostic: null,
    profile: null,
    lead: null,
    tracking: {},
  };
}

export function computeResults(answers: AssessmentAnswers): { diagnostic: DiagnosticResult; profile: FloProfile } {
  const diagnostic = runDiagnosticEngine(answers);
  const profile = getProfile(diagnostic);
  return { diagnostic, profile };
}

export function readTrackingParams(): TrackingParams {
  const params = new URLSearchParams(window.location.search);
  return {
    eventSource: params.get("event") || params.get("source") || undefined,
    qrCodeId: params.get("qr") || params.get("qr_id") || undefined,
    campaign: params.get("campaign") || undefined,
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
  };
}

export const CATEGORY_LABELS: Record<string, string> = {
  strategy: "Strategy",
  marketing: "Marketing",
  operations: "Operations",
  customerExperience: "Customer Experience",
  aiReadiness: "AI Readiness",
  leadershipCapacity: "Leadership Capacity",
  execution: "Execution",
};
