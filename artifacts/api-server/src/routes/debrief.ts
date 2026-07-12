import { Router, type IRouter } from "express";
import { db, leadsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "../lib/logger";
import {
  sendAppointmentConfirmationEmail,
} from "../services/email";

const router: IRouter = Router();

const VALID_FOCUS_VALUES = ["clarity", "qualified_leads", "save_time", "implementation"] as const;

export async function appendFunnelEvent(leadId: number, event: string): Promise<void> {
  try {
    const entry = JSON.stringify([{ event, timestamp: new Date().toISOString() }]);
    await db
      .update(leadsTable)
      .set({
        funnelEvents: sql`coalesce(${leadsTable.funnelEvents}, '[]'::jsonb) || ${entry}::jsonb`,
      })
      .where(eq(leadsTable.id, leadId));
  } catch (err) {
    logger.warn({ err, leadId, event }, "Non-fatal: failed to append funnel event");
  }
}

router.get("/debrief/status", async (req, res): Promise<void> => {
  const sessionId = req.query.session_id as string | undefined;
  if (!sessionId) {
    res.status(400).json({ error: "session_id is required" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid = session.payment_status === "paid";
    const leadId = session.metadata?.leadId ?? null;

    if (!paid) {
      res.status(402).json({ paid: false, error: "Payment not completed" });
      return;
    }

    res.status(200).json({ paid: true, leadId });
  } catch (err) {
    req.log.error({ err }, "Failed to check debrief payment status");
    res.status(500).json({ error: "Failed to verify payment status" });
  }
});

router.post("/debrief/focus", async (req, res): Promise<void> => {
  const { leadId, selectedFocus, sessionId } = req.body as {
    leadId?: string;
    selectedFocus?: string;
    sessionId?: string;
  };

  if (!leadId || !selectedFocus || !sessionId || !(VALID_FOCUS_VALUES as readonly string[]).includes(selectedFocus)) {
    res.status(400).json({ error: "leadId, sessionId, and a valid selectedFocus are required" });
    return;
  }

  const leadIdNum = parseInt(leadId, 10);
  if (isNaN(leadIdNum)) {
    res.status(400).json({ error: "Invalid leadId" });
    return;
  }

  // Verify payment ownership: session must be paid and metadata.leadId must match requested leadId
  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      res.status(402).json({ error: "Payment not completed for this session" });
      return;
    }

    const sessionLeadId = session.metadata?.leadId;
    if (!sessionLeadId || sessionLeadId !== leadId) {
      req.log.warn({ sessionId, sessionLeadId, requestedLeadId: leadId }, "Lead ownership verification failed");
      res.status(403).json({ error: "This session does not authorize updates to the requested lead" });
      return;
    }
  } catch (err) {
    req.log.error({ err }, "Failed to verify session ownership for focus update");
    res.status(500).json({ error: "Failed to verify payment. Please try again." });
    return;
  }

  try {
    const entry = JSON.stringify([{ event: "focus_selected", selectedFocus, timestamp: new Date().toISOString() }]);
    await db
      .update(leadsTable)
      .set({
        selectedFocus,
        leadStage: "focus_selected",
        funnelEvents: sql`coalesce(${leadsTable.funnelEvents}, '[]'::jsonb) || ${entry}::jsonb`,
      })
      .where(eq(leadsTable.id, leadIdNum));

    req.log.info({ leadId, selectedFocus }, "Focus selection saved");
    res.status(200).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save focus selection");
    res.status(500).json({ error: "Failed to save focus selection" });
  }
});

// PATCH /debrief/booking — save booking date + send appointment confirmation email
// Requires sessionId for ownership verification (same pattern as /debrief/focus)
router.patch("/debrief/booking", async (req, res): Promise<void> => {
  const { leadId, bookingDate, sessionId } = req.body as {
    leadId?: string;
    bookingDate?: string;
    sessionId?: string;
  };

  if (!leadId || !bookingDate || !sessionId) {
    res.status(400).json({ error: "leadId, bookingDate, and sessionId are required" });
    return;
  }

  const leadIdNum = parseInt(leadId, 10);
  if (isNaN(leadIdNum)) {
    res.status(400).json({ error: "Invalid leadId" });
    return;
  }

  const parsedDate = new Date(bookingDate);
  if (isNaN(parsedDate.getTime())) {
    res.status(400).json({ error: "Invalid bookingDate — must be ISO 8601" });
    return;
  }

  // Verify payment ownership: session must be paid and metadata.leadId must match
  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      res.status(402).json({ error: "Payment not completed for this session" });
      return;
    }

    const sessionLeadId = session.metadata?.leadId;
    if (!sessionLeadId || sessionLeadId !== leadId) {
      req.log.warn({ sessionId, sessionLeadId, requestedLeadId: leadId }, "Booking ownership verification failed");
      res.status(403).json({ error: "This session does not authorize updates to the requested lead" });
      return;
    }
  } catch (err) {
    req.log.error({ err }, "Failed to verify session ownership for booking");
    res.status(500).json({ error: "Failed to verify payment. Please try again." });
    return;
  }

  try {
    const [lead] = await db
      .select({
        email: leadsTable.email,
        firstName: leadsTable.firstName,
        selectedFocus: leadsTable.selectedFocus,
        appointmentConfirmationSent: leadsTable.appointmentConfirmationSent,
      })
      .from(leadsTable)
      .where(eq(leadsTable.id, leadIdNum));

    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // Save booking date (do NOT yet mark appointmentConfirmationSent — we do that only after confirmed send)
    await db
      .update(leadsTable)
      .set({
        debriefBookingDate: parsedDate,
        leadStage: "booked",
      })
      .where(eq(leadsTable.id, leadIdNum));

    req.log.info({ leadId, bookingDate }, "Debrief booking date saved");

    // Send appointment confirmation email if not already sent, mark only on success
    if (!lead.appointmentConfirmationSent) {
      const basePath = process.env.BASE_PATH ?? "";
      const domains = process.env.REPLIT_DOMAINS;
      const siteOrigin = domains
        ? `https://${domains.split(",")[0]?.trim()}`
        : (process.env.SITE_URL ?? "https://tymflo.com");

      const tidyCalUrl =
        process.env.VITE_EXECUTIVE_DEBRIEF_TIDYCAL_URL ??
        "https://tidycal.com/tymflo-christa/the-flo-blueprint-executive-debrief";

      sendAppointmentConfirmationEmail({
        to: lead.email,
        firstName: lead.firstName,
        bookingDate: parsedDate,
        selectedFocus: lead.selectedFocus,
        tidyCalUrl,
        reportUrl: `${siteOrigin}${basePath}/report`,
      })
        .then(async (result) => {
          if (result.sent) {
            await db
              .update(leadsTable)
              .set({ appointmentConfirmationSent: true })
              .where(eq(leadsTable.id, leadIdNum));
            logger.info({ leadId }, "Appointment confirmation email sent and marked");
          } else {
            logger.warn({ leadId, message: result.message }, "Appointment confirmation email not sent — will retry on next booking call");
          }
        })
        .catch((err) => {
          logger.warn({ err, leadId }, "Non-fatal: appointment confirmation email failed");
        });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save debrief booking");
    res.status(500).json({ error: "Failed to save booking date" });
  }
});

router.post("/track", async (req, res): Promise<void> => {
  const { leadId, event } = req.body as { leadId?: string; event?: string };

  if (!event) {
    res.status(400).json({ error: "event is required" });
    return;
  }

  req.log.info({ leadId: leadId ?? "anonymous", event }, "Funnel event tracked");

  if (leadId) {
    const leadIdNum = parseInt(leadId, 10);
    if (!isNaN(leadIdNum)) {
      appendFunnelEvent(leadIdNum, event).catch(() => {});
    }
  }

  res.status(200).json({ ok: true });
});

export default router;
