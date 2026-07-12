import { Link } from "wouter";
import { TymFloLogo } from "@/components/TymFloLogo";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col print:bg-white">
      <header className="border-b border-border/60 px-6 md:px-12 py-5 no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" aria-label="TymFlo — return to homepage">
            <TymFloLogo variant="horizontal" className="h-7 w-auto" alt="TymFlo" />
          </Link>
          <span className="font-sans text-xs text-muted-foreground uppercase tracking-widest">
            Legal
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-16 w-full">
        <div className="mb-10">
          <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] mb-3 font-medium">
            The Flo Blueprint™
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
            Privacy Policy
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            Effective Date: July 10, 2026 &nbsp;&middot;&nbsp; Last Updated: July 10, 2026
          </p>
        </div>

        <div className="space-y-8 font-sans text-sm text-foreground/80 leading-relaxed">

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">1. Overview</h2>
            <p>
              TymFlo ("Company," "we," "us," or "our") operates The Flo Blueprint™ platform (the
              "Platform"). This Privacy Policy describes how we collect, use, store, and share
              information about you when you use the Platform. By using the Platform, you agree to
              the practices described in this policy.
            </p>
            <p className="mt-3">
              This policy applies to all users of the Platform, including attendees at events where
              The Flo Blueprint™ is offered and users who access the Platform online.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>

            <h3 className="font-sans text-base font-semibold text-foreground mb-2 mt-4">2a. Information You Provide Directly</h3>
            <p>When you use the Platform, you may provide the following information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li><strong>Contact information:</strong> First name, last name, business email address, phone number</li>
              <li><strong>Company information:</strong> Company name, job title or role, company website</li>
              <li><strong>Assessment responses:</strong> Your answers to the seven-question business intelligence assessment, including information about your business stage, operational challenges, revenue levels, team size, technology usage, and growth goals</li>
              <li><strong>Account information:</strong> If you create an account via our authentication provider (Clerk), we receive your email address and, if you sign in via a third-party provider (Google, Microsoft), limited profile data from that provider</li>
            </ul>

            <h3 className="font-sans text-base font-semibold text-foreground mb-2 mt-4">2b. Diagnostic and Assessment Results</h3>
            <p>
              Based on your assessment responses, the Platform generates and stores the following
              derived data:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Business Health Score (overall and by category)</li>
              <li>Flo Blueprint Profile assignment</li>
              <li>Primary and secondary business constraint diagnoses</li>
              <li>Growth Readiness, AI Opportunity, and Operational Efficiency scores</li>
              <li>Prioritized recommendations and implementation roadmap data</li>
            </ul>

            <h3 className="font-sans text-base font-semibold text-foreground mb-2 mt-4">2c. Usage and Tracking Metadata</h3>
            <p>
              We may collect metadata about how you accessed the Platform, including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Event or QR code source (if you scanned a QR code to access the Platform)</li>
              <li>UTM campaign parameters (source, medium, campaign name) from the URL at the time of access</li>
              <li>Approximate session timing</li>
            </ul>

            <h3 className="font-sans text-base font-semibold text-foreground mb-2 mt-4">2d. Browser Storage</h3>
            <p>
              The Platform uses your browser's <strong>localStorage</strong> to preserve your
              assessment progress and results across page refreshes during your session. This data
              is stored locally on your device and includes your assessment answers, diagnostic
              results, and current progress step. It is not a tracking cookie and does not persist
              beyond when you clear your browser storage.
            </p>
            <p className="mt-3">
              The Platform does not use advertising cookies or third-party tracking pixels. Our
              authentication provider (Clerk) may set session cookies necessary for account
              authentication; these are governed by Clerk's privacy policy.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <p>We use the information collected for the following purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Delivering your assessment results</strong> — to generate, display, and store your Business Health Score, Flo Blueprint Profile, and Executive Report</li>
              <li><strong>Business development and follow-up</strong> — TymFlo team members may contact you to discuss your results, answer questions, or present relevant services</li>
              <li><strong>Platform improvement</strong> — to analyze usage patterns (in aggregate) and improve the assessment quality and user experience</li>
              <li><strong>Event management</strong> — at events where the Platform is deployed, your information helps TymFlo understand attendee engagement</li>
              <li><strong>Payment processing</strong> — if you purchase TymFlo services through the Platform, your payment information is processed by Stripe and is not stored by TymFlo directly</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">4. How We Store Your Information</h2>
            <p>
              Your information is stored in a PostgreSQL relational database hosted on Replit's
              infrastructure. The database is access-controlled and is not publicly accessible.
              Replit's platform provides industry-standard infrastructure security.
            </p>
            <p className="mt-3">
              Assessment results and lead records are retained for as long as necessary to support
              TymFlo's business development activities or until you request deletion (see Section 6).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">5. How We Share Your Information</h2>

            <h3 className="font-sans text-base font-semibold text-foreground mb-2 mt-4">5a. TymFlo Team</h3>
            <p>
              Authorized TymFlo team members have access to lead and assessment data for the purposes
              of business development, client follow-up, and service delivery.
            </p>

            <h3 className="font-sans text-base font-semibold text-foreground mb-2 mt-4">5b. Google Sheets (Optional Sync)</h3>
            <p>
              When enabled, TymFlo synchronizes submitted lead data (name, email, phone, company,
              role, website, assessment metadata, and diagnostic results) to a TymFlo-operated
              Google Sheets workspace using Google Apps Script. This integration is used for internal
              lead tracking and team collaboration. The target Google Sheet is access-controlled and
              is not publicly shared. This sync is performed server-side and is not dependent on
              any action from you.
            </p>

            <h3 className="font-sans text-base font-semibold text-foreground mb-2 mt-4">5c. Third-Party Service Providers</h3>
            <p>We use the following third-party services that may process your data:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Clerk</strong> — authentication and account management. Governed by <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#463176] hover:underline">Clerk's Privacy Policy</a>.</li>
              <li><strong>Stripe</strong> — payment processing for TymFlo services. Payment card data is processed and stored by Stripe and is not retained by TymFlo. Governed by <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#463176] hover:underline">Stripe's Privacy Policy</a>.</li>
              <li><strong>Google</strong> — Google Apps Script for Sheets sync, and Google OAuth for sign-in. Governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#463176] hover:underline">Google's Privacy Policy</a>.</li>
              <li><strong>Replit</strong> — cloud infrastructure and database hosting. Governed by <a href="https://replit.com/site/privacy" target="_blank" rel="noopener noreferrer" className="text-[#463176] hover:underline">Replit's Privacy Policy</a>.</li>
            </ul>

            <h3 className="font-sans text-base font-semibold text-foreground mb-2 mt-4">5d. We Do Not Sell Your Data</h3>
            <p>
              TymFlo does not sell, rent, or trade your personal information to any third party for
              their own marketing or commercial purposes.
            </p>

            <h3 className="font-sans text-base font-semibold text-foreground mb-2 mt-4">5e. Legal Requirements</h3>
            <p>
              We may disclose your information if required to do so by law or in response to a valid
              legal process (such as a court order or government request), or to protect the rights,
              property, or safety of TymFlo, our users, or the public.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">6. Your Rights and Choices</h2>
            <p>You have the following rights with respect to your personal data:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Access:</strong> You may request a copy of the personal information TymFlo
                holds about you, including your contact information and assessment results.
              </li>
              <li>
                <strong>Correction:</strong> You may request that we correct inaccurate personal
                information we hold about you.
              </li>
              <li>
                <strong>Deletion:</strong> You may request that we delete your personal information
                from our systems. Note that deletion may affect your ability to access your saved
                Executive Report.
              </li>
              <li>
                <strong>Opt-out of follow-up communications:</strong> You may request to be removed
                from TymFlo's business development outreach at any time by contacting us at the
                address below.
              </li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:hello@tymflo.com" className="text-[#463176] hover:underline">
                hello@tymflo.com
              </a>{" "}
              with the subject line "Data Request." We will respond within 30 days. We may need to
              verify your identity before fulfilling your request.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">7. Data Retention</h2>
            <p>
              We retain your personal information and assessment results for as long as necessary to
              fulfill the purposes described in this policy, or as required by applicable law. If
              you request deletion of your data, we will remove your personal information from active
              systems within a reasonable timeframe, though residual copies may remain in backup
              systems for a limited period.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">8. Children's Privacy</h2>
            <p>
              The Platform is intended for use by business professionals and is not directed at
              children under the age of 13 (or the applicable minimum age in your jurisdiction).
              We do not knowingly collect personal information from children. If you believe we have
              inadvertently collected such information, please contact us immediately so we can
              delete it.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">9. Security</h2>
            <p>
              We take reasonable measures to protect your information from unauthorized access,
              disclosure, alteration, or destruction, including access controls on our database and
              encrypted communications (HTTPS) for all data transmitted to and from the Platform.
              However, no method of transmission over the internet or electronic storage is 100%
              secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this
              page with an updated "Last Updated" date. We encourage you to review this policy
              periodically to stay informed about how we protect your information.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">11. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests related to this Privacy Policy or your
              personal data, please contact TymFlo at:
            </p>
            <div className="mt-3 pl-4 border-l-2 border-border space-y-1">
              <p><strong>TymFlo</strong></p>
              <p>
                Email:{" "}
                <a href="mailto:hello@tymflo.com" className="text-[#463176] hover:underline">
                  hello@tymflo.com
                </a>
              </p>
              <p>
                Website:{" "}
                <a
                  href="https://tymflo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#463176] hover:underline"
                >
                  tymflo.com
                </a>
              </p>
            </div>
          </section>

          <p className="pt-4 border-t border-border text-xs text-muted-foreground">
            <strong>Note:</strong> This Privacy Policy is a good-faith initial draft. TymFlo
            recommends consulting with a licensed attorney and, where applicable, a data protection
            specialist before going live, particularly if users may be located in regions governed
            by GDPR, CCPA, or similar regulations.
          </p>
        </div>
      </main>

      <footer className="border-t border-border/60 px-6 md:px-12 py-6 mt-8 print:hidden">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
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
  );
}
