import { buildConfig } from "payload";
import { mongooseAdapter } from "@payloadcms/db-mongodb";

export default buildConfig({
  serverURL:
    process.env.SERVER_URL ||
    "mongodb+srv://preview:ibyh89gY4BPcRwgt@preview.lsyvtno.mongodb.net/?appName=preview",
  // Secret used to sign cookies/tokens — keep this safe in production
  secret: process.env.PAYLOAD_SECRET || "ibyh89gY4BPcRwgt",
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
