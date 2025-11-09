import type { NextApiRequest, NextApiResponse } from "next";
import payload from "payload";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import payloadConfig from "../../../payload.config";

/**
 * Health-check route for Payload initialization.
 *
 * GET /api/payload-health
 * - Returns basic info about whether Payload appears initialized in this runtime,
 *   whether DB env vars are present, and optionally attempts to initialize Payload
 *   if `?init=true` is provided.
 *
 * This endpoint intentionally never echoes secret values (DB connection strings / secrets).
 *
 * Note: This file is placed under:
 *   praktyki/recruitment-task/pages/api/payload-health.ts
 *
 * If you call this with ?init=true the route will try to initialize Payload (server-side).
 */

type HealthResponse =
  | {
      ok: true;
      initialized: boolean;
      initializedBy: string | null;
      env: {
        DATABASE_URI_present: boolean;
        DATABASE_URL_present: boolean;
        chosen_db_env: "DATABASE_URI" | "DATABASE_URL" | null;
        PAYLOAD_SECRET_present: boolean;
      };
      message?: string;
    }
  | {
      ok: false;
      error: string;
    };

async function ensurePayloadInitialized(): Promise<{ initializedBy: string }> {
  // Reuse any cached instance if present
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalAny = globalThis as any;

  if (globalAny.__payloadInstance) {
    return { initializedBy: "__payloadInstance" };
  }

  if (globalAny.__payloadInitialized && globalAny.__payloadExpressApp) {
    return { initializedBy: "__payloadExpressApp" };
  }

  // Attempt to initialize Payload programmatically
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

  // Cache reference so subsequent calls are quick
  globalAny.__payloadInstance = payload;
  globalAny.__payloadInitialized = true;

  return { initializedBy: "payload.init" };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  // Determine env presence
  const hasDatabaseUri = Boolean(process.env.DATABASE_URI);
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const chosenDbEnv = process.env.DATABASE_URI
    ? "DATABASE_URI"
    : process.env.DATABASE_URL
    ? "DATABASE_URL"
    : null;

  const hasPayloadSecret = Boolean(process.env.PAYLOAD_SECRET);

  // Check whether anything looks initialized in this runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalAny = globalThis as any;
  const instancePresent = Boolean(globalAny.__payloadInstance);
  const expressAppPresent = Boolean(globalAny.__payloadExpressApp);
  const initializedFlag = Boolean(globalAny.__payloadInitialized);

  const initRequested =
    typeof req.query.init === "string"
      ? req.query.init === "true"
      : req.query.init === true;

  if (instancePresent || expressAppPresent || initializedFlag) {
    // Already initialized
    const initializedBy =
      (instancePresent && "__payloadInstance") ||
      (expressAppPresent && "__payloadExpressApp") ||
      (initializedFlag && "__payloadInitialized") ||
      "unknown";

    return res.status(200).json({
      ok: true,
      initialized: true,
      initializedBy,
      env: {
        DATABASE_URI_present: hasDatabaseUri,
        DATABASE_URL_present: hasDatabaseUrl,
        chosen_db_env: chosenDbEnv,
        PAYLOAD_SECRET_present: hasPayloadSecret,
      },
      message: "Payload already initialized in this runtime.",
    });
  }

  if (!initRequested) {
    // Not initialized, and not asked to init. Return health with guidance.
    return res.status(200).json({
      ok: true,
      initialized: false,
      initializedBy: null,
      env: {
        DATABASE_URI_present: hasDatabaseUri,
        DATABASE_URL_present: hasDatabaseUrl,
        chosen_db_env: chosenDbEnv,
        PAYLOAD_SECRET_present: hasPayloadSecret,
      },
      message:
        "Payload is not initialized in this runtime. Add ?init=true to attempt initialization (this will try to connect to the DB).",
    });
  }

  // Try to initialize now
  try {
    const result = await ensurePayloadInitialized();
    return res.status(200).json({
      ok: true,
      initialized: true,
      initializedBy: result.initializedBy,
      env: {
        DATABASE_URI_present: hasDatabaseUri,
        DATABASE_URL_present: hasDatabaseUrl,
        chosen_db_env: chosenDbEnv,
        PAYLOAD_SECRET_present: hasPayloadSecret,
      },
      message: "Payload initialized successfully by the health-check.",
    });
  } catch (err: any) {
    const message = err?.message ?? String(err);
    return res.status(500).json({
      ok: false,
      error: `Failed to initialize Payload: ${message}`,
    });
  }
}
