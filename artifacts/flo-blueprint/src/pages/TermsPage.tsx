import { Link } from "wouter";
import { TymFloLogo } from "@/components/TymFloLogo";

export default function TermsPage() {
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
            Terms &amp; Conditions
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            Effective Date: July 10, 2026 &nbsp;&middot;&nbsp; Last Updated: July 10, 2026
          </p>
        </div>

        <div className="prose-legal space-y-8 font-sans text-sm text-foreground/80 leading-relaxed">

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using The Flo Blueprint™ platform (the "Platform"), operated by TymFlo
              ("Company," "we," "us," or "our"), you agree to be bound by these Terms &amp; Conditions
              ("Terms"). If you do not agree to these Terms, do not access or use the Platform.
            </p>
            <p className="mt-3">
              These Terms apply to all visitors, users, and others who access or use the Platform,
              including participants in any assessment or event at which the Platform is made available.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p>
              The Flo Blueprint™ is a business intelligence assessment platform that provides users with
              a diagnostic evaluation of their business operations across seven key dimensions. Upon
              completing the assessment, users receive a Business Health Score, category breakdowns,
              a Flo Blueprint Profile, and an Executive Report containing prioritized recommendations
              and an implementation roadmap.
            </p>
            <p className="mt-3">
              The Platform is made available at conferences, corporate events, and online as a lead
              capture and business intelligence tool operated by TymFlo. Access to the full Executive
              Report requires account creation.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">3. Intellectual Property</h2>
            <p>
              The Flo Blueprint™ is a proprietary methodology developed and owned exclusively by TymFlo.
              All content, scoring algorithms, diagnostic frameworks, profiles, report templates, visual
              designs, branding elements, and software comprising the Platform are the intellectual
              property of TymFlo and are protected by applicable copyright, trademark, and trade secret
              laws.
            </p>
            <p className="mt-3">
              You are granted a limited, non-exclusive, non-transferable, revocable license to access
              and use the Platform for your personal or internal business evaluation purposes. You may
              not reproduce, distribute, modify, create derivative works from, publicly display, or
              commercially exploit any part of the Platform without the express prior written consent
              of TymFlo.
            </p>
            <p className="mt-3">
              "The Flo Blueprint™," "TymFlo," "Less Work. More Flo.™" and related marks are trademarks
              or service marks of TymFlo. Nothing in these Terms grants you any right to use these marks.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">4. No Professional Advice Disclaimer</h2>
            <p>
              The Flo Blueprint™ assessment and all outputs, including Business Health Scores, diagnostic
              results, Flo Blueprint Profiles, and Executive Reports, are provided for <strong>educational
              and informational purposes only</strong>. They do not constitute legal, financial, accounting,
              tax, investment, or professional consulting advice of any kind.
            </p>
            <p className="mt-3">
              The assessment is based solely on your self-reported responses to a structured questionnaire.
              Results reflect patterns and generalizations derived from those responses and should not be
              relied upon as a substitute for individualized professional advice tailored to your specific
              business circumstances.
            </p>
            <p className="mt-3">
              TymFlo does not guarantee any specific business outcomes, revenue improvements, efficiency
              gains, or other results from use of the Platform or implementation of any recommendations
              contained in your Executive Report. Business outcomes depend on many factors beyond the
              scope of this assessment.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">5. Data Collection and Use</h2>
            <p>
              By using the Platform, you consent to the collection, storage, and use of information you
              provide, including your name, email address, phone number, company name, job title, website,
              and your responses to assessment questions. This information is used to generate your
              diagnostic results, deliver your Executive Report, and for TymFlo's internal business
              development and follow-up purposes.
            </p>
            <p className="mt-3">
              Your data may be shared with TymFlo team members and, where enabled, synchronized to a
              TymFlo-operated Google Sheets workspace for lead management. TymFlo does not sell your
              personal data to third parties.
            </p>
            <p className="mt-3">
              For complete information on how we collect, store, and use your data, please review our{" "}
              <Link href="/privacy" className="text-[#463176] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">6. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Use the Platform for any unlawful purpose or in violation of any applicable regulations</li>
              <li>Submit false, misleading, or fraudulent information in the assessment</li>
              <li>Attempt to reverse-engineer, decompile, or extract the Platform's scoring algorithms or proprietary methodology</li>
              <li>Use automated tools, bots, or scripts to access or interact with the Platform</li>
              <li>Interfere with or disrupt the integrity or performance of the Platform</li>
              <li>Resell, relicense, or commercially exploit your access to the Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">7. Third-Party Services</h2>
            <p>
              The Platform integrates with third-party services including Clerk (authentication), Stripe
              (payment processing), and Google Sheets (data synchronization). Your use of these services
              is subject to their respective terms of service and privacy policies. TymFlo is not
              responsible for the practices or content of third-party services.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, TymFlo and its officers, directors,
              employees, agents, and affiliates shall not be liable for any indirect, incidental, special,
              consequential, punitive, or exemplary damages arising out of or related to your use of,
              or inability to use, the Platform — including but not limited to loss of revenue, loss of
              profits, loss of business, or loss of data — even if TymFlo has been advised of the
              possibility of such damages.
            </p>
            <p className="mt-3">
              TymFlo's total aggregate liability to you for any claims arising under or related to these
              Terms shall not exceed the greater of (a) the amount you paid to TymFlo in the twelve
              months preceding the claim, or (b) one hundred dollars (US$100).
            </p>
            <p className="mt-3">
              Some jurisdictions do not allow the exclusion or limitation of certain warranties or
              liabilities, so the above limitations may not apply to you in full.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">9. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided "as is" and "as available" without warranty of any kind, express
              or implied, including but not limited to warranties of merchantability, fitness for a
              particular purpose, accuracy, or non-infringement. TymFlo does not warrant that the
              Platform will be uninterrupted, error-free, or free from harmful components.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless TymFlo and its affiliates, officers,
              directors, employees, and agents from and against any claims, liabilities, damages, losses,
              and expenses (including reasonable attorneys' fees) arising out of or in connection with
              your use of the Platform, your violation of these Terms, or your violation of any rights
              of another person or entity.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">11. Changes to These Terms</h2>
            <p>
              TymFlo reserves the right to modify these Terms at any time. Changes will be effective
              upon posting to the Platform with an updated "Last Updated" date. Your continued use of
              the Platform after changes are posted constitutes your acceptance of the revised Terms.
              We encourage you to review these Terms periodically.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">12. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State
              of Michigan, without regard to its conflict of law provisions. Any dispute arising
              under or related to these Terms shall be resolved exclusively in the state or federal
              courts located in Michigan, and you consent to the personal jurisdiction of such
              courts.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">13. Entire Agreement</h2>
            <p>
              These Terms, together with the{" "}
              <Link href="/privacy" className="text-[#463176] hover:underline">
                Privacy Policy
              </Link>
              , constitute the entire agreement between you and TymFlo with respect to the Platform and
              supersede all prior agreements and understandings relating to the same subject matter.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">14. Contact</h2>
            <p>
              If you have questions about these Terms, please contact TymFlo at{" "}
              <a
                href="mailto:hello@tymflo.com"
                className="text-[#463176] hover:underline"
              >
                hello@tymflo.com
              </a>
              .
            </p>
          </section>

          <p className="pt-4 border-t border-border text-xs text-muted-foreground">
            <strong>Note:</strong> These Terms are a good-faith initial draft. TymFlo recommends
            consulting with a licensed attorney before going live with this platform to ensure
            compliance with applicable laws in your jurisdiction.
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
