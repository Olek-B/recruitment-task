import { buildConfig } from "payload";
import { mongooseAdapter } from "@payloadcms/db-mongodb";

const dbUrl = process.env.DATABASE_URI || process.env.DATABASE_URL || "aaaa";

if (!dbUrl) {
  console.warn(
    "WARNING: DATABASE_URI or DATABASE_URL is not set. Payload will run without a database connection.",
  );
}

export default buildConfig({
  serverURL: process.env.SERVER_URL,
  // Secret used to sign cookies/tokens — keep this safe in production
  secret: process.env.PAYLOAD_SECRET || "default_secret",
  // Create the DB adapter only when a DB URL is present. When no URL is
  // available (for example during static builds or environments without a
  // configured MongoDB), leave `db` undefined so Payload doesn't attempt to
  // initialize a DB connection with a missing URL.
  db: mongooseAdapter({
    url: dbUrl,
  }),
  admin: {
    user: "users",
  },
  collections: [
    {
      slug: "users",
      auth: true,
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "email",
          type: "email",
          required: true,
        },
      ],
    },
    {
      slug: "posts",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "content",
          type: "textarea",
          required: true,
        },
        {
          name: "author",
          type: "relationship",
          relationTo: "users",
          required: true,
        },
      ],
    },
  ],
});
