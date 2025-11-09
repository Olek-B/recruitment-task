/**
 * postcss.config.mjs
 *
 * Tailwind v3-compatible PostCSS configuration.
 * Use the `tailwindcss` plugin (this is the correct plugin for Tailwind v3).
 * Do NOT reference the non-existent `@tailwindcss/postcss` package.
 *
 * If you later upgrade/downgrade Tailwind, ensure this file aligns with that
 * version's recommended PostCSS plugin mapping.
 */

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
