import type { NextApiRequest, NextApiResponse } from "next";
import payload from "payload";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import payloadConfig from "../../payload.config";

/**
 * API route to create the first/admin user programmatically.
 *
 * Protection:
 * - Must supply a token that matches process.env.ADMIN_SETUP_TOKEN.
 *   Provide it in header `x-admin-setup-token` or in JSON body `{ token: "..." }`.
 *
 * Usage (example curl):
 *   curl -X POST https://your-site.example.com/api/create-admin \
 *     -H "Content-Type: application/json" \
 *     -d '{"token":"<ADMIN_SETUP_TOKEN>","email":"admin@example.com","password":"changeme","name":"Admin"}'
 *
 * Notes:
 * - This route initializes Payload programmatically if necessary and then calls
 *   `payload.create` to create a user in the `users` collection.
 * - The route should be used as a one-off; you should remove or disable it after use
 *   in production for best security.
 */

type ApiResponse =
  | { ok: true; id: string; message?: string }
  | { ok: false; error: string };

async function ensurePayloadInitialized() {
  // Reuse cached instance when possible (hot reload / lambda reuse)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((globalThis as any).__payloadInstance) {
    return (globalThis as any).__payloadInstance as typeof payload;
  }

  const dbUrl = process.env.DATABASE_URI || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URI or DATABASE_URL is not set.");
  }

  const db = mongooseAdapter({
    url: dbUrl,
  });

  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    db,
    config: payloadConfig as any,
  } as any);

  // Cache
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__payloadInstance = payload;
  return payload;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Get token from header or body
  const providedToken =
    (req.headers["x-admin-setup-token"] as string | undefined) ||
    (req.body && req.body.token);

  const expectedToken = process.env.ADMIN_SETUP_TOKEN;

  if (!expectedToken) {
    return res
      .status(500)
      .json({ ok: false, error: "ADMIN_SETUP_TOKEN is not configured on the server." });
  }

  if (!providedToken || providedToken !== expectedToken) {
    return res.status(401).json({ ok: false, error: "Unauthorized (invalid token)." });
  }

  const { email, password, name } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      error: "Missing required fields: `email` and `password` are required.",
    });
  }

  try {
    // Ensure Payload is initialized
    await ensurePayloadInitialized();

    // Create the user using Payload's server API.
    // Use overrideAccess to bypass collection-level access restrictions since this
    // is a server-side trusted operation.
    const created = await payload.create({
      collection: "users",
      data: {
        email,
        password,
        name: name ?? "Admin",
      },
      overrideAccess: true,
    });

    // `created` should contain the new document; return its id.
    const id = (created as any).id || (created as any)._id || null;

    return res.status(201).json({
      ok: true,
      id: id ? String(id) : String((created as any).id ?? (created as any)._id ?? ""),
      message: "Admin user created. Remove or disable this endpoint after use.",
    });
  } catch (err: any) {
    // Handle common cases
    const message = err?.message ?? String(err);

    if (message.toLowerCase().includes("email") && message.toLowerCase().includes("already")) {
      return res.status(409).json({ ok: false, error: "A user with that email already exists." });
    }

    console.error("create-admin error:", err);
    return res.status(500).json({
      ok: false,
      error: `Failed to create admin user: ${message}`,
    });
  }
}
