#!/usr/bin/env node
/** Writes public/sitemap.xml and public/robots.txt for marketing pages. */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_ORIGIN, SITEMAP_PAGES } from "./landing-seo.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
mkdirSync(pub, { recursive: true });

const lastmod = new Date().toISOString().slice(0, 10);

const urlEntries = SITEMAP_PAGES.map(
  ({ path, priority, changefreq }) => `  <url>
    <loc>${SITE_ORIGIN}${path === "/" ? "/" : path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

const robots = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;

writeFileSync(join(pub, "sitemap.xml"), sitemap, "utf8");
writeFileSync(join(pub, "robots.txt"), robots, "utf8");
console.log(`Wrote public/sitemap.xml and public/robots.txt (${lastmod})`);
