import { Router, type IRouter } from "express";
import { db, leadsTable } from "@workspace/db";
import { SubmitLeadBody, SubmitLeadResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = SubmitLeadBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid lead submission body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  try {
    const [lead] = await db
      .insert(leadsTable)
      .values({
        clerkUserId: data.clerkUserId ?? null,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone ?? null,
        company: data.company,
        website: data.website ?? null,
        role: data.role,
        industry: data.industry ?? null,
        annualRevenue: data.annualRevenue ?? null,
        consentToContact: String(data.consentToContact),
        answers: data.answers as Record<string, unknown>,
        categoryScores: data.categoryScores as Record<string, unknown>,
        businessHealthScore: data.businessHealthScore,
        primaryConstraint: data.primaryConstraint,
        floProfile: data.floProfile,
        confidencePercentage: data.confidencePercentage,
        estimatedImpact: data.estimatedImpact,
        recommendedService: data.recommendedService,
        eventSource: data.eventSource ?? null,
        qrCodeId: data.qrCodeId ?? null,
        campaign: data.campaign ?? null,
        utmSource: data.utmSource ?? null,
        utmMedium: data.utmMedium ?? null,
        utmCampaign: data.utmCampaign ?? null,
      })
      .returning();

    req.log.info({ leadId: lead.id, email: lead.email }, "Lead submitted successfully");

    // Attempt Google Sheets sync if env var is set (fire and forget)
    const sheetsUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (sheetsUrl) {
      const sheetPayload = {
        timestamp: new Date().toISOString(),
        assessmentId: String(lead.id),
        clerkUserId: lead.clerkUserId ?? "",
        eventSource: lead.eventSource ?? "",
        qrCodeId: lead.qrCodeId ?? "",
        campaign: lead.campaign ?? "",
        utmSource: lead.utmSource ?? "",
        utmMedium: lead.utmMedium ?? "",
        utmCampaign: lead.utmCampaign ?? "",
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone ?? "",
        company: lead.company,
        website: lead.website ?? "",
        role: lead.role,
        industry: lead.industry ?? "",
        annualRevenue: lead.annualRevenue ?? "",
        businessHealthScore: lead.businessHealthScore,
        primaryConstraint: lead.primaryConstraint,
        floProfile: lead.floProfile,
        confidencePercentage: lead.confidencePercentage,
        estimatedImpact: lead.estimatedImpact,
        recommendedService: lead.recommendedService,
        answers: JSON.stringify(lead.answers),
        categoryScores: JSON.stringify(lead.categoryScores),
      };

      fetch(sheetsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sheetPayload),
      })
        .then((r) => {
          if (!r.ok) {
            logger.warn({ status: r.status }, "Google Sheets sync returned non-OK status");
          } else {
            logger.info({ leadId: lead.id }, "Lead synced to Google Sheets");
          }
        })
        .catch((err) => {
          logger.warn({ err }, "Google Sheets sync failed (non-fatal)");
        });
    }

    const response = SubmitLeadResponse.parse({
      id: String(lead.id),
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      company: lead.company,
      role: lead.role,
      floProfile: lead.floProfile,
      businessHealthScore: lead.businessHealthScore,
      primaryConstraint: lead.primaryConstraint,
      recommendedService: lead.recommendedService,
      createdAt: lead.createdAt.toISOString(),
    });

    res.status(201).json(response);
  } catch (err) {
    req.log.error({ err }, "Failed to insert lead");
    res.status(500).json({ error: "Failed to save lead. Please try again." });
  }
});

export default router;
