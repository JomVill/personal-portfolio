import type { APIRoute } from 'astro';
import { path } from '../lib/paths';
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL(path('sitemap-index.xml'), site).href}\n`);
