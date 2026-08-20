// Bridges Astro collections → the pure resolver, and exposes one memoized
// SITE CONTEXT consumed by the Tier A route ([...path].astro) AND the
// system routes (news, galleries, staff, calendar, policies, programmes).
// Nav derives from the RESOLVED matrix plus data-driven system links —
// navigation can never drift from real pages.
import { getCollection, type CollectionEntry } from 'astro:content';
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  resolveMatrix,
  buildReport,
  formatReport,
  type PageRef,
  type CampusRef,
  type ResolvedPage,
} from './resolve';
import { buildNavTree, markCurrent, type NavSource } from './nav-tree';
import { resolveSocial, socialUrl, type SocialLinks } from './site';

export interface NavItem {
  label: string;
  path: string;
  current?: boolean;
  /** Second-level items (WA-48). Nav is two levels deep — no further. */
  children?: NavItem[];
}
export interface NewsItem {
  title: string;
  date: Date;
  path: string;
  campus?: string | undefined;
}
/** The network positioning claim (WA-47), derived from launched campuses so
 *  it cannot drift from the real estate. Never a hardcoded count. */
export interface NetworkSummary {
  campusCount: number;
  cities: string[];
  /** Cities as English prose: "Surat, Vapi and Chhatrapati Sambhajinagar" */
  citiesLabel: string;
}

export interface RouteProps {
  entry: CollectionEntry<'group'> | CollectionEntry<'campusPages'>;
  campus: CollectionEntry<'campuses'>['data'] | null;
  resolved: ResolvedPage;
  nav: NavItem[];
  sections: { label: string; path: string; note: string }[];
  campuses: { slug: string; name: string; city: string; descriptor?: string | undefined }[];
  network: NetworkSummary;
  news: NewsItem[];
  admissionsPath: string;
  contactPath: string;
  philosophy?: { title: string; excerpt?: string | undefined; path: string } | undefined;
  statutory: CollectionEntry<'statutory'>['data'] | null;
  /** Resolved preschool → school progression pathway (WA-47). */
  continuesAt?: { name: string; path: string } | undefined;
  /** Social links, campus override over group default. Anchors, not embeds. */
  social: { label: string; url: string }[];
}

const SOURCE_NOTE: Record<ResolvedPage['source'], string> = {
  group: '',
  inherited: 'Group-wide',
  overridden: 'Campus-specific',
  'campus-only': 'Campus-specific',
};

export interface SiteContext {
  routes: { params: { path: string | undefined }; props: RouteProps }[];
  campusEntries: CollectionEntry<'campuses'>[];
  navFor: (campusSlug: string | null) => NavItem[];
  /** Footer social links. Exposed here so the SYSTEM routes (news, policies,
   *  staff, calendar, galleries, programmes) render the same footer as the
   *  Tier A route — otherwise only Tier A pages get social links. */
  socialFor: (campusSlug: string | null) => { label: string; url: string }[];
  admissionsPathFor: (campusSlug: string | null) => string;
  contactPathFor: (campusSlug: string | null) => string;
  campusDataFor: (slug: string | null) => CollectionEntry<'campuses'>['data'] | null;
}

let cache: Promise<SiteContext> | null = null;
export function getSiteContext(): Promise<SiteContext> {
  cache ??= compute();
  return cache;
}

async function compute(): Promise<SiteContext> {
  const groupEntries = await getCollection('group');
  const campusPageEntries = await getCollection('campusPages');
  const campusEntries = await getCollection('campuses');
  const newsEntries = await getCollection('news');
  const staffEntries = await getCollection('staff');
  const calendarEntries = await getCollection('calendar');
  const programmeEntries = await getCollection('programmes');
  const statutoryEntries = await getCollection('statutory');

  const errors: string[] = [];

  const campuses: CampusRef[] = campusEntries.map((c) => {
    const dir = c.id.split('/')[0];
    if (dir !== c.data.slug) {
      errors.push(`campus config '${c.id}': slug '${c.data.slug}' does not match directory '${dir}'`);
    }
    return { slug: c.data.slug, inherit: c.data.inherit };
  });

  const group: PageRef[] = groupEntries.map((g) => ({
    id: g.id,
    scope: g.data.scope,
    draft: g.data.draft,
  }));

  const campusPages = new Map<string, PageRef[]>();
  for (const p of campusPageEntries) {
    const [slug, ...rest] = p.id.split('/');
    if (!slug || rest.length === 0) continue;
    const list = campusPages.get(slug) ?? [];
    list.push({ id: rest.join('/'), scope: p.data.scope, draft: p.data.draft });
    campusPages.set(slug, list);
  }

  const result = resolveMatrix(group, campusPages, campuses);
  const allErrors = [...errors, ...result.errors];
  if (allErrors.length) {
    throw new Error(`inherit-with-override resolution failed:\n  ${allErrors.join('\n  ')}`);
  }

  // The build-time drift report (brief §4) — memoisation makes this once.
  const report = buildReport(result, group, campuses, campusPages);
  console.log(`\n${formatReport(report)}\n`);
  try {
    mkdirSync('../../artifacts', { recursive: true });
    writeFileSync(
      '../../artifacts/inheritance-report.json',
      JSON.stringify({ generatedAt: new Date().toISOString(), ...report }, null, 2),
    );
  } catch {
    // Report artifact is best-effort; the console table is the primary emit.
  }

  const entryFor = (page: ResolvedPage) => {
    if (page.source === 'overridden' || page.source === 'campus-only') {
      return campusPageEntries.find((e) => e.id === `${page.campus}/${page.id}`);
    }
    return groupEntries.find((e) => e.id === page.id);
  };

  const campusDataFor = (slug: string | null) =>
    slug ? (campusEntries.find((c) => c.data.slug === slug)?.data ?? null) : null;

  const staffCampuses = new Set(staffEntries.map((s) => s.data.campus));
  const calendarCampuses = new Set(calendarEntries.map((c) => c.data.campus));
  const hasProgrammes = programmeEntries.some((p) => !p.data.draft);

  // Data-driven system links (Tier B/C surfaces) appended per campus.
  const systemLinks = (campusSlug: string | null): { label: string; path: string; note: string }[] => {
    if (!campusSlug) return [];
    const links: { label: string; path: string; note: string }[] = [];
    if (campusSlug === 'falh' && hasProgrammes) {
      links.push({ label: 'Programmes', path: '/falh/programmes/', note: 'Catalogue' });
    }
    if (staffCampuses.has(campusSlug)) {
      links.push({ label: 'Our people', path: `/${campusSlug}/staff/`, note: 'Directory' });
    }
    if (calendarCampuses.has(campusSlug)) {
      links.push({ label: 'Calendar', path: `/${campusSlug}/calendar/`, note: 'Academic year' });
    }
    return links;
  };

  // Group-level static nav — matches the FS content brief (Screenshot 1).
  // Only references pages that exist as content files or system routes.
  // Campus navs remain data-driven via buildNavTree.
  const GROUP_NAV: NavItem[] = [
    {
      label: 'About Us',
      path: '/about/',
      children: [
        { label: 'Our Story and Founders', path: '/founders/' },
        { label: 'Values, Mission & Philosophy', path: '/philosophy/' },
        { label: 'IB Mission Statement', path: '/ib-mission/' },
        { label: 'Our Schools', path: '/our-schools/' },
        { label: 'Accolades & Certifications', path: '/accolades/' },
      ],
    },
    {
      label: 'Academics',
      path: '/academics/',
      children: [
        { label: 'Primary Years Programme', path: '/academics/pyp/' },
        { label: 'Middle Years Programme', path: '/academics/myp/' },
        { label: 'Diploma Programme', path: '/academics/dp/' },
        { label: 'FHSD', path: '/academics/fhsd/' },
        { label: 'Learning Model', path: '/learning-model/' },
        { label: 'Parent Role in Education', path: '/policies/parent-role-in-education/' },
        { label: 'Results & University Destinations', path: '/results/' },
      ],
    },
    {
      label: 'Admissions',
      path: '/admissions/',
    },
    {
      label: 'News & Happenings',
      path: '/news/',
    },
    {
      label: 'Testimonials',
      path: '/testimonials/',
    },
    {
      label: 'Connect',
      path: '/contact/',
      children: [
        { label: 'Contact & Visits', path: '/contact/' },
        { label: 'Careers', path: '/careers/' },
      ],
    },
  ];

  // Two-level nav (WA-48). Group site uses the static editorial nav above;
  // campus pages remain data-driven so they reflect actual published content.
  const navFor = (campusSlug: string | null): NavItem[] => {
    if (campusSlug === null) return GROUP_NAV;
    const sources: NavSource[] = result.pages
      .filter((p) => p.campus === campusSlug && p.id !== 'index')
      .map((p) => {
        const e = entryFor(p);
        return { id: p.id, path: p.path, label: e?.data.title ?? p.id, order: e?.data.order ?? 99 };
      });
    const system = systemLinks(campusSlug).map((s) => ({ label: s.label, path: s.path }));
    const reference = [{ label: 'Policies', path: '/policies/' }];
    return [...buildNavTree(sources), ...system, ...reference];
  };

  // The campus-home "explore" index. Top-level only, so it expresses the
  // SAME information architecture as the header (WA-48): a nested page like
  // academics/pyp belongs under its Academics parent, not alongside
  // Admissions. Children stay reachable from the header disclosure and from
  // the hub page itself — listing them flat here contradicted the nav.
  const sectionsFor = (campusSlug: string): RouteProps['sections'] => {
    const tierA = result.pages
      .filter((p) => p.campus === campusSlug && p.id !== 'index' && !p.id.includes('/'))
      .map((p) => {
        const e = entryFor(p);
        return {
          label: e?.data.title ?? p.id,
          path: p.path,
          note: SOURCE_NOTE[p.source],
          order: e?.data.order ?? 99,
        };
      })
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
      .map(({ label, path, note }) => ({ label, path, note }));
    return [...tierA, ...systemLinks(campusSlug)];
  };

  const admissionsPathFor = (campusSlug: string | null): string => {
    if (campusSlug && result.pages.some((p) => p.campus === campusSlug && p.id === 'admissions')) {
      return `/${campusSlug}/admissions/`;
    }
    return '/admissions/';
  };

  const contactPathFor = (campusSlug: string | null): string => {
    if (campusSlug && result.pages.some((p) => p.campus === campusSlug && p.id === 'contact')) {
      return `/${campusSlug}/contact/`;
    }
    return '/contact/';
  };

  const publishedNews: NewsItem[] = newsEntries
    .filter((n) => !n.data.draft)
    .map((n) => ({
      title: n.data.title,
      date: n.data.publishDate,
      path: `/news/${n.id}/`,
      campus: n.data.campus,
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const newsFor = (campusSlug: string | null): NewsItem[] =>
    publishedNews.filter((n) => !campusSlug || n.campus === campusSlug || n.campus === 'group').slice(0, 4);

  const campusesLite: RouteProps['campuses'] = campusEntries
    .map((c) => ({
      slug: c.data.slug,
      name: c.data.name,
      city: c.data.address.city,
      descriptor: c.data.descriptor,
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  // Network positioning (WA-47). Counts launched campuses only — FASV has a
  // section and a card but does not count until it opens. Cities are ordered
  // by how many campuses sit in each, so the biggest base leads.
  const launched = campusEntries.filter((c) => c.data.launched);
  const cityCounts = new Map<string, number>();
  for (const c of launched) {
    const city = c.data.address.city;
    cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
  }
  const cities = [...cityCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([city]) => city);
  const network: NetworkSummary = {
    campusCount: launched.length,
    cities,
    citiesLabel:
      cities.length > 1 ? `${cities.slice(0, -1).join(', ')} and ${cities[cities.length - 1]}` : (cities[0] ?? ''),
  };

  const philosophyPage = result.pages.find((p) => p.campus === null && p.id === 'philosophy');
  const philosophyEntry = philosophyPage && entryFor(philosophyPage);
  const philosophy = philosophyEntry
    ? { title: philosophyEntry.data.title, excerpt: philosophyEntry.data.description, path: '/philosophy/' }
    : undefined;

  const statutoryFor = (campusSlug: string | null) =>
    campusSlug ? (statutoryEntries.find((s) => s.data.campus === campusSlug)?.data ?? null) : null;

  const SOCIAL_LABELS: Record<keyof SocialLinks, string> = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    youtube: 'YouTube',
  };
  const socialFor = (campusSlug: string | null) => {
    const resolved = resolveSocial(campusDataFor(campusSlug)?.social);
    return (Object.keys(SOCIAL_LABELS) as (keyof SocialLinks)[])
      .filter((k) => resolved[k])
      .map((k) => ({ label: SOCIAL_LABELS[k], url: socialUrl(k, resolved[k]!) }));
  };

  // Preschool → school pathway (WA-47). Unset until the pairing is decided;
  // an unknown slug is a build failure rather than a silently dead link.
  const continuesAtFor = (campusSlug: string | null) => {
    const target = campusSlug ? campusDataFor(campusSlug)?.continuesAt : undefined;
    if (!target) return undefined;
    const school = campusDataFor(target);
    if (!school) {
      throw new Error(`campus '${campusSlug}': continuesAt '${target}' is not a known campus slug`);
    }
    return { name: school.name, path: `/${school.slug}/` };
  };

  const routes = result.pages.map((page) => {
    const entry = entryFor(page);
    if (!entry) throw new Error(`no entry found for resolved page ${page.path}`);
    const nav = markCurrent(navFor(page.campus), page.path);
    return {
      params: { path: page.path === '/' ? undefined : page.path.slice(1, -1) },
      props: {
        entry,
        campus: campusDataFor(page.campus),
        resolved: page,
        nav,
        sections: page.campus ? sectionsFor(page.campus) : [],
        campuses: campusesLite,
        network,
        news: newsFor(page.campus),
        admissionsPath: admissionsPathFor(page.campus),
        contactPath: contactPathFor(page.campus),
        philosophy,
        statutory: statutoryFor(page.campus),
        continuesAt: continuesAtFor(page.campus),
        social: socialFor(page.campus),
      } satisfies RouteProps,
    };
  });

  return { routes, campusEntries, navFor, socialFor, admissionsPathFor, contactPathFor, campusDataFor };
}

export async function buildRouteMatrix() {
  return (await getSiteContext()).routes;
}
