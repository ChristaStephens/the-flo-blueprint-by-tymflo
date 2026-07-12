import { type RequestHandler } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { logger } from "../lib/logger";

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);

  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized — please sign in" });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(auth.userId);
    const primaryId = user.primaryEmailAddressId;
    const email =
      (primaryId
        ? user.emailAddresses.find(
            (addr: { id: string; emailAddress: string }) => addr.id === primaryId,
          )?.emailAddress
        : undefined) ?? user.emailAddresses[0]?.emailAddress;

    if (!email) {
      res.status(403).json({ error: "Forbidden: no email on account" });
      return;
    }

    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!adminEmails.includes(email.toLowerCase())) {
      logger.warn({ email }, "Admin access denied — not in allowlist");
      res.status(403).json({ error: "Forbidden: admin access only" });
      return;
    }

    (req as typeof req & { adminEmail: string }).adminEmail = email;
    next();
  } catch (err) {
    logger.error({ err }, "Admin auth check failed");
    res.status(500).json({ error: "Auth check failed" });
  }
};
