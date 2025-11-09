import { buildConfig } from "payload";
import { mongooseAdapter } from "@payloadcms/db-mongodb";

export default buildConfig({
  serverURL: process.env.SERVER_URL || "http://localhost:3000",
  // Secret used to sign cookies/tokens — keep this safe in production
  secret: process.env.PAYLOAD_SECRET || "change-me-to-a-secure-secret",
  // Database configuration: prefer DATABASE_URL, fallback to a local MongoDB URL.
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
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
