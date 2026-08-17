// Legacy-tooling core functions (WA-24/WA-25): URL normalisation, robots
// parsing, GSC join, redirect generation, and Elementor extraction — all
// pure, all testable without network.
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain-JS tool module
import { normalizeUrl, parseRobots, isDisallowed, parseSitemapLocs, joinGsc, buildRedirects, parseCsv } from '../../../tools/crawl-inventory/lib.mjs';
// @ts-expect-error plain-JS tool module
import { extractHtml, slugFor } from '../../../tools/extract-legacy/lib.mjs';

describe('crawl-inventory lib', () => {
  it('normalises host, protocol, trailing slash, tracking params', () => {
    expect(normalizeUrl('http://www.fountainheadschools.org/about?utm_source=x&b=1#top')).toBe(
      'https://fountainheadschools.org/about/?b=1',
    );
  });

  it('collapses Jetpack share/replytocom links onto the page itself', () => {
    expect(normalizeUrl('https://fountainheadschools.org/bal-mela-2026/?share=facebook')).toBe(
      'https://fountainheadschools.org/bal-mela-2026/',
    );
    expect(normalizeUrl('https://fountainheadschools.org/x/?replytocom=9')).toBe('https://fountainheadschools.org/x/');
  });

  it('rejects off-site and asset URLs', () => {
    expect(normalizeUrl('https://instagram.com/fountainhead')).toBeNull();
    expect(normalizeUrl('https://fountainheadschools.org/x.pdf')).toBeNull();
    expect(normalizeUrl('mailto:a@b.c')).toBeNull();
  });

  it('parses robots * rules and honours them', () => {
    const disallows = parseRobots('User-agent: *\nDisallow: /wp-admin/\n\nUser-agent: other\nDisallow: /');
    expect(disallows).toEqual(['/wp-admin/']);
    expect(isDisallowed('/wp-admin/x', disallows)).toBe(true);
    expect(isDisallowed('/about/', disallows)).toBe(false);
  });

  it('extracts sitemap locs', () => {
    expect(parseSitemapLocs('<urlset><url><loc>https://a/x/</loc></url><url><loc> https://a/y/ </loc></url></urlset>')).toEqual([
      'https://a/x/',
      'https://a/y/',
    ]);
  });

  it('parses quoted CSV', () => {
    expect(parseCsv('a,b\n"x, y",2\n')).toEqual([
      ['a', 'b'],
      ['x, y', '2'],
    ]);
  });

  it('joins GSC export onto the inventory and finds orphans', () => {
    const inventory = [
      { url: 'https://fountainheadschools.org/about/', status: 200 },
      { url: 'https://fountainheadschools.org/unranked/', status: 200 },
    ];
    const gsc = 'Top pages,Clicks,Impressions,CTR,Position\nhttps://fountainheadschools.org/about/,10,500,2%,3.2\nhttps://fountainheadschools.org/orphan/,5,100,5%,1.1\n';
    const { joined, gscOnly } = joinGsc(inventory, gsc);
    expect(joined[0]).toMatchObject({ url: 'https://fountainheadschools.org/about/', impressions: 500, clicks: 10 });
    expect(joined[1]).toMatchObject({ impressions: 0 });
    expect(gscOnly).toEqual([{ url: 'https://fountainheadschools.org/orphan/', clicks: 5, impressions: 100, ctr: '5%', position: '1.1' }]);
  });

  it('generates _redirects and rejects malformed maps', () => {
    const out = buildRedirects('old_path,new_path,note\n/a/,/b/,why\n/c/,/d/,\n');
    expect(out).toContain('# GENERATED');
    expect(out).toContain('# why\n/a/ /b/ 301');
    expect(out).toContain('/c/ /d/ 301');
    expect(() => buildRedirects('old_path,new_path,note\nno-slash,/b/,\n')).toThrow();
    expect(() => buildRedirects('old_path,new_path,note\n/a/,/b/,\n/a/,/c/,\n')).toThrow(/duplicate/);
  });

  it('Cloudflare format invariant: every rule line is 2–3 tokens, notes are whole-line comments', () => {
    // The live API rejected trailing inline comments (deploy 2026-07-20);
    // this pins the fix.
    const out = buildRedirects('old_path,new_path,note\n/a/,/b/,a long note with many words in it\n');
    for (const line of out.split('\n')) {
      if (!line || line.startsWith('#')) continue;
      expect(line.trim().split(/\s+/).length).toBeLessThanOrEqual(3);
    }
  });
});

describe('extract-legacy lib', () => {
  const ELEMENTOR_HTML = `
    <html><head><title>Uniform Policy | Fountainhead School</title></head><body>
    <header class="elementor-location-header"><nav>Menu Menu Menu</nav></header>
    <div data-elementor-type="wp-page">
      <div class="elementor-widget elementor-widget-heading"><h2>Why uniforms</h2></div>
      <div class="elementor-widget elementor-widget-text-editor"><p>Children wear the uniform with pride and comfort every single day.</p></div>
      <div class="elementor-widget elementor-widget-image">
        <img src="/wp-content/uploads/uniform.jpg" srcset="/wp-content/uploads/uniform-300.jpg 300w, /wp-content/uploads/uniform-1024.jpg 1024w" alt="Uniform" />
      </div>
      <div class="elementor-widget elementor-widget-fancy-carousel"><div class="swiper">slides</div></div>
      <p><a href="/wp-content/uploads/policy.pdf">Download PDF</a></p>
    </div>
    <footer class="elementor-location-footer">footer chrome</footer>
    </body></html>`;

  it('extracts headings, prose and title; strips chrome', () => {
    const r = extractHtml(ELEMENTOR_HTML, 'https://fountainheadschools.org/school-policy/uniform-policy/');
    expect(r.title).toBe('Uniform Policy');
    expect(r.markdown).toContain('## Why uniforms');
    expect(r.markdown).toContain('uniform with pride');
    expect(r.markdown).not.toContain('Menu Menu Menu');
    expect(r.markdown).not.toContain('footer chrome');
  });

  it('collects largest srcset candidate + linked PDFs as media placeholders', () => {
    const r = extractHtml(ELEMENTOR_HTML, 'https://fountainheadschools.org/x/');
    expect(r.media).toContain('https://fountainheadschools.org/wp-content/uploads/uniform-1024.jpg');
    expect(r.media).toContain('https://fountainheadschools.org/wp-content/uploads/policy.pdf');
    expect(r.markdown).toContain('{{media:https://fountainheadschools.org/wp-content/uploads/uniform-1024.jpg}}');
  });

  it('flags unknown widgets and sliders — never silently drops', () => {
    const r = extractHtml(ELEMENTOR_HTML, 'https://fountainheadschools.org/x/');
    expect(r.flags.join(' ')).toContain('unknown-widgets: fancy-carousel');
    expect(r.flags).toContain('has-slider');
  });

  it('picks the text-largest Elementor container, not the HFE header template', () => {
    const html = `
      <body>
      <header><div data-elementor-type="wp-post"><div class="elementor-widget elementor-widget-site-logo">Logo Menu Search</div></div></header>
      <div data-elementor-type="wp-page">
        <div class="elementor-widget elementor-widget-text-editor"><p>The actual page content is much longer than the header chrome and this sentence proves it beyond doubt.</p></div>
      </div>
      </body>`;
    const r = extractHtml(html, 'https://fountainheadschools.org/x/');
    expect(r.markdown).toContain('actual page content');
    expect(r.markdown).not.toContain('Logo Menu Search');
  });

  it('slug generation', () => {
    expect(slugFor('https://x.org/school-policy/uniform-policy/')).toBe('school-policy--uniform-policy');
    expect(slugFor('https://x.org/')).toBe('home');
  });
});
