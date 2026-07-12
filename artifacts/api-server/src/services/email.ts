import { Resend } from "resend";
import { logger } from "../lib/logger";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromEmail(): string {
  return process.env.FROM_EMAIL ?? "TymFlo <hello@tymflo.com>";
}

function brandedEmail(opts: {
  title: string;
  preheader?: string;
  bodyHtml: string;
  ctaUrl?: string;
  ctaLabel?: string;
}): string {
  const { title, preheader = "", bodyHtml, ctaUrl, ctaLabel } = opts;
  const cta = ctaUrl && ctaLabel
    ? `<div style="text-align:center;margin:32px 0;">
         <a href="${ctaUrl}" style="display:inline-block;background:#463176;color:#ffffff;font-family:Inter,sans-serif;font-size:14px;font-weight:600;padding:14px 32px;text-decoration:none;letter-spacing:0.04em;">
           ${ctaLabel}
         </a>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <meta name="x-apple-disable-message-reformatting" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#faf9f5;font-family:Inter,Arial,sans-serif;color:#1a1625;">
  <div style="display:none;max-height:0;overflow:hidden;color:#faf9f5;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#F69679;font-weight:600;">THE FLO BLUEPRINT&trade;</p>
              <p style="margin:4px 0 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#6b6680;">by TymFlo</p>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#ffffff;padding:40px 48px;border:1px solid #e8e5f0;">
              <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#463176;margin:0 0 24px;line-height:1.3;">${title}</h1>
              ${bodyHtml}
              ${cta}
              <p style="margin:32px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#463176;letter-spacing:0.12em;text-transform:uppercase;text-align:center;">Less Work. More Flo.</p>
              <hr style="border:none;border-top:1px solid #e8e5f0;margin:24px 0;" />
              <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#6b6680;line-height:1.6;">
                Questions? Reply to this email or contact us at
                <a href="mailto:hello@tymflo.com" style="color:#463176;text-decoration:none;">hello@tymflo.com</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#9893a7;letter-spacing:0.06em;">Less Work. More Flo.</p>
              <p style="margin:8px 0 0;font-family:Inter,Arial,sans-serif;font-size:10px;color:#c5c1d0;">
                TymFlo &nbsp;&middot;&nbsp; <a href="https://tymflo.com" style="color:#c5c1d0;text-decoration:none;">tymflo.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface EmailResult {
  sent: boolean;
  message: string;
  id?: string;
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
  tag: string;
}): Promise<EmailResult> {
  const resend = getResend();
  if (!resend) {
    logger.warn({ tag: params.tag, to: params.to }, "RESEND_API_KEY not set — email skipped");
    return { sent: false, message: "RESEND_API_KEY not configured" };
  }

  try {
    const payload: Parameters<typeof resend.emails.send>[0] = {
      from: getFromEmail(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    };

    if (params.attachments?.length) {
      payload.attachments = params.attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      }));
    }

    const result = await resend.emails.send(payload);
    if (result.error) {
      logger.warn({ tag: params.tag, to: params.to, error: result.error }, "Resend returned error");
      return { sent: false, message: result.error.message };
    }

    logger.info({ tag: params.tag, to: params.to, id: result.data?.id }, "Email sent");
    return { sent: true, message: "sent", id: result.data?.id };
  } catch (err) {
    logger.warn({ tag: params.tag, to: params.to, err }, "Email send failed (non-fatal)");
    return { sent: false, message: String(err) };
  }
}

// ─── Email 1: Payment Confirmation ───────────────────────────────────────────

export async function sendPaymentConfirmationEmail(params: {
  to: string;
  firstName: string;
  amount: string;
  purchaseDate: string;
  focusUrl: string;
  reportUrl: string;
}): Promise<EmailResult> {
  const bodyHtml = `
    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1625;line-height:1.7;margin:0 0 20px;">
      Hi ${params.firstName},
    </p>
    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1625;line-height:1.7;margin:0 0 20px;">
      Your payment of <strong>${params.amount}</strong> has been confirmed. Your Flo Blueprint&trade; Executive Debrief is now booked and our team is preparing for your session.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0eef8;padding:20px 24px;margin:0 0 24px;">
      <tr><td>
        <p style="margin:0 0 8px;font-family:Inter,Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6b6680;font-weight:600;">Receipt</p>
        <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#1a1625;line-height:1.6;">
          <strong>Service:</strong> Flo Blueprint&trade; Executive Debrief<br />
          <strong>Amount:</strong> ${params.amount}<br />
          <strong>Date:</strong> ${params.purchaseDate}
        </p>
      </td></tr>
    </table>
    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1625;line-height:1.7;margin:0 0 8px;">
      <strong>Your next step:</strong> Choose your focus area so we can tailor your session.
    </p>
    <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#6b6680;line-height:1.7;margin:0 0 8px;">
      You can also
      <a href="${params.reportUrl}" style="color:#463176;text-decoration:none;">view your full Flo Blueprint Executive Report</a>
      at any time before your session.
    </p>`;

  return sendEmail({
    to: params.to,
    subject: "Your Flo Blueprint™ Executive Debrief Is Confirmed",
    html: brandedEmail({
      title: "Your Executive Debrief Is Confirmed",
      preheader: `Payment of ${params.amount} received. Choose your focus area to get started.`,
      bodyHtml,
      ctaUrl: params.focusUrl,
      ctaLabel: "Choose Your Focus Area",
    }),
    tag: "payment_confirmation",
  });
}

// ─── Email 1b: Service Card Purchase Confirmation ────────────────────────────

export async function sendServiceConfirmationEmail(params: {
  to: string;
  firstName: string;
  serviceName: string;
  amount: string;
  purchaseDate: string;
  schedulingUrl: string;
}): Promise<EmailResult> {
  const bodyHtml = `
    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1625;line-height:1.7;margin:0 0 20px;">
      Hi ${params.firstName},
    </p>
    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1625;line-height:1.7;margin:0 0 20px;">
      Your payment of <strong>${params.amount}</strong> has been received. Your <strong>${params.serviceName}</strong> engagement with TymFlo is confirmed, and our team is looking forward to working with you.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0eef8;padding:20px 24px;margin:0 0 24px;">
      <tr><td>
        <p style="margin:0 0 8px;font-family:Inter,Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6b6680;font-weight:600;">Receipt</p>
        <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#1a1625;line-height:1.6;">
          <strong>Service:</strong> ${params.serviceName}<br />
          <strong>Amount:</strong> ${params.amount}<br />
          <strong>Date:</strong> ${params.purchaseDate}
        </p>
      </td></tr>
    </table>
    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1625;line-height:1.7;margin:0 0 8px;">
      <strong>Your next step:</strong> Schedule your session so we can get to work.
    </p>
    <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#6b6680;line-height:1.7;margin:0 0 20px;">
      Use the link below to choose a time that works for you. You'll receive a calendar invitation with the video call link immediately after booking.
    </p>`;

  return sendEmail({
    to: params.to,
    subject: `Your ${params.serviceName} Is Confirmed — Schedule Your Session`,
    html: brandedEmail({
      title: `Your ${params.serviceName} Is Confirmed`,
      preheader: `Payment of ${params.amount} received. Schedule your session to get started.`,
      bodyHtml,
      ctaUrl: params.schedulingUrl,
      ctaLabel: "Schedule Your Session",
    }),
    tag: "service_confirmation",
  });
}

// ─── Email 2: Appointment Confirmation ───────────────────────────────────────

export async function sendAppointmentConfirmationEmail(params: {
  to: string;
  firstName: string;
  bookingDate: Date;
  selectedFocus?: string | null;
  tidyCalUrl: string;
  reportUrl: string;
}): Promise<EmailResult> {
  const FOCUS_LABELS: Record<string, string> = {
    clarity: "Gaining Strategic Clarity",
    qualified_leads: "Generating More Qualified Leads",
    save_time: "Recovering Time and Reducing Friction",
    implementation: "Full Implementation Support",
  };

  const focusLabel = params.selectedFocus
    ? (FOCUS_LABELS[params.selectedFocus] ?? params.selectedFocus)
    : null;

  const dateStr = params.bookingDate.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const bodyHtml = `
    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1625;line-height:1.7;margin:0 0 20px;">
      Hi ${params.firstName},
    </p>
    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1625;line-height:1.7;margin:0 0 20px;">
      Your Executive Debrief session is scheduled. Here are your session details:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0eef8;padding:20px 24px;margin:0 0 24px;">
      <tr><td>
        <p style="margin:0 0 8px;font-family:Inter,Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6b6680;font-weight:600;">Session Details</p>
        <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#1a1625;line-height:1.8;">
          <strong>Date &amp; Time:</strong> ${dateStr}<br />
          ${focusLabel ? `<strong>Focus Area:</strong> ${focusLabel}<br />` : ""}
          <strong>Duration:</strong> 45 minutes<br />
          <strong>Format:</strong> Video call (link in your TidyCal confirmation)
        </p>
      </td></tr>
    </table>
    <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#1a1625;line-height:1.7;margin:0 0 16px;"><strong>To prepare for your session:</strong></p>
    <ul style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#1a1625;line-height:1.8;margin:0 0 20px;padding-left:20px;">
      <li>Have your Flo Blueprint Executive Report open during the session</li>
      <li>Identify one or two decisions you want direction on</li>
      <li>Block 45 minutes with no interruptions</li>
    </ul>
    <p style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#6b6680;line-height:1.7;margin:0 0 8px;">
      Need to reschedule? Use your TidyCal link:
      <a href="${params.tidyCalUrl}" style="color:#463176;text-decoration:none;">${params.tidyCalUrl}</a>
    </p>`;

  return sendEmail({
    to: params.to,
    subject: "Your Executive Debrief Is Scheduled",
    html: brandedEmail({
      title: "Your Executive Debrief Is Scheduled",
      preheader: `Session confirmed for ${dateStr}. Here's everything you need to prepare.`,
      bodyHtml,
      ctaUrl: params.reportUrl,
      ctaLabel: "View Your Blueprint Report",
    }),
    tag: "appointment_confirmation",
  });
}

// ─── Email 3: 24-Hour Reminder ────────────────────────────────────────────────

export async function sendReminderEmail(params: {
  to: string;
  firstName: string;
  bookingDate: Date;
  selectedFocus?: string | null;
  tidyCalUrl: string;
  reportUrl: string;
}): Promise<EmailResult> {
  const FOCUS_LABELS: Record<string, string> = {
    clarity: "Gaining Strategic Clarity",
    qualified_leads: "Generating More Qualified Leads",
    save_time: "Recovering Time and Reducing Friction",
    implementation: "Full Implementation Support",
  };

  const focusLabel = params.selectedFocus
    ? (FOCUS_LABELS[params.selectedFocus] ?? params.selectedFocus)
    : null;

  const dateStr = params.bookingDate.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const bodyHtml = `
    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1625;line-height:1.7;margin:0 0 20px;">
      Hi ${params.firstName},
    </p>
    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1625;line-height:1.7;margin:0 0 20px;">
      Your Flo Blueprint&trade; Executive Debrief is <strong>tomorrow</strong>. Here's a quick reminder of your session details:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0eef8;padding:20px 24px;margin:0 0 24px;">
      <tr><td>
        <p style="margin:0 0 8px;font-family:Inter,Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6b6680;font-weight:600;">Your Session</p>
        <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#1a1625;line-height:1.8;">
          <strong>When:</strong> ${dateStr}<br />
          ${focusLabel ? `<strong>Focus:</strong> ${focusLabel}<br />` : ""}
          <strong>Format:</strong> Video call (link in your TidyCal email)
        </p>
      </td></tr>
    </table>
    <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#1a1625;line-height:1.7;margin:0 0 16px;">
      Before your session, review your Blueprint report so you arrive ready to go deep on your focus area.
    </p>
    <p style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#6b6680;line-height:1.7;margin:0 0 8px;">
      Need to reschedule?
      <a href="${params.tidyCalUrl}" style="color:#463176;text-decoration:none;">Manage your booking on TidyCal</a>
    </p>`;

  return sendEmail({
    to: params.to,
    subject: "Your Flo Blueprint™ Debrief Is Tomorrow",
    html: brandedEmail({
      title: "Your Debrief Is Tomorrow",
      preheader: `Session reminder: ${dateStr}. Review your Blueprint report before the call.`,
      bodyHtml,
      ctaUrl: params.reportUrl,
      ctaLabel: "Review Your Blueprint Report",
    }),
    tag: "24h_reminder",
  });
}

// ─── Email 4: Post-Session PDF Delivery ──────────────────────────────────────

export interface DebriefSummaryEmailParams {
  to: string;
  firstName: string;
  leadId: number;
  sentAt: string;
  summaryData: Record<string, unknown>;
}

export async function sendDebriefSummaryEmail(
  params: DebriefSummaryEmailParams,
): Promise<EmailResult> {
  const { generateDebriefSummaryPdf } = await import("./generatePdf");

  const firstWin = params.summaryData.firstWin as string | undefined;
  const recommendedNextStep = params.summaryData.recommendedNextStep as string | undefined;

  const bodyHtml = `
    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1625;line-height:1.7;margin:0 0 20px;">
      Hi ${params.firstName},
    </p>
    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1625;line-height:1.7;margin:0 0 20px;">
      Thank you for an outstanding Executive Debrief session. I've compiled your personalized summary with the action plan we developed together. You'll find it attached to this email as a PDF.
    </p>
    ${firstWin ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0eef8;border-left:3px solid #463176;padding:16px 20px;margin:0 0 24px;">
      <tr><td>
        <p style="margin:0 0 6px;font-family:Inter,Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6b6680;font-weight:600;">Your First Win This Week</p>
        <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#1a1625;line-height:1.6;">${firstWin}</p>
      </td></tr>
    </table>` : ""}
    ${recommendedNextStep ? `
    <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#1a1625;line-height:1.7;margin:0 0 12px;">
      <strong>Your recommended next step:</strong> ${recommendedNextStep}
    </p>` : ""}
    <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#6b6680;line-height:1.7;margin:0 0 8px;">
      Ready to continue building momentum? I'd love to support your next phase of growth.
      Reply to this email or reach us at
      <a href="mailto:hello@tymflo.com" style="color:#463176;text-decoration:none;">hello@tymflo.com</a>
    </p>`;

  // Generate a real binary PDF using pdfkit from the stored summary data
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateDebriefSummaryPdf({
      firstName: params.firstName,
      lastName: params.summaryData.lastName as string | undefined,
      company: params.summaryData.company as string | undefined,
      floProfile: params.summaryData.floProfile as string | undefined,
      businessHealthScore: params.summaryData.businessHealthScore as number | undefined,
      primaryConstraint: params.summaryData.primaryConstraint as string | undefined,
      selectedFocus: params.summaryData.selectedFocus as string | undefined,
      sessionDate: params.summaryData.sessionDate as string | undefined,
      firstWin: params.summaryData.firstWin as string | undefined,
      rootCause: params.summaryData.rootCause as string | undefined,
      strategicInsights: params.summaryData.strategicInsights as string | undefined,
      recommendedNextStep: params.summaryData.recommendedNextStep as string | undefined,
      actionItems: params.summaryData.actionItems as string | undefined,
      notes: params.summaryData.notes as string | undefined,
      recommendedService: params.summaryData.recommendedService as string | undefined,
    });
  } catch (pdfErr) {
    logger.warn({ leadId: params.leadId, pdfErr }, "PDF generation failed — sending email without attachment");
  }

  const attachments: { filename: string; content: string }[] = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `Flo-Blueprint-Executive-Debrief-Summary-${params.firstName}.pdf`,
      content: pdfBuffer.toString("base64"),
    });
  }

  return sendEmail({
    to: params.to,
    subject: `Your Executive Debrief Summary — ${params.firstName}`,
    html: brandedEmail({
      title: "Your Executive Debrief Summary",
      preheader: "Your personalized action plan and session summary from TymFlo.",
      bodyHtml,
      ctaUrl: "https://tymflo.com",
      ctaLabel: "Continue Working with TymFlo",
    }),
    attachments: attachments.length ? attachments : undefined,
    tag: "debrief_summary",
  });
}
