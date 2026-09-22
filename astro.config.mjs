import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const inferredBase = repository && !repository.endsWith('.github.io') ? `/${repository}/` : '/';
export default defineConfig({
  site: process.env.SITE_URL || 'https://jomvill.github.io',
  base: process.env.BASE_PATH || inferredBase,
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [sitemap()],
});
