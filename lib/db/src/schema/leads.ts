import { pgTable, text, serial, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  // Clerk auth
  clerkUserId: text("clerk_user_id"),
  // Contact info
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company").notNull(),
  website: text("website"),
  role: text("role").notNull(),
  industry: text("industry"),
  annualRevenue: text("annual_revenue"),
  consentToContact: text("consent_to_contact").notNull().default("true"),
  // Assessment answers (stored as JSON)
  answers: jsonb("answers").notNull(),
  // Scores
  categoryScores: jsonb("category_scores").notNull(),
  businessHealthScore: integer("business_health_score").notNull(),
  primaryConstraint: text("primary_constraint").notNull(),
  floProfile: text("flo_profile").notNull(),
  confidencePercentage: integer("confidence_percentage").notNull(),
  estimatedImpact: text("estimated_impact").notNull(),
  recommendedService: text("recommended_service").notNull(),
  // Tracking / UTM
  eventSource: text("event_source"),
  qrCodeId: text("qr_code_id"),
  campaign: text("campaign"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  // Stripe / purchase
  stripeSessionId: text("stripe_session_id"),
  purchasedService: text("purchased_service"),
  purchaseDate: timestamp("purchase_date", { withTimezone: true }),
  // Debrief funnel
  paymentStatus: text("payment_status"),
  leadStage: text("lead_stage"),
  selectedFocus: text("selected_focus"),
  debriefBookingDate: timestamp("debrief_booking_date", { withTimezone: true }),
  funnelEvents: jsonb("funnel_events"),
  // Admin / debrief summary
  debriefSummaryStatus: text("debrief_summary_status"),
  debriefSummaryData: jsonb("debrief_summary_data"),
  debriefSummarySentAt: timestamp("debrief_summary_sent_at", { withTimezone: true }),
  internalNotes: text("internal_notes"),
  debriefRecommendedService: text("debrief_recommended_service"),
  recommendationData: jsonb("recommendation_data"),
  // Email automation state
  appointmentConfirmationSent: boolean("appointment_confirmation_sent").default(false),
  reminderSent: boolean("reminder_sent").default(false),
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
