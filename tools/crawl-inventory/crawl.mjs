// URL inventory of the legacy site (WA-25, DoD 6). Read-only, identified,
// polite: 1 request every 600ms, robots.txt * rules respected. Seeds from
// the Yoast sitemap index, then BFS from / so every URL carries a click
// depth. Emits data/inventory.csv (+ .json) — committed, text-only.
// Usage: node crawl.mjs [--limit N]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { normalizeUrl, parseRobots, isDisallowed, parseSitemapLocs, toCsv } from './lib.mjs';

const ORIGIN = 'https://fountainheadschools.org';
const UA = 'FountainheadInventoryBot/1.0 (vardan.kabra@fountainheadschools.org)';
const DELAY_MS = 600;
const LIMIT = Number(process.argv[process.argv.indexOf('--limit') + 1]) || 500;
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'data');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, asText = true) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/xml' },
        redirect: 'manual',
        signal: AbortSignal.timeout(25_000),
      });
      return { res, text: asText && res.status === 200 ? await res.text() : '' };
    } catch (e) {
      if (attempt === 3) return { res: null, text: '', error: String(e) };
      await sleep(1500 * attempt);
    }
  }
}

console.log(`crawl: ${ORIGIN} (limit ${LIMIT}, ${DELAY_MS}ms politeness)`);

// robots.txt — respect User-agent: * rules
const robotsRes = await get(`${ORIGIN}/robots.txt`);
const disallows = robotsRes.text ? parseRobots(robotsRes.text) : [];
console.log(`crawl: robots disallows for *: ${JSON.stringify(disallows)}`);

// sitemap seed
const sitemapUrls = new Set();
const { text: indexXml } = await get(`${ORIGIN}/sitemap_index.xml`);
const sitemaps = parseSitemapLocs(indexXml).filter((u) => u.endsWith('.xml'));
for (const sm of sitemaps) {
  await sleep(DELAY_MS);
  const { text } = await get(sm);
  for (const loc of parseSitemapLocs(text)) {
    const n = normalizeUrl(loc);
    if (n) sitemapUrls.add(n);
  }
}
console.log(`crawl: ${sitemaps.length} sitemaps, ${sitemapUrls.size} sitemap URLs`);

// BFS from /
const records = new Map();
const queue = [{ url: normalizeUrl('/'), depth: 0 }];
const queued = new Set([normalizeUrl('/')]);

while (queue.length > 0 && records.size < LIMIT) {
  const { url, depth } = queue.shift();
  const pathname = new URL(url).pathname;
  if (isDisallowed(pathname, disallows)) continue;

  await sleep(DELAY_MS);
  const { res, text, error } = await get(url);
  if (!res) {
    records.set(url, { url, status: `error: ${error}`, depth });
    continue;
  }

  const record = {
    url,
    status: res.status,
    redirect_to: '',
    depth,
    source: sitemapUrls.has(url) ? 'both' : 'crawl',
    title: '',
    canonical: '',
    meta_robots: '',
    last_modified: res.headers.get('last-modified') ?? '',
    outlinks: 0,
    words: 0,
  };

  if (res.status >= 300 && res.status < 400) {
    const target = normalizeUrl(res.headers.get('location') ?? '', url);
    record.redirect_to = res.headers.get('location') ?? '';
    if (target && !queued.has(target)) {
      queued.add(target);
      queue.push({ url: target, depth });
    }
  } else if (res.status === 200) {
    const $ = load(text);
    record.title = $('title').first().text().trim();
    record.canonical = $('link[rel="canonical"]').attr('href') ?? '';
    record.meta_robots = $('meta[name="robots"]').attr('content') ?? '';
    record.last_modified = $('meta[property="article:modified_time"]').attr('content') || record.last_modified;
    $('script, style, noscript').remove();
    record.words = $('body').text().split(/\s+/).filter(Boolean).length;

    const links = new Set();
    $('a[href]').each((_, el) => {
      const n = normalizeUrl($(el).attr('href'), url);
      if (n) links.add(n);
    });
    record.outlinks = links.size;
    for (const link of links) {
      if (!queued.has(link)) {
        queued.add(link);
        queue.push({ url: link, depth: depth + 1 });
      }
    }
  }

  records.set(url, record);
  if (records.size % 20 === 0) console.log(`crawl: ${records.size} fetched, ${queue.length} queued`);
}

// sitemap-only URLs (in the sitemap, unreachable by BFS — orphans)
for (const url of sitemapUrls) {
  if (records.has(url) || records.size >= LIMIT) continue;
  await sleep(DELAY_MS);
  const { res } = await get(url, false);
  records.set(url, {
    url,
    status: res?.status ?? 'error',
    redirect_to: res && res.status >= 300 && res.status < 400 ? (res.headers.get('location') ?? '') : '',
    depth: '',
    source: 'sitemap-only',
    title: '',
    canonical: '',
    meta_robots: '',
    last_modified: res?.headers.get('last-modified') ?? '',
    outlinks: '',
    words: '',
  });
}

const rows = [...records.values()].sort(
  (a, b) => (a.depth === '' ? 99 : a.depth) - (b.depth === '' ? 99 : b.depth) || a.url.localeCompare(b.url),
);
const COLUMNS = ['url', 'status', 'redirect_to', 'depth', 'source', 'title', 'canonical', 'meta_robots', 'last_modified', 'outlinks', 'words'];

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'inventory.csv'), toCsv(rows, COLUMNS));
writeFileSync(join(OUT, 'inventory.json'), JSON.stringify({ crawledAt: new Date().toISOString(), origin: ORIGIN, rows }, null, 2));

const ok = rows.filter((r) => r.status === 200).length;
console.log(`\ncrawl: done — ${rows.length} URLs (${ok} × 200, ${rows.length - ok} other) → data/inventory.csv`);
