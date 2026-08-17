// Pure helpers for the URL inventory (WA-25) — exported for tests.

// utm/click ids plus WordPress-Jetpack noise: ?share= social links and
// ?replytocom= comment permalinks resolve to the page itself.
const TRACKING_PARAMS = /^(utm_.*|fbclid|gclid|mc_cid|mc_eid|share|replytocom)$/;
const ASSET_EXT = /\.(pdf|jpe?g|png|gif|webp|svg|ico|mp4|mp3|zip|docx?|xlsx?|pptx?|css|js|woff2?)$/i;

/** Canonical form: https, apex host, no hash, no tracking params,
 *  trailing slash on extensionless paths. Returns null for off-site or
 *  non-page URLs. */
export function normalizeUrl(href, base = 'https://fountainheadschools.org/') {
  let u;
  try {
    u = new URL(href, base);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.replace(/^www\./, '');
  if (host !== 'fountainheadschools.org') return null;
  u.protocol = 'https:';
  u.hostname = host;
  u.hash = '';
  for (const key of [...u.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) u.searchParams.delete(key);
  }
  if (ASSET_EXT.test(u.pathname)) return null;
  if (!u.pathname.endsWith('/')) u.pathname += '/';
  return u.toString();
}

/** True if the path is disallowed for User-agent: * */
export function isDisallowed(pathname, disallows) {
  return disallows.some((d) => d && pathname.startsWith(d));
}

/** Parse robots.txt rules for User-agent: * (prefix matching only). */
export function parseRobots(text) {
  const disallows = [];
  let applies = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const [key, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (!key || value === undefined) continue;
    const k = key.toLowerCase();
    if (k === 'user-agent') applies = value === '*';
    else if (applies && k === 'disallow' && value) disallows.push(value);
  }
  return disallows;
}

/** Extract <loc> URLs from a sitemap or sitemap index document. */
export function parseSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

// ── CSV ────────────────────────────────────────────────────────────────

export function toCsv(rows, columns) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  return [columns.join(','), ...rows.map((r) => columns.map((c) => esc(r[c])).join(','))].join('\n') + '\n';
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}

// ── Search Console join (DoD 6) ────────────────────────────────────────

/** Join the inventory against a GSC Performance→Pages export. Header
 *  detection is tolerant: the URL column contains "page", metric columns
 *  matched by name. */
export function joinGsc(inventoryRows, gscCsvText) {
  const rows = parseCsv(gscCsvText);
  const header = rows[0].map((h) => h.toLowerCase());
  const urlCol = header.findIndex((h) => h.includes('page') || h.includes('url'));
  const col = (name) => header.findIndex((h) => h.includes(name));
  const cols = { clicks: col('click'), impressions: col('impression'), ctr: col('ctr'), position: col('position') };
  if (urlCol === -1) throw new Error('GSC export: no page/url column found');

  const gsc = new Map();
  for (const r of rows.slice(1)) {
    const url = normalizeUrl(r[urlCol]);
    if (!url) continue;
    gsc.set(url, {
      clicks: Number(r[cols.clicks] ?? 0) || 0,
      impressions: Number(r[cols.impressions] ?? 0) || 0,
      ctr: r[cols.ctr] ?? '',
      position: r[cols.position] ?? '',
    });
  }

  const joined = inventoryRows.map((row) => ({
    ...row,
    ...(gsc.get(row.url) ?? { clicks: 0, impressions: 0, ctr: '', position: '' }),
  }));
  joined.sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);

  const crawled = new Set(inventoryRows.map((r) => r.url));
  const gscOnly = [...gsc.entries()]
    .filter(([url]) => !crawled.has(url))
    .map(([url, m]) => ({ url, ...m }))
    .sort((a, b) => b.impressions - a.impressions);

  return { joined, gscOnly };
}

// ── _redirects generation (WA-25) ──────────────────────────────────────

/** old_path,new_path,note → Cloudflare _redirects body. Throws on
 *  malformed paths so a bad map can never ship.
 *  FORMAT RULE (learnt from a live deploy rejection): Cloudflare's parser
 *  allows ONLY `source destination [status]` per rule line — comments must
 *  be whole lines. Notes therefore emit as their own # lines, and the
 *  self-check below re-parses the output so a format regression fails at
 *  generation time, not at deploy time. */
export function buildRedirects(mapCsvText) {
  const rows = parseCsv(mapCsvText);
  const [h0, h1] = rows[0].map((h) => h.trim().toLowerCase());
  if (h0 !== 'old_path' || h1 !== 'new_path') throw new Error('redirect-map.csv: header must be old_path,new_path,note');
  const lines = [];
  const seen = new Set();
  for (const [oldPath, newPath, note] of rows.slice(1)) {
    if (!oldPath.startsWith('/') || !newPath.startsWith('/')) {
      throw new Error(`redirect-map.csv: paths must start with / (${oldPath} → ${newPath})`);
    }
    if (seen.has(oldPath)) throw new Error(`redirect-map.csv: duplicate old_path ${oldPath}`);
    seen.add(oldPath);
    if (note) lines.push(`# ${note}`);
    lines.push(`${oldPath} ${newPath} 301`);
  }
  const body =
    '# GENERATED by tools/crawl-inventory/build-redirects.mjs — edit redirect-map.csv, never this file (WA-25).\n' +
    lines.join('\n') +
    '\n';
  // Self-check: every non-comment line must be exactly 2–3 tokens.
  for (const line of body.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const tokens = line.trim().split(/\s+/);
    if (tokens.length < 2 || tokens.length > 3) {
      throw new Error(`generated _redirects line has ${tokens.length} tokens (Cloudflare allows 2–3): ${line}`);
    }
  }
  return body;
}
