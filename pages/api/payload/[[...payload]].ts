import { NextApiRequest, NextApiResponse } from "next";
import express from "express";
import payload from "payload";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import payloadConfig from "../../../payload.config";

/**
 * Serverless Payload handler to mount the admin UI and Payload API under
 * a Next.js API route. This is a catch-all route placed at:
 *   /pages/api/payload/[[...payload]].ts
 *
 * Notes:
 * - We disable Next's body parser so Payload (and multer) can handle multipart.
 * - We cache the initialized Payload + Express app on globalThis to avoid
 *   re-initialization across invocations in serverless environments.
 * - The DB URL is taken from DATABASE_URI or DATABASE_URL.
 */

declare global {
  // Cache across lambda invocations / hot reloads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __payloadExpressApp: any | undefined;
  var __payloadInitialized: boolean | undefined;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function initPayloadExpressApp() {
  if (globalThis.__payloadExpressApp && globalThis.__payloadInitialized) {
    return globalThis.__payloadExpressApp;
  }

  // Create an express app and attach Payload to it.
  const app = express();

  // Prefer DATABASE_URI but fall back to DATABASE_URL (Vercel often uses DATABASE_URL)
  const dbUrl = process.env.DATABASE_URI || process.env.DATABASE_URL;
  if (!dbUrl) {
    // Keep the error descriptive; the admin UI can't be mounted without a DB.
    throw new Error(
      "DATABASE_URI or DATABASE_URL is not set. Set your MongoDB connection string before mounting the Payload admin.",
    );
  }

  const db = mongooseAdapter({
    url: dbUrl,
  });

  // Initialize Payload and mount it on the express app. We pass the same config
  // so collections/admin settings are respected.
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    db,
    express: app,
    config: payloadConfig as any,
  } as any);

  // Cache for reuse
  globalThis.__payloadExpressApp = app;
  globalThis.__payloadInitialized = true;

  return app;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const app = await initPayloadExpressApp();

    // Express apps are also callable handlers: pass the raw req/res through.
    // In some environments Next wraps req/res; calling the express app directly
    // generally works for Next API routes.
    return app(req, res);
  } catch (err: any) {
    // If something went wrong during init, return a 500 with the message.
    console.error("Error initializing Payload admin:", err);
    res.status(500).json({
      error: "Failed to initialize Payload admin",
      message: err?.message ?? String(err),
    });
  }
}
