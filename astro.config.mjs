import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const inferredBase = repository && !repository.endsWith('.github.io') ? `/${repository}/` : '/';
const base = process.env.BASE_PATH || inferredBase;
// Astro does not prefix `base` onto redirect destinations, so add it here.
const to = (route) => `${base.replace(/\/$/, '')}/${route}`;
export default defineConfig({
  site: process.env.SITE_URL || 'https://jomvill.github.io',
  base,
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [sitemap()],
  redirects: {
    '/research/': to('academic/'),
    '/teaching/': to('academic/'),
    '/writing/': to('academic/'),
    '/work/applied-ai/': to('work/'),
    '/work/ai-literacy-policy/': to('work/'),
    '/work/digital-government/': to('work/'),
    '/work/environmental-sensing/': to('work/'),
  },
});
