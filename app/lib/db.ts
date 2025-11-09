import mongoose, { Schema, models, model, Document } from "mongoose";

const MONGO_URI =
  process.env.DATABASE_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/payload";

/**
 * Connect to MongoDB if not already connected.
 * Uses mongoose connection pooling; safe to call multiple times.
 */
async function connect() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGO_URI);
}

/**
 * Minimal User and Post interfaces matching `payload.config.ts` collections.
 */
export interface IUser extends Document {
  name?: string;
  email?: string;
}

export interface IPost extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId | IUser | null;
}

/**
 * Schemas - set collection names to match Payload config: "users" and "posts"
 */
const UserSchema = new Schema(
  {
    name: { type: String },
    email: { type: String },
  },
  { collection: "users", timestamps: false }
);

const PostSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "users", required: false },
  },
  { collection: "posts", timestamps: false }
);

/**
 * Create or reuse models (avoids OverwriteModelError in hot reload / serverless environments)
 */
const User = (models.User as mongoose.Model<IUser>) || model<IUser>("User", UserSchema);
const Post = (models.Post as mongoose.Model<IPost>) || model<IPost>("Post", PostSchema);

/**
 * Fetch posts from the database, populating the `author` relationship when possible.
 * Returns plain JS objects (via `.lean()`).
 *
 * @param limit maximum number of posts to return
 */
export async function getPosts(limit = 10): Promise<Array<any>> {
  await connect();
  return Post.find()
    .limit(limit)
    .populate({ path: "author", model: User })
    .lean()
    .exec();
}

/**
 * Fetch a single post by id (string or ObjectId), populating the author.
 */
export async function getPostById(id: string): Promise<any | null> {
  await connect();
  return Post.findById(id).populate({ path: "author", model: User }).lean().exec();
}
