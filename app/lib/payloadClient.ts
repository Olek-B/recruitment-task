/**
 * Programmatic Payload initializer and finder for server-side usage.
 *
 * This file initializes Payload in-process (only once) and exposes helpers
 * to query collections programmatically using Payload's server API.
 *
 * Notes:
 * - Intended to run only on the server (Next.js server components, API routes).
 * - Make sure the following environment variables are set:
 *   - DATABASE_URI (MongoDB connection string, e.g. Atlas)
 *   - PAYLOAD_SECRET
 *   - SERVER_URL (optional; used by Payload config but not strictly required here)
 *
 * Usage example (server-side):
 *   import { findPosts } from './lib/payloadClient';
 *   const posts = await findPosts(10);
 */

import payload from "payload";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import payloadConfig from "../../payload.config";

declare global {
  // cache payload init on globalThis to avoid multiple initializations
  // during hot reload or in serverless environments that reuse the same runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __payloadInstance: any | undefined;
}

/**
 * Initialize Payload programmatically if it hasn't been initialized yet.
 * Returns the initialized payload instance.
 */
export async function initPayload() {
  // If already initialized, reuse it
  if (globalThis.__payloadInstance) {
    return globalThis.__payloadInstance;
  }

  const secret = process.env.PAYLOAD_SECRET;
  // Accept either DATABASE_URI or DATABASE_URL (prefer DATABASE_URI when both present)
  const dbUrl = process.env.DATABASE_URI || process.env.DATABASE_URL;

  // Debug: log presence of the env vars and which one will be used (do NOT log actual connection strings)
  console.log(
    "[payload] DATABASE_URI present:",
    Boolean(process.env.DATABASE_URI),
  );
  console.log(
    "[payload] DATABASE_URL present:",
    Boolean(process.env.DATABASE_URL),
  );
  console.log(
    "[payload] DB env chosen:",
    process.env.DATABASE_URI
      ? "DATABASE_URI"
      : process.env.DATABASE_URL
        ? "DATABASE_URL"
        : "none",
  );

  if (!dbUrl) {
    throw new Error(
      "DATABASE_URI or DATABASE_URL is not set. Set one of these to your MongoDB connection string (e.g. MongoDB Atlas).",
    );
  }

  // Configure the same adapter that your payload.config.ts uses.
  const db = mongooseAdapter({
    url: dbUrl,
  });

  // Initialize Payload.
  // We provide the same config file so Payload knows about collections, admin, etc.
  // The payload.init signature may accept a config object — this attempts to mirror
  // typical programmatic initialization patterns. If your Payload version requires
  // a slightly different shape, adjust accordingly.
  await payload.init({
    secret,
    db,
    // pass the compiled config to ensure collection definitions are loaded
    config: payloadConfig,
    // do not attach to an express instance here — we only need programmatic access
  } as any);

  // Cache the instance so subsequent calls are no-ops
  globalThis.__payloadInstance = payload;
  return payload;
}

/**
 * Find posts using Payload's server API.
 * Returns the `docs` array from the Payload find response (or an empty array).
 *
 * Example:
 *   const posts = await findPosts(10);
 *
 * @param limit number of posts to fetch
 */
export async function findPosts(limit = 10) {
  const pl = await initPayload();

  // Use payload.find to query the `posts` collection programmatically.
  // We populate the `author` relationship by using `depth: 1`.
  // You can adjust the `where`, `sort`, and `depth` options to fit your needs.
  const result = await pl.find({
    collection: "posts",
    limit,
    depth: 1, // populate relationships one level deep (e.g. author)
    sort: "-createdAt",
  });

  // payload.find typically returns an object with `docs` property.
  // Return the array of documents for convenience.
  return result?.docs ?? [];
}

/**
 * Fetch a single post by ID using Payload's server API.
 *
 * @param id post id
 */
export async function findPostById(id: string) {
  const pl = await initPayload();
  const result = await pl.findByID({
    collection: "posts",
    id,
    depth: 1,
  });

  // findByID returns the document directly
  return result ?? null;
}
