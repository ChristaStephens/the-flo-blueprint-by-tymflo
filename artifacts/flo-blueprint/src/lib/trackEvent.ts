export function trackFunnelEvent(event: string, leadId?: string | number | null): void {
  const id = leadId != null ? String(leadId) : undefined;
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, leadId: id }),
  }).catch(() => {});
  console.log("[flo-funnel]", event, { leadId: id });
}
