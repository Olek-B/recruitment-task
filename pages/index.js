praktyki/my-nextjs-payload-app/pages/index.js
import React from 'react';

export default function Home() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Next.js + Payload CMS Starter</h1>
      <p>
        This is a minimal Next.js entry point.<br />
        Payload CMS is configured separately and will be available at <code>/admin</code> after deployment.
      </p>
    </main>
  );
}
