import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthUser } from "@/lib/useAuthUser";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TymFloLogo } from "@/components/TymFloLogo";
import { loadState, saveState } from "@/lib/state";
import { DiagnosticResult, DIAGNOSIS_LABELS } from "@/lib/scoring";
import { FloProfile } from "@/lib/profiles";
import { useSubmitLead } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const REVENUE_RANGES = [
  "Under $250K",
  "$250K – $500K",
  "$500K – $1M",
  "$1M – $5M",
  "$5M – $10M",
  "$10M+",
];

const INDUSTRIES = [
  "Consulting & Professional Services",
  "Technology & SaaS",
  "Healthcare & Wellness",
  "Financial Services",
  "Real Estate",
  "E-commerce & Retail",
  "Manufacturing & Operations",
  "Marketing & Creative",
  "Education & Training",
  "Non-profit & Government",
  "Other",
];

const profileSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Your role is required"),
  industry: z.string().min(1, "Industry is required"),
  annualRevenue: z.string().min(1, "Annual revenue range is required"),
  website: z.string().optional(),
  phone: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileFormPage() {
  const [, setLocation] = useLocation();
  const { user, isLoaded } = useAuthUser();
  const submitLead = useSubmitLead();
  const state = loadState();
  const diagnostic = state.diagnostic as DiagnosticResult | null;
  const profile = state.profile as FloProfile | null;

  useEffect(() => {
    if (!diagnostic || !profile) {
      setLocation("/");
      return;
    }
    // Only skip profile form if the existing lead belongs to this exact user
    if (state.lead?.company && state.lead?.clerkUserId === user?.id) {
      setLocation("/report");
    }
  }, [diagnostic, profile, state.lead, user]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { company: "", role: "", industry: "", annualRevenue: "", website: "", phone: "" },
  });

  if (!isLoaded || !diagnostic || !profile) return null;

  if (!user) {
    setLocation("/sign-in");
    return null;
  }

  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  const email = user.primaryEmailAddress?.emailAddress || "";

  function onSubmit(values: ProfileFormValues) {
    const answers = state.answers as Record<string, string | string[]>;
    const primaryLabel = DIAGNOSIS_LABELS[diagnostic!.primaryDiagnosis];

    const leadInfo = {
      clerkUserId: user!.id,
      firstName,
      lastName,
      email,
      phone: values.phone || undefined,
      company: values.company,
      website: values.website || undefined,
      role: values.role,
      industry: values.industry,
      annualRevenue: values.annualRevenue,
    };

    const payload = {
      clerkUserId: user!.id,
      firstName,
      lastName,
      email,
      phone: values.phone || null,
      company: values.company,
      website: values.website || null,
      role: values.role,
      industry: values.industry,
      annualRevenue: values.annualRevenue,
      consentToContact: true,
      answers: {
        q1_stage: (answers.q1_stage as string) || "",
        q2_size: (answers.q2_size as string) || "",
        q3_challenge: (answers.q3_challenge as string) || "",
        q4_friction: Array.isArray(answers.q4_friction) ? answers.q4_friction.join(", ") : (answers.q4_friction as string) || "",
        q5_impact: (answers.q5_impact as string) || "",
        q6_fix: (answers.q6_fix as string) || "",
        q7_timeline: (answers.q7_timeline as string) || "",
      },
      categoryScores: diagnostic!.categoryScores,
      businessHealthScore: diagnostic!.businessHealthScore,
      primaryConstraint: primaryLabel,
      floProfile: profile!.name,
      confidencePercentage: diagnostic!.confidence,
      estimatedImpact: profile!.impactOutcomes.join("; "),
      recommendedService: profile!.tymFloService,
      eventSource: state.tracking.eventSource || null,
      qrCodeId: state.tracking.qrCodeId || null,
      campaign: state.tracking.campaign || null,
      utmSource: state.tracking.utmSource || null,
      utmMedium: state.tracking.utmMedium || null,
      utmCampaign: state.tracking.utmCampaign || null,
    };

    submitLead.mutate(
      { data: payload },
      {
        onSuccess: (data) => {
          saveState({
            ...state,
            currentStep: "report",
            lead: { ...leadInfo, id: data.id },
          });
          setLocation("/report");
        },
        onError: () => {
          saveState({ ...state, currentStep: "report", lead: leadInfo });
          setLocation("/report");
        },
      }
    );
  }

  return (
    <>
      <a href="#profile-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded">Skip to content</a>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/60 px-6 md:px-12 py-5">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <a href="/" aria-label="TymFlo — return to homepage">
              <TymFloLogo variant="horizontal" className="h-7 w-auto" alt="TymFlo" />
            </a>
            <span className="font-sans text-xs text-muted-foreground uppercase tracking-widest">Complete Your Profile</span>
          </div>
        </header>

        <main id="profile-content" className="max-w-2xl mx-auto px-6 md:px-12 py-12 md:py-16">
          <div className="mb-10">
            <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] mb-3 font-medium">One More Step</p>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Complete Your Business Profile
            </h1>
            <p className="font-sans text-foreground/70 leading-relaxed">
              Tell us about your business so we can personalize your executive report and recommendations.
            </p>
          </div>

          {/* Signed-in user preview */}
          <div className="bg-card border border-card-border rounded-2xl p-5 mb-8 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-sans font-bold text-white text-sm flex-shrink-0" style={{ background: "#463176" }}>
              {firstName.charAt(0)}{lastName.charAt(0)}
            </div>
            <div>
              <p className="font-sans text-sm font-semibold text-foreground">{firstName} {lastName}</p>
              <p className="font-sans text-xs text-muted-foreground">{email}</p>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center gap-1.5 font-sans text-xs text-[#22C55E] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" aria-hidden="true" />
                Verified
              </span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate aria-label="Business profile form" className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField control={form.control} name="company" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-sans text-sm text-foreground">Company *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company" placeholder="Acme Inc." autoComplete="organization" className="rounded-xl border-2 focus:border-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-sans text-sm text-foreground">Your Role *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-role" placeholder="CEO, Founder, VP..." autoComplete="organization-title" className="rounded-xl border-2 focus:border-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="industry" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-sans text-sm text-foreground">Industry *</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      data-testid="select-industry"
                      className="w-full h-10 px-3 py-2 font-sans text-sm border-2 border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                      <option value="">Select your industry</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="annualRevenue" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-sans text-sm text-foreground">Annual Revenue *</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      data-testid="select-revenue"
                      className="w-full h-10 px-3 py-2 font-sans text-sm border-2 border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                      <option value="">Select revenue range</option>
                      {REVENUE_RANGES.map((range) => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-sans text-sm text-foreground">Phone (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" data-testid="input-phone" placeholder="+1 (555) 000-0000" autoComplete="tel" className="rounded-xl border-2 focus:border-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="website" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-sans text-sm text-foreground">Website (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" data-testid="input-website" placeholder="https://company.com" autoComplete="url" className="rounded-xl border-2 focus:border-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <button
                type="submit"
                disabled={submitLead.isPending}
                data-testid="button-submit-profile"
                className="w-full px-8 py-4 font-sans font-semibold text-white rounded-full transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed min-h-[52px]"
                style={{ background: "#463176" }}
              >
                {submitLead.isPending ? "Generating Your Report..." : "Access My Executive Report"}
              </button>

              <p className="font-sans text-xs text-muted-foreground text-center">
                Your information is kept confidential and will never be sold or shared.
              </p>
            </form>
          </Form>
        </main>

        <footer className="border-t border-border/60 px-6 md:px-12 py-6 mt-8">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-sans text-xs text-muted-foreground text-center">
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
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
