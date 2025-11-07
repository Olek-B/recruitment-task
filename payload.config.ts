import { buildConfig } from "payload/config";

export default buildConfig({
  serverURL: "http://localhost:3000",
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
