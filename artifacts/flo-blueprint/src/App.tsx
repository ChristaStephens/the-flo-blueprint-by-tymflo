import { useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/LandingPage";
import AssessmentPage from "@/pages/AssessmentPage";
import DashboardPage from "@/pages/DashboardPage";
import ReportPage from "@/pages/ReportPage";
import ProfileFormPage from "@/pages/ProfileFormPage";
import CheckoutSuccessPage from "@/pages/CheckoutSuccessPage";
import DebriefFocusPage from "@/pages/DebriefFocusPage";
import DebriefScheduledPage from "@/pages/DebriefScheduledPage";
import AdminListPage from "@/pages/AdminListPage";
import AdminDetailPage from "@/pages/AdminDetailPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import NotFound from "@/pages/not-found";
import { loadState, saveState, readTrackingParams } from "@/lib/state";
import { E2E_USER_KEY } from "@/lib/useAuthUser";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#463176",
    colorForeground: "#1a1625",
    colorMutedForeground: "#6b6680",
    colorDanger: "#EF4444",
    colorBackground: "#fafaf7",
    colorInput: "#ffffff",
    colorInputForeground: "#1a1625",
    colorNeutral: "#e5e3ee",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0px",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white shadow-xl w-[440px] max-w-full overflow-hidden border border-[#e5e3ee]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-serif text-2xl font-bold text-[#1a1625]",
    headerSubtitle: "font-sans text-sm text-[#6b6680]",
    socialButtonsBlockButtonText: "font-sans text-sm font-medium text-[#1a1625]",
    formFieldLabel: "font-sans text-sm font-medium text-[#1a1625]",
    footerActionLink: "font-sans text-sm font-medium text-[#463176]",
    footerActionText: "font-sans text-sm text-[#6b6680]",
    dividerText: "font-sans text-xs text-[#6b6680]",
    identityPreviewEditButton: "font-sans text-sm text-[#463176]",
    formFieldSuccessText: "font-sans text-sm text-[#22C55E]",
    alertText: "font-sans text-sm text-[#EF4444]",
    logoBox: "flex justify-center py-2",
    logoImage: "h-8 w-auto",
    socialButtonsBlockButton: "border border-[#e5e3ee] hover:bg-[#fafaf7] transition-colors",
    formButtonPrimary: "bg-[#463176] hover:opacity-90 transition-opacity font-sans font-semibold",
    formFieldInput: "border-[#e5e3ee] font-sans text-sm focus:border-[#463176] focus:ring-[#463176]",
    footerAction: "bg-[#f5f5f2] border-t border-[#e5e3ee]",
    dividerLine: "bg-[#e5e3ee]",
    alert: "bg-[#fef2f2] border border-[#fecaca]",
    otpCodeFieldInput: "border-[#e5e3ee] focus:border-[#463176]",
    formFieldRow: "gap-3",
    main: "gap-5",
  },
};

function TrackingInit() {
  useEffect(() => {
    const tracking = readTrackingParams();
    const state = loadState();
    if (Object.values(tracking).some(Boolean)) {
      saveState({ ...state, tracking });
    }
  }, []);
  return null;
}

// Clears lead + report state when the user signs out so the next user on the
// same device does not inherit a previous user's report.
function ClerkSessionMonitor() {
  const { addListener } = useClerk();
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      if (!user) {
        // In DEV mode, skip clearing when the E2E auth bypass is active so that
        // Playwright tests can inject state and navigate to /report without
        // Clerk's headless "no session" event wiping the lead from localStorage.
        if (import.meta.env.DEV && localStorage.getItem(E2E_USER_KEY)) return;
        const state = loadState();
        if (state.lead) {
          saveState({
            ...state,
            lead: null,
            currentStep: state.diagnostic ? "dashboard" : "landing",
          });
        }
      }
    });
    return unsubscribe;
  }, [addListener]);
  return null;
}

function RedirectToCorrectStep() {
  const [, setLocation] = useLocation();
  const { user, isLoaded } = useUser();
  useEffect(() => {
    if (!isLoaded) return;
    const state = loadState();
    if (state.currentStep === "report" && state.lead) {
      if (!user) {
        setLocation("/sign-in");
      } else if (state.lead.clerkUserId && state.lead.clerkUserId !== user.id) {
        // Lead belongs to a different user — reset to dashboard for this user
        saveState({ ...state, lead: null, currentStep: state.diagnostic ? "dashboard" : "landing" });
        if (state.diagnostic) setLocation("/dashboard");
        // else fall through to landing (no navigation needed)
      } else {
        setLocation("/report");
      }
    } else if (state.currentStep === "dashboard" && state.diagnostic) {
      setLocation("/dashboard");
    } else if (state.currentStep === "assessment") {
      setLocation("/assessment");
    }
  }, [isLoaded, user]);
  return <LandingPage />;
}

function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] mb-2 font-medium">The Flo Blueprint™</p>
        <p className="font-sans text-sm text-muted-foreground">Save your executive report and access your personalized roadmap</p>
      </div>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/profile`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] mb-2 font-medium">The Flo Blueprint™</p>
        <p className="font-sans text-sm text-muted-foreground">Create your account to save your executive report</p>
      </div>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/profile`}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AdminGuard({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [, setLocation] = useLocation();
  const [adminStatus, setAdminStatus] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLocation("/sign-in");
      return;
    }
    async function checkAdmin() {
      try {
        const token = await getToken();
        const res = await fetch("/api/admin/leads", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setAdminStatus("allowed");
        } else if (res.status === 403) {
          setLocation("/");
        } else {
          setLocation("/sign-in");
        }
      } catch {
        setAdminStatus("denied");
      }
    }
    checkAdmin();
  }, [isLoaded, user, getToken, setLocation]);

  if (!isLoaded || adminStatus === "checking") return null;
  if (adminStatus !== "allowed") return null;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RedirectToCorrectStep} />
      <Route path="/assessment" component={AssessmentPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/profile" component={ProfileFormPage} />
      <Route path="/report" component={ReportPage} />
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route path="/debrief/focus" component={DebriefFocusPage} />
      <Route path="/debrief/scheduled" component={DebriefScheduledPage} />
      <Route path="/admin/leads/:id">
        {() => <AdminGuard component={() => <AdminDetailPage />} />}
      </Route>
      <Route path="/admin">
        {() => <AdminGuard component={AdminListPage} />}
      </Route>
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Save Your Blueprint",
            subtitle: "Sign in to access your executive report",
          },
        },
        signUp: {
          start: {
            title: "Create Your Account",
            subtitle: "Save your Flo Blueprint and executive report",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ClerkSessionMonitor />
        <TooltipProvider>
          <TrackingInit />
          <Router />
        </TooltipProvider>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
