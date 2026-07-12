import { getUncachableStripeClient } from "./stripeClient.js";

const PRODUCTS = [
  {
    name: "Executive Growth Strategy Session",
    description:
      "A structured 90-minute strategy session with a TymFlo executive consultant. We review your Flo Blueprint diagnostic, identify your highest-leverage path, and build a 90-day action plan with measurable milestones.",
    metadata: { serviceId: "executive-growth-strategy" },
    unitAmount: 150000,
  },
  {
    name: "Marketing Systems Review",
    description:
      "A comprehensive audit of your current marketing infrastructure — lead capture, conversion paths, nurture sequences, and channel effectiveness — with a prioritized build plan delivered within two weeks.",
    metadata: { serviceId: "marketing-systems-review" },
    unitAmount: 250000,
  },
  {
    name: "AI Workflow Accelerator",
    description:
      "A targeted AI readiness audit across your highest-friction workflows, followed by a 60-day implementation plan that identifies and deploys two to three high-ROI AI automations with measurable outcomes.",
    metadata: { serviceId: "ai-workflow-accelerator" },
    unitAmount: 350000,
  },
];

async function seedProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    console.log("Connecting to Stripe...");

    for (const product of PRODUCTS) {
      const existing = await stripe.products.search({
        query: `metadata['serviceId']:'${product.metadata.serviceId}' AND active:'true'`,
      });

      if (existing.data.length > 0) {
        console.log(`Already exists: ${product.name} (${existing.data[0].id})`);
        const prices = await stripe.prices.list({
          product: existing.data[0].id,
          active: true,
          limit: 1,
        });
        if (prices.data.length > 0) {
          console.log(`  Price: $${(prices.data[0].unit_amount ?? 0) / 100} (${prices.data[0].id})`);
        }
        continue;
      }

      const created = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: product.metadata,
      });
      console.log(`Created product: ${created.name} (${created.id})`);

      const price = await stripe.prices.create({
        product: created.id,
        unit_amount: product.unitAmount,
        currency: "usd",
      });
      console.log(`  Created price: $${product.unitAmount / 100} (${price.id})`);
    }

    console.log("\nDone. Products seeded successfully.");
  } catch (err: unknown) {
    console.error("Error seeding products:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

seedProducts();
