import { buildConfig } from "payload";
import { mongooseAdapter } from "@payloadcms/db-mongodb";

const dbUrl = process.env.DATABASE_URI || process.env.DATABASE_URL;

export default buildConfig({
  serverURL: process.env.SERVER_URL,
  // Secret used to sign cookies/tokens — keep this safe in production
  secret: process.env.PAYLOAD_SECRET,
  // Create the DB adapter only when a DB URL is present. When no URL is
  // available (for example during static builds or environments without a
  // configured MongoDB), leave `db` undefined so Payload doesn't attempt to
  // initialize a DB connection with a missing URL.
  db: dbUrl
    ? mongooseAdapter({
        url: dbUrl,
      })
    : undefined,
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
