import { Router, type IRouter } from "express";
import { db, leadsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.use("/admin", requireAdmin);

// GET /admin/leads — list all leads
router.get("/admin/leads", async (req, res): Promise<void> => {
  try {
    const leads = await db
      .select({
        id: leadsTable.id,
        firstName: leadsTable.firstName,
        lastName: leadsTable.lastName,
        email: leadsTable.email,
        company: leadsTable.company,
        role: leadsTable.role,
        primaryConstraint: leadsTable.primaryConstraint,
        floProfile: leadsTable.floProfile,
        businessHealthScore: leadsTable.businessHealthScore,
        selectedFocus: leadsTable.selectedFocus,
        paymentStatus: leadsTable.paymentStatus,
        leadStage: leadsTable.leadStage,
        debriefBookingDate: leadsTable.debriefBookingDate,
        debriefSummaryStatus: leadsTable.debriefSummaryStatus,
        eventSource: leadsTable.eventSource,
        campaign: leadsTable.campaign,
        createdAt: leadsTable.createdAt,
      })
      .from(leadsTable)
      .orderBy(leadsTable.createdAt);

    res.json({ leads });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin leads list");
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// GET /admin/leads/:id — full lead detail
router.get("/admin/leads/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid lead ID" });
    return;
  }

  try {
    const [lead] = await db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.id, id));

    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    res.json({ lead });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin lead detail");
    res.status(500).json({ error: "Failed to fetch lead" });
  }
});

// PATCH /admin/leads/:id/summary — save debrief summary form
router.patch("/admin/leads/:id/summary", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid lead ID" });
    return;
  }

  const { summaryData, status } = req.body as {
    summaryData?: Record<string, unknown>;
    status?: string;
  };

  const validStatuses = ["draft", "in_review", "finalized", "sent"];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status value" });
    return;
  }

  try {
    const [updated] = await db
      .update(leadsTable)
      .set({
        ...(summaryData !== undefined && { debriefSummaryData: summaryData }),
        ...(status !== undefined && { debriefSummaryStatus: status }),
      })
      .where(eq(leadsTable.id, id))
      .returning({
        id: leadsTable.id,
        debriefSummaryStatus: leadsTable.debriefSummaryStatus,
      });

    if (!updated) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    req.log.info({ leadId: id, status }, "Debrief summary saved");
    res.json({ success: true, debriefSummaryStatus: updated.debriefSummaryStatus });
  } catch (err) {
    req.log.error({ err }, "Failed to save debrief summary");
    res.status(500).json({ error: "Failed to save summary" });
  }
});

// PATCH /admin/leads/:id/notes — save internal notes
router.patch("/admin/leads/:id/notes", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid lead ID" });
    return;
  }

  const { notes } = req.body as { notes?: string };

  try {
    const [updated] = await db
      .update(leadsTable)
      .set({ internalNotes: notes ?? null })
      .where(eq(leadsTable.id, id))
      .returning({ id: leadsTable.id });

    if (!updated) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    req.log.info({ leadId: id }, "Internal notes saved");
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save internal notes");
    res.status(500).json({ error: "Failed to save notes" });
  }
});

// PATCH /admin/leads/:id/recommendation — save after-debrief recommendation
router.patch(
  "/admin/leads/:id/recommendation",
  async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid lead ID" });
      return;
    }

    const { recommendedService, recommendationData } = req.body as {
      recommendedService?: string;
      recommendationData?: Record<string, unknown>;
    };

    try {
      const [updated] = await db
        .update(leadsTable)
        .set({
          ...(recommendedService !== undefined && {
            debriefRecommendedService: recommendedService,
          }),
          ...(recommendationData !== undefined && { recommendationData }),
        })
        .where(eq(leadsTable.id, id))
        .returning({ id: leadsTable.id });

      if (!updated) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }

      req.log.info({ leadId: id }, "Recommendation saved");
      res.json({ success: true });
    } catch (err) {
      req.log.error({ err }, "Failed to save recommendation");
      res.status(500).json({ error: "Failed to save recommendation" });
    }
  },
);

// POST /admin/leads/:id/finalize — mark summary as sent and email a server-generated PDF
router.post("/admin/leads/:id/finalize", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid lead ID" });
    return;
  }

  try {
    const [lead] = await db
      .select({
        debriefSummaryStatus: leadsTable.debriefSummaryStatus,
        debriefSummaryData: leadsTable.debriefSummaryData,
        email: leadsTable.email,
        firstName: leadsTable.firstName,
        lastName: leadsTable.lastName,
        company: leadsTable.company,
        floProfile: leadsTable.floProfile,
        businessHealthScore: leadsTable.businessHealthScore,
        primaryConstraint: leadsTable.primaryConstraint,
        selectedFocus: leadsTable.selectedFocus,
        debriefBookingDate: leadsTable.debriefBookingDate,
      })
      .from(leadsTable)
      .where(eq(leadsTable.id, id));

    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    if (!lead.debriefSummaryData) {
      res.status(400).json({ error: "No summary data to finalize" });
      return;
    }

    const now = new Date();
    const existingData = (lead.debriefSummaryData ?? {}) as Record<string, unknown>;

    const updatedSummaryData: Record<string, unknown> = {
      ...existingData,
      pdfGeneratedAt: now.toISOString(),
    };

    await db
      .update(leadsTable)
      .set({
        debriefSummaryStatus: "sent",
        debriefSummarySentAt: now,
        leadStage: "debrief_complete",
        debriefSummaryData: updatedSummaryData,
      })
      .where(eq(leadsTable.id, id));

    req.log.info({ leadId: id, email: lead.email }, "Debrief summary finalized — generating PDF");

    // Build summary data map for the PDF generator, merging DB columns + stored form fields
    const summaryData: Record<string, unknown> = {
      ...existingData,
      firstName: lead.firstName,
      lastName: lead.lastName ?? undefined,
      company: lead.company ?? undefined,
      floProfile: lead.floProfile ?? undefined,
      businessHealthScore: lead.businessHealthScore ?? undefined,
      primaryConstraint: lead.primaryConstraint ?? undefined,
      selectedFocus: lead.selectedFocus ?? undefined,
      sessionDate: lead.debriefBookingDate?.toISOString() ?? undefined,
    };

    const { sendDebriefSummaryEmail } = await import("../services/email");
    const emailResult = await sendDebriefSummaryEmail({
      to: lead.email,
      firstName: lead.firstName,
      leadId: id,
      sentAt: now.toISOString(),
      summaryData,
    });
    req.log.info({ leadId: id, emailResult }, "Debrief summary email dispatched");

    res.json({ success: true, sentAt: now.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to finalize debrief summary");
    res.status(500).json({ error: "Failed to finalize summary" });
  }
});

export default router;
