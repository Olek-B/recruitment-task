import Image from "next/image";
import { findPosts } from "./lib/payloadClient";

export default async function Home() {
  let posts: any[] = [];
  let dbError = "";
  try {
    // Use the programmatic Payload helper to query `posts` in-process.
    posts = await findPosts(10);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load posts via programmatic Payload:", error);
    dbError = "Failed to load posts via Payload.";
    posts = [];
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-20 px-8 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex w-full flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Recent posts (via programmatic Payload)
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            The list below is loaded on the server using Payload's programmatic
            API.
          </p>

          <section className="w-full max-w-2xl">
            {posts && posts.length > 0 ? (
              <ul className="flex flex-col gap-6">
                {posts.map((p: any) => (
                  <li
                    key={p._id || p.id}
                    className="rounded-md border border-gray-200 p-4 dark:border-white/10 bg-white dark:bg-[#0b0b0b]"
                  >
                    <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                      {p.title}
                    </h2>
                    <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                      {p.content}
                    </p>
                    <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                      Author:{" "}
                      {typeof p.author === "string"
                        ? p.author
                        : (p.author?.name ?? "Unknown")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-md border border-gray-200 p-4 text-zinc-700 dark:text-zinc-300">
                {dbError ? (
                  <span>{dbError}</span>
                ) : (
                  <span>No posts found in Payload.</span>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row mt-8">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
