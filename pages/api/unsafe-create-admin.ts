import type { NextApiRequest, NextApiResponse } from "next";
import payload from "payload";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import payloadConfig from "../../payload.config";

/**
 * UNSAFE: Development-only endpoint that creates an admin user with
 * provided credentials (or defaults to `admin / admin`). This endpoint
 * intentionally performs no authentication or protection and should NEVER
 * be used in production. Remove or protect this file once you've finished
 * your learning exercises.
 *
 * Usage (GET or POST):
 *  - GET  /api/unsafe-create-admin                -> creates admin with default creds
 *  - POST /api/unsafe-create-admin
 *      Body: { "email": "...", "password": "...", "name": "..." }
 *
 * The endpoint will initialize Payload programmatically if it isn't already.
 */

type ResponseBody =
  | { ok: true; id: string; email: string }
  | { ok: false; error: string };

async function ensurePayloadInitialized() {
  // If payload is already initialized and cached, reuse it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalAny = globalThis as any;
  if (globalAny.__payloadInstance) {
    return;
  }

  const dbUrl = process.env.DATABASE_URI || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URI or DATABASE_URL is not set in the environment.");
  }

  const db = mongooseAdapter({ url: dbUrl });

  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    db,
    config: payloadConfig as any,
  } as any);

  // Cache the initialized instance for lambda reuse / hot reloads
  globalAny.__payloadInstance = payload;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  try {
    // Allow GET for quick testing, POST for explicit data
    if (req.method !== "GET" && req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    // Default insecure credentials (development learning only)
    const defaults = {
      email: "admin@example.com",
      password: "admin",
      name: "Admin",
    };

    const body = req.method === "POST" ? req.body ?? {} : {};
    const email = (body.email as string) || defaults.email;
    const password = (body.password as string) || defaults.password;
    const name = (body.name as string) || defaults.name;

    // Initialize Payload if necessary
    await ensurePayloadInitialized();

    // Check for existing user with the same email to avoid duplicates
    const existing = await payload.find({
      collection: "users",
      where: { email },
      limit: 1,
    });

    if (existing?.docs?.length) {
      return res.status(200).json({
        ok: true,
        id: String(existing.docs[0].id ?? existing.docs[0]._id ?? ""),
        email,
      });
    }

    // Create the user using Payload server API; overrideAccess so we can create even
    // when collection access would otherwise restrict it.
    const created = await payload.create({
      collection: "users",
      data: {
        email,
        password,
        name,
      },
      overrideAccess: true,
    });

    const id = (created as any).id || (created as any)._id || "";

    return res.status(201).json({ ok: true, id: String(id), email });
  } catch (err: any) {
    console.error("unsafe-create-admin error:", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message ?? String(err) });
  }
}
