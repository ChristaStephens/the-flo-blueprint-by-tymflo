import { Router, type IRouter } from "express";
import { db, leadsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "../lib/logger";
import { sendPaymentConfirmationEmail, sendServiceConfirmationEmail } from "../services/email";

const router: IRouter = Router();

const SERVICE_NAMES: Record<string, string> = {
  "executive-growth-strategy": "Executive Growth Strategy Session",
  "marketing-systems-review": "Marketing Systems Review",
  "ai-workflow-accelerator": "AI Workflow Accelerator",
  "executive_debrief": "Flo Blueprint Executive Debrief",
};

interface ServiceConfig {
  name: string;
  defaultCents: number;
  envVar: string;
}

const SERVICE_CONFIG: Record<string, ServiceConfig> = {
  "executive-growth-strategy": {
    name: "Executive Growth Strategy Session",
    defaultCents: 99700,
    envVar: "EXECUTIVE_GROWTH_STRATEGY_PRICE_CENTS",
  },
  "marketing-systems-review": {
    name: "Marketing Systems Review",
    defaultCents: 69700,
    envVar: "MARKETING_SYSTEMS_REVIEW_PRICE_CENTS",
  },
  "ai-workflow-accelerator": {
    name: "AI Workflow Accelerator",
    defaultCents: 49700,
    envVar: "AI_WORKFLOW_ACCELERATOR_PRICE_CENTS",
  },
};

const SERVICE_DISPLAY_ORDER = [
  "executive-growth-strategy",
  "marketing-systems-review",
  "ai-workflow-accelerator",
] as const;

const SERVICE_CATEGORY: Record<string, string> = {
  "executive-growth-strategy": "Strategy",
  "marketing-systems-review": "Marketing",
  "ai-workflow-accelerator": "AI & Automation",
};

function formatCents(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString("en-US")}`
    : `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

router.get("/products", async (req, res): Promise<void> => {
  try {
    const stripe = await getUncachableStripeClient();
    const allProducts = await stripe.products.list({ active: true, limit: 100 });

    const results = await Promise.all(
      SERVICE_DISPLAY_ORDER.map(async (serviceId) => {
        const config = SERVICE_CONFIG[serviceId];
        const priceCents = config
          ? (process.env[config.envVar] ? parseInt(process.env[config.envVar]!, 10) : config.defaultCents)
          : 0;

        // Try to find a matching Stripe product + price
        const product = allProducts.data.find((p) => p.metadata?.serviceId === serviceId);
        let livePriceCents: number | null = null;

        if (product) {
          const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
          // Prefer an exact match on the configured amount; otherwise take the first active price
          const matched = prices.data.find((p) => p.unit_amount === priceCents && p.currency === "usd")
            ?? prices.data.find((p) => p.currency === "usd");
          if (matched?.unit_amount != null) {
            livePriceCents = matched.unit_amount;
          }
        }

        const finalCents = livePriceCents ?? priceCents;

        return {
          id: serviceId,
          name: config?.name ?? SERVICE_NAMES[serviceId] ?? serviceId,
          category: SERVICE_CATEGORY[serviceId] ?? "",
          priceCents: finalCents,
          priceDisplay: formatCents(finalCents),
        };
      })
    );

    res.status(200).json({ products: results });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch products from Stripe");
    // Fall back to configured defaults — never leave the page without prices
    const fallback = SERVICE_DISPLAY_ORDER.map((serviceId) => {
      const config = SERVICE_CONFIG[serviceId];
      const priceCents = config
        ? (process.env[config.envVar] ? parseInt(process.env[config.envVar]!, 10) : config.defaultCents)
        : 0;
      return {
        id: serviceId,
        name: config?.name ?? SERVICE_NAMES[serviceId] ?? serviceId,
        category: SERVICE_CATEGORY[serviceId] ?? "",
        priceCents,
        priceDisplay: formatCents(priceCents),
      };
    });
    res.status(200).json({ products: fallback });
  }
});

router.post("/checkout", async (req, res): Promise<void> => {
  const { serviceId, leadId, successUrl, cancelUrl } = req.body as {
    serviceId?: string;
    leadId?: string | null;
    successUrl?: string;
    cancelUrl?: string;
  };

  if (!serviceId || !successUrl || !cancelUrl) {
    res.status(400).json({ error: "serviceId, successUrl, and cancelUrl are required" });
    return;
  }

  if (!SERVICE_NAMES[serviceId]) {
    res.status(400).json({ error: `Unknown serviceId: ${serviceId}` });
    return;
  }

  const config = SERVICE_CONFIG[serviceId];

  try {
    const stripe = await getUncachableStripeClient();

    // List all active products and find the one matching serviceId in metadata
    // (search API indexes are delayed; listing is always current)
    const allProducts = await stripe.products.list({ active: true, limit: 100 });
    let product = allProducts.data.find((p) => p.metadata?.serviceId === serviceId);

    // Auto-create the product if it doesn't exist yet
    if (!product && config) {
      product = await stripe.products.create({
        name: config.name,
        metadata: { serviceId },
      });
      req.log.info({ productId: product.id, serviceId }, "Auto-created Stripe product");
    }

    if (!product) {
      req.log.error({ serviceId }, "No Stripe product found for serviceId");
      res.status(500).json({
        error:
          "Service not available for purchase. Please contact TymFlo to complete your purchase.",
      });
      return;
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 10,
    });

    const priceCents = config
      ? (process.env[config.envVar] ? parseInt(process.env[config.envVar]!, 10) : config.defaultCents)
      : 0;

    let price = prices.data.find(
      (p) => p.unit_amount === priceCents && p.currency === "usd"
    );

    // If existing prices don't match the configured amount, warn and archive stale ones
    if (!price && prices.data.length > 0 && config) {
      const stalePrices = prices.data.filter((p) => p.currency === "usd");
      req.log.warn(
        {
          serviceId,
          configuredCents: priceCents,
          envVar: config.envVar,
          stalePriceIds: stalePrices.map((p) => p.id),
          stalePriceAmounts: stalePrices.map((p) => p.unit_amount),
        },
        `Price mismatch for ${serviceId}: configured amount (${priceCents} cents) does not match any active Stripe price. ` +
          `A new price will be created. Set ${config.envVar} before first use to avoid duplicate prices. ` +
          `Archiving ${stalePrices.length} stale price(s).`
      );
      // Archive stale prices so the product has only one active price
      await Promise.all(
        stalePrices.map((stalePrice) =>
          stripe.prices.update(stalePrice.id, { active: false }).then(() => {
            req.log.info(
              { priceId: stalePrice.id, serviceId, unitAmount: stalePrice.unit_amount },
              "Archived stale Stripe price"
            );
          })
        )
      );
    }

    // Auto-create the price if missing
    if (!price && config) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceCents,
        currency: "usd",
      });
      req.log.info({ priceId: price.id, serviceId, priceCents }, "Auto-created Stripe price");
    }

    if (!price) {
      req.log.error({ serviceId, productId: product.id }, "No active price found for product");
      res.status(500).json({
        error:
          "Service pricing not configured. Please contact TymFlo to complete your purchase.",
      });
      return;
    }

    const metadata: Record<string, string> = { serviceId };
    if (leadId) metadata.leadId = leadId;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    req.log.info({ sessionId: session.id, serviceId, leadId }, "Checkout session created");

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    req.log.error({ err }, "Failed to create checkout session");
    res.status(500).json({ error: "Failed to create checkout session. Please try again." });
  }
});

router.post("/checkout/debrief", async (req, res): Promise<void> => {
  const { leadId, clerkUserId, eventSource, primaryConstraint, campaign } = req.body as {
    leadId?: string | null;
    clerkUserId?: string | null;
    eventSource?: string | null;
    primaryConstraint?: string | null;
    campaign?: string | null;
  };

  const basePath = process.env.BASE_PATH ?? "";
  const origin = (req.headers.origin as string) || `https://${req.headers.host as string}`;
  const successUrl = `${origin}${basePath}/debrief/focus?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}${basePath}/report`;

  const priceAmount = process.env.EXECUTIVE_DEBRIEF_PRICE_CENTS
    ? parseInt(process.env.EXECUTIVE_DEBRIEF_PRICE_CENTS, 10)
    : 19700;

  try {
    const stripe = await getUncachableStripeClient();

    const allProducts = await stripe.products.list({ active: true, limit: 100 });
    let product = allProducts.data.find((p) => p.metadata?.serviceId === "executive_debrief");

    if (!product) {
      product = await stripe.products.create({
        name: "Flo Blueprint Executive Debrief",
        metadata: { serviceId: "executive_debrief" },
      });
      req.log.info({ productId: product.id }, "Created Stripe product for executive_debrief");
    }

    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
    let price = prices.data.find((p) => p.unit_amount === priceAmount && p.currency === "usd");

    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceAmount,
        currency: "usd",
      });
      req.log.info({ priceId: price.id }, "Created Stripe price for executive_debrief");
    }

    const metadata: Record<string, string> = { serviceId: "executive_debrief" };
    if (leadId) metadata.leadId = leadId;
    if (clerkUserId) metadata.clerkUserId = clerkUserId;
    if (eventSource) metadata.eventSource = eventSource;
    if (primaryConstraint) metadata.primaryConstraint = primaryConstraint;
    if (campaign) metadata.campaign = campaign;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    req.log.info({ sessionId: session.id, leadId }, "Debrief checkout session created");
    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    req.log.error({ err }, "Failed to create debrief checkout session");
    res.status(500).json({ error: "Failed to create checkout session. Please try again." });
  }
});

router.post("/stripe/webhook", async (req, res): Promise<void> => {
  res.status(200).json({ received: true });
});

export async function handleCheckoutCompleted(sessionId: string): Promise<void> {
  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") return;

    const serviceId = session.metadata?.serviceId;
    const leadId = session.metadata?.leadId;
    const serviceName = serviceId ? SERVICE_NAMES[serviceId] : null;

    if (!serviceName || !serviceId) {
      logger.warn({ sessionId, serviceId, leadId }, "Missing serviceId/serviceName in checkout session");
      return;
    }

    const isDebrief = serviceId === "executive_debrief";
    const purchaseDate = new Date();
    const purchaseDateStr = purchaseDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const basePath = process.env.BASE_PATH ?? "";
    const domains = process.env.REPLIT_DOMAINS;
    const siteOrigin = domains
      ? `https://${domains.split(",")[0]?.trim()}`
      : (process.env.SITE_URL ?? "https://tymflo.com");

    // Helper: resolve buyer name/email from lead record or Stripe session
    async function getBuyerInfo(leadIdNum: number | null): Promise<{ email: string; firstName: string } | null> {
      if (leadIdNum !== null) {
        const [lead] = await db
          .select({ email: leadsTable.email, firstName: leadsTable.firstName })
          .from(leadsTable)
          .where(eq(leadsTable.id, leadIdNum));
        if (lead) return lead;
      }
      // Fall back to Stripe customer details collected at checkout
      const customerEmail = (session.customer_details as { email?: string | null } | null)?.email;
      const customerName = (session.customer_details as { name?: string | null } | null)?.name;
      if (customerEmail) {
        const firstName = customerName ? customerName.split(" ")[0] : "there";
        return { email: customerEmail, firstName: firstName ?? "there" };
      }
      return null;
    }

    // Update the lead record if we have a leadId
    if (leadId) {
      const leadIdNum = parseInt(leadId, 10);
      if (!isNaN(leadIdNum)) {
        const eventEntry = JSON.stringify([{ event: "payment_completed", serviceId, timestamp: new Date().toISOString() }]);
        await db
          .update(leadsTable)
          .set({
            stripeSessionId: sessionId,
            purchasedService: isDebrief ? "executive_debrief" : serviceName,
            purchaseDate,
            paymentStatus: "paid",
            ...(isDebrief ? { leadStage: "paid_debrief" } : {}),
            funnelEvents: sql`coalesce(${leadsTable.funnelEvents}, '[]'::jsonb) || ${eventEntry}::jsonb`,
          })
          .where(eq(leadsTable.id, leadIdNum));

        logger.info({ sessionId, leadId, serviceName, isDebrief }, "Lead updated with purchase info");
      } else {
        logger.warn({ leadId }, "Invalid leadId in checkout session metadata");
      }
    }

    const leadIdNum = leadId ? parseInt(leadId, 10) : null;
    const resolvedLeadId = leadIdNum !== null && !isNaN(leadIdNum) ? leadIdNum : null;

    // Email: Send branded confirmation (non-fatal) — debrief vs service card
    try {
      const buyer = await getBuyerInfo(resolvedLeadId);

      if (!buyer) {
        logger.warn({ sessionId, serviceId }, "No buyer email found — skipping confirmation email");
        return;
      }

      if (isDebrief) {
        const amountCents = process.env.EXECUTIVE_DEBRIEF_PRICE_CENTS
          ? parseInt(process.env.EXECUTIVE_DEBRIEF_PRICE_CENTS, 10)
          : 19700;
        const amount = `$${(amountCents / 100).toFixed(2)}`;
        const focusUrl = `${siteOrigin}${basePath}/debrief/focus?session_id=${sessionId}`;
        const reportUrl = `${siteOrigin}${basePath}/report`;

        sendPaymentConfirmationEmail({
          to: buyer.email,
          firstName: buyer.firstName,
          amount,
          purchaseDate: purchaseDateStr,
          focusUrl,
          reportUrl,
        }).catch((err) => {
          logger.warn({ err, leadId }, "Non-fatal: debrief confirmation email failed");
        });
      } else {
        // Service card purchase — send branded scheduling confirmation
        const amountCents = session.amount_total ?? 0;
        const amount = amountCents > 0
          ? `$${(amountCents / 100).toFixed(2)}`
          : "—";
        const serviceSchedulingUrls: Record<string, string | undefined> = {
          "executive-growth-strategy": process.env.EXECUTIVE_GROWTH_STRATEGY_SCHEDULING_URL,
          "marketing-systems-review": process.env.MARKETING_SYSTEMS_REVIEW_SCHEDULING_URL,
          "ai-workflow-accelerator": process.env.AI_WORKFLOW_ACCELERATOR_SCHEDULING_URL,
        };
        const schedulingUrl =
          serviceSchedulingUrls[serviceId] ??
          process.env.SERVICE_SCHEDULING_URL ??
          process.env.CALENDLY_URL ??
          "https://calendly.com/tymflo";

        sendServiceConfirmationEmail({
          to: buyer.email,
          firstName: buyer.firstName,
          serviceName,
          amount,
          purchaseDate: purchaseDateStr,
          schedulingUrl,
        }).catch((err) => {
          logger.warn({ err, serviceId }, "Non-fatal: service confirmation email failed");
        });
      }
    } catch (emailErr) {
      logger.warn({ emailErr, sessionId }, "Non-fatal: failed to send purchase confirmation email");
    }
  } catch (err) {
    logger.error({ err, sessionId }, "Failed to handle checkout.session.completed");
  }
}

export default router;
