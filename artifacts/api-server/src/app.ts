import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { and, gte, lte, eq } from "drizzle-orm";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./webhookHandlers";
import { handleCheckoutCompleted } from "./routes/checkout";
import { db, leadsTable } from "@workspace/db";
import { sendReminderEmail } from "./services/email";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// Stripe webhook route MUST be registered BEFORE express.json()
// It needs the raw Buffer body for signature verification
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res): Promise<void> => {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    const sig = Array.isArray(signature) ? signature[0] : signature;

    try {
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);

      // Handle checkout.session.completed to update the lead record
      try {
        const rawBody = (req.body as Buffer).toString("utf-8");
        const event = JSON.parse(rawBody) as { type: string; data: { object: { id: string } } };
        if (event.type === "checkout.session.completed") {
          const sessionId = event.data.object.id;
          handleCheckoutCompleted(sessionId).catch((err) => {
            logger.warn({ err, sessionId }, "Non-fatal: failed to update lead after checkout");
          });
        }
      } catch {
        // Non-fatal — stripe-replit-sync already processed the webhook
      }

      res.status(200).json({ received: true });
    } catch (err) {
      logger.error({ err }, "Stripe webhook processing failed");
      res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

// ─── 24-hour Debrief Reminder Scheduler ──────────────────────────────────────
// Checks every 60 minutes for upcoming debriefs and sends a reminder email.
async function runReminderCheck(): Promise<void> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 22 * 60 * 60 * 1000); // now + 22h
    const windowEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000);   // now + 26h

    const leads = await db
      .select({
        id: leadsTable.id,
        email: leadsTable.email,
        firstName: leadsTable.firstName,
        debriefBookingDate: leadsTable.debriefBookingDate,
        selectedFocus: leadsTable.selectedFocus,
        reminderSent: leadsTable.reminderSent,
      })
      .from(leadsTable)
      .where(
        and(
          gte(leadsTable.debriefBookingDate, windowStart),
          lte(leadsTable.debriefBookingDate, windowEnd),
          eq(leadsTable.reminderSent, false),
        ),
      );

    if (leads.length === 0) return;

    logger.info({ count: leads.length }, "Reminder check: found upcoming debriefs to notify");

    const basePath = process.env.BASE_PATH ?? "";
    const domains = process.env.REPLIT_DOMAINS;
    const siteOrigin = domains
      ? `https://${domains.split(",")[0]?.trim()}`
      : (process.env.SITE_URL ?? "https://tymflo.com");

    const tidyCalUrl =
      process.env.VITE_EXECUTIVE_DEBRIEF_TIDYCAL_URL ??
      "https://tidycal.com/tymflo-christa/the-flo-blueprint-executive-debrief";

    for (const lead of leads) {
      if (!lead.debriefBookingDate) continue;

      try {
        const result = await sendReminderEmail({
          to: lead.email,
          firstName: lead.firstName,
          bookingDate: lead.debriefBookingDate,
          selectedFocus: lead.selectedFocus,
          tidyCalUrl,
          reportUrl: `${siteOrigin}${basePath}/report`,
        });

        if (result.sent) {
          await db
            .update(leadsTable)
            .set({ reminderSent: true })
            .where(eq(leadsTable.id, lead.id));
          logger.info({ leadId: lead.id }, "24h reminder sent and marked");
        } else {
          logger.warn({ leadId: lead.id, message: result.message }, "Reminder email not sent — will retry next cycle");
        }
      } catch (err) {
        logger.warn({ err, leadId: lead.id }, "Non-fatal: reminder send failed for lead");
      }
    }
  } catch (err) {
    logger.warn({ err }, "Non-fatal: reminder scheduler check failed");
  }
}

// Run immediately on startup, then every 60 minutes
runReminderCheck();
setInterval(() => { runReminderCheck(); }, 60 * 60 * 1000);

export default app;
