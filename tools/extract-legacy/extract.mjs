// Extract one or many legacy pages → reviewable markdown + media manifest.
//   node extract.mjs <url> [<url> ...]
//   node extract.mjs --sample N          (N diverse URLs from the inventory)
// Markdown → out/ (gitignored), media → media/ (gitignored, hash-named),
// flags → out/review-flags.csv. Media NEVER enters git (hard rule 1); the
// manifest is the upload queue for Cloudflare Images (September).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractHtml, slugFor } from './lib.mjs';
import { toCsv } from '../crawl-inventory/lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
const MEDIA = join(HERE, 'media');
const UA = 'FountainheadInventoryBot/1.0 (vardan.kabra@fountainheadschools.org)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pickSample(n) {
  const inv = JSON.parse(readFileSync(join(HERE, '../crawl-inventory/data/inventory.json'), 'utf8')).rows;
  const pages = inv.filter((r) => r.status === 200 && r.words > 50);
  // Diversity: round-robin across first path segments so one section
  // cannot dominate the sample.
  const bySection = new Map();
  for (const p of pages) {
    const section = new URL(p.url).pathname.split('/').filter(Boolean)[0] ?? '(home)';
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section).push(p);
  }
  const sections = [...bySection.values()];
  const picked = [];
  for (let i = 0; picked.length < n && sections.some((s) => s.length > i); i++) {
    for (const s of sections) {
      if (picked.length < n && s[i]) picked.push(s[i].url);
    }
  }
  return picked;
}

const args = process.argv.slice(2);
const sampleIdx = args.indexOf('--sample');
const urls = sampleIdx !== -1 ? pickSample(Number(args[sampleIdx + 1]) || 10) : args.filter((a) => a.startsWith('http'));
if (urls.length === 0) {
  console.error('usage: node extract.mjs <url> [...] | --sample N');
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
mkdirSync(MEDIA, { recursive: true });
const manifestPath = join(HERE, 'media-manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const flagRows = [];

for (const url of urls) {
  await sleep(600);
  let html;
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(25_000) });
    if (res.status !== 200) {
      console.error(`extract: ${url} — HTTP ${res.status}, skipped`);
      continue;
    }
    html = await res.text();
  } catch (e) {
    console.error(`extract: ${url} — ${e}, skipped`);
    continue;
  }

  const result = extractHtml(html, url);
  let markdown = result.markdown;

  for (const mediaUrl of result.media) {
    await sleep(300);
    try {
      const res = await fetch(mediaUrl, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30_000) });
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const hash = createHash('sha256').update(buf).digest('hex').slice(0, 16);
      const file = `${hash}${extname(new URL(mediaUrl).pathname) || '.bin'}`;
      writeFileSync(join(MEDIA, file), buf);
      manifest[hash] = { originalUrl: mediaUrl, file, bytes: buf.length, cloudflareId: manifest[hash]?.cloudflareId ?? null };
      markdown = markdown.replaceAll(`{{media:${mediaUrl}}}`, `{{media:${hash}}}`);
    } catch (e) {
      console.error(`extract:   media ${mediaUrl} — ${e}`);
      markdown = markdown.replaceAll(`{{media:${mediaUrl}}}`, `{{media:FAILED ${mediaUrl}}}`);
    }
  }

  const slug = slugFor(url);
  writeFileSync(join(OUT, `${slug}.md`), markdown);
  flagRows.push({
    url,
    file: `${slug}.md`,
    confidence: result.confidence.toFixed(2),
    flags: result.flags.join('; '),
    words: result.stats.mdWords,
    media: result.media.length,
  });
  console.log(
    `extract: ${slug}.md  conf=${result.confidence.toFixed(2)}  words=${result.stats.mdWords}  media=${result.media.length}${result.flags.length ? `  flags=[${result.flags.join('; ')}]` : ''}`,
  );
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
writeFileSync(join(OUT, 'review-flags.csv'), toCsv(flagRows, ['url', 'file', 'confidence', 'flags', 'words', 'media']));
console.log(`\nextract: ${flagRows.length} pages → out/, ${Object.keys(manifest).length} media objects → media/ (gitignored)`);
