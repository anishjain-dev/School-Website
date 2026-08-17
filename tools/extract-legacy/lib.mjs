// Elementor → markdown extraction core (WA-24: extract from RENDERED HTML;
// the database export is near-empty serialised JSON). Pure over (html, url)
// so the pipeline is unit-testable without network.
import { load } from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

// Elementor widget types we know convert cleanly. Anything else on the
// page is counted, flagged, and left for human review — never silently
// dropped (the review-flags CSV is the WA-24 human-review worklist).
const KNOWN_WIDGETS = new Set([
  'heading',
  'text-editor',
  'image',
  'icon-list',
  'button',
  'spacer',
  'divider',
  'icon-box',
  'image-box',
]);

const MEDIA_EXT = /\.(jpe?g|png|gif|webp|svg|pdf)(\?|$)/i;

function largestSrcsetCandidate(srcset) {
  let best = null;
  let bestW = -1;
  for (const part of srcset.split(',')) {
    const [url, size] = part.trim().split(/\s+/);
    const w = size?.endsWith('w') ? parseInt(size) : 0;
    if (w > bestW) {
      bestW = w;
      best = url;
    }
  }
  return best;
}

export function extractHtml(html, sourceUrl) {
  const $ = load(html);
  const flags = [];

  const pageTitle = $('h1').first().text().trim() || $('title').first().text().split(/[|–-]/)[0].trim();

  // Content root. Sites using Header-Footer-Elementor render the header
  // and footer as data-elementor-type="wp-post" templates too — so of all
  // Elementor containers outside header/footer, take the TEXT-LARGEST one
  // (the page body dwarfs any chrome template).
  let root = null;
  let bestLen = -1;
  $('[data-elementor-type="wp-page"], [data-elementor-type="wp-post"]').each((_, el) => {
    const $el = $(el);
    if ($el.closest('header, footer').length > 0) return;
    const len = $el.text().length;
    if (len > bestLen) {
      bestLen = len;
      root = $el;
    }
  });
  if (!root || root.length === 0) root = $('#content, main, article').first();
  if (!root || root.length === 0) {
    root = $('body');
    flags.push('no-content-root');
  }

  const visibleWords = root.text().split(/\s+/).filter(Boolean).length;

  // Unknown widget census BEFORE stripping.
  const widgetTypes = new Set();
  root.find('[class*="elementor-widget-"]').each((_, el) => {
    for (const cls of ($(el).attr('class') ?? '').split(/\s+/)) {
      const m = cls.match(/^elementor-widget-([a-z0-9-]+)$/);
      if (m && m[1] !== 'container') widgetTypes.add(m[1]);
    }
  });
  const unknownWidgets = [...widgetTypes].filter((t) => !KNOWN_WIDGETS.has(t));
  if (unknownWidgets.length > 0) flags.push(`unknown-widgets: ${unknownWidgets.join(', ')}`);

  if (root.find('iframe').length > 0) flags.push('has-iframe');
  if (root.find('.swiper, .swiper-slide, .elementor-carousel, .e-n-carousel').length > 0) flags.push('has-slider');
  if (root.find('form').length > 0) flags.push('has-form');
  if (root.find('table').length > 0) flags.push('has-table');

  // Strip chrome and non-content.
  root
    .find(
      'script, style, noscript, form, header, footer, nav, ' +
        '.elementor-location-header, .elementor-location-footer, ' +
        '.swiper-slide-duplicate, .elementor-menu-toggle, button',
    )
    .remove();

  // Media census: largest-candidate images, inline background images,
  // linked PDFs. Rewritten to {{media:URL}} placeholders — the upload
  // queue maps them to Cloudflare Images ids later (media never enters
  // git, hard rule 1).
  const media = new Set();
  root.find('img').each((_, el) => {
    const $el = $(el);
    const srcset = $el.attr('srcset') ?? $el.attr('data-srcset');
    const src = (srcset && largestSrcsetCandidate(srcset)) || $el.attr('src') || $el.attr('data-src') || '';
    try {
      const abs = new URL(src, sourceUrl).toString();
      if (MEDIA_EXT.test(abs)) {
        media.add(abs);
        $el.attr('src', `{{media:${abs}}}`);
        $el.removeAttr('srcset').removeAttr('data-srcset').removeAttr('data-src');
      }
    } catch {
      /* unparsable src — leave as-is */
    }
  });
  root.find('[style*="background-image"]').each((_, el) => {
    const m = ($(el).attr('style') ?? '').match(/background-image:\s*url\(['"]?([^'")]+)/);
    if (m) {
      try {
        const abs = new URL(m[1], sourceUrl).toString();
        if (MEDIA_EXT.test(abs)) media.add(abs);
      } catch {
        /* ignore */
      }
    }
  });
  root.find('a[href$=".pdf"], a[href*=".pdf?"]').each((_, el) => {
    try {
      const abs = new URL($(el).attr('href'), sourceUrl).toString();
      media.add(abs);
      $(el).attr('href', `{{media:${abs}}}`);
    } catch {
      /* ignore */
    }
  });

  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
  td.use(gfm);
  let markdown = td.turndown(root.html() ?? '');
  // Collapse the blank-line noise Elementor's div soup leaves behind.
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  const mdWords = markdown
    .replace(/\{\{media:[^}]+\}\}/g, '')
    .split(/\s+/)
    .filter(Boolean).length;
  const confidence = visibleWords === 0 ? 0 : Math.min(1, mdWords / visibleWords);
  if (confidence < 0.5) flags.push('low-confidence');

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(pageTitle)}`,
    `sourceUrl: ${sourceUrl}`,
    `extractedAt: ${new Date().toISOString()}`,
    `confidence: ${confidence.toFixed(2)}`,
    `flags: ${JSON.stringify(flags)}`,
    '---',
    '',
  ].join('\n');

  return {
    markdown: frontmatter + markdown + '\n',
    media: [...media],
    flags,
    confidence,
    title: pageTitle,
    stats: { visibleWords, mdWords, widgetTypes: [...widgetTypes], unknownWidgets },
  };
}

export function slugFor(url) {
  const path = new URL(url).pathname.replace(/\/$/, '');
  return path === '' ? 'home' : path.split('/').filter(Boolean).join('--');
}
