// Shared nav derivations for the chrome. Header and footer must express the
// same IA, so the footer sitemap is computed from the same NavItem[] the
// header renders — it cannot drift.

/** Structural shape of a nav item. Kept local rather than imported from
 *  SiteHeader.astro so plain .ts files can use it; NavItem is assignable. */
export interface NavLike {
  label: string;
  path: string;
  children?: NavLike[] | undefined;
}

export interface FooterColumn {
  heading: string;
  links: { label: string; path: string }[];
}

/**
 * Full sitemap for the footer (WA-48). Every nav group becomes its own
 * column; ungrouped items collect under "Navigate". Deep IA lives in the
 * footer, which is what lets the header stay short.
 */
export function footerColumns(nav: NavLike[], homePath: string): FooterColumn[] {
  const ungrouped = nav.filter((item) => !item.children?.length);
  const groups = nav.filter((item) => item.children?.length);

  const columns: FooterColumn[] = [
    {
      heading: 'Navigate',
      links: [
        { label: 'Home', path: homePath },
        ...ungrouped.map((item) => ({ label: item.label, path: item.path })),
      ],
    },
  ];

  for (const group of groups) {
    columns.push({
      heading: group.label,
      links: [
        { label: `${group.label} overview`, path: group.path },
        ...(group.children ?? []).map((child) => ({ label: child.label, path: child.path })),
      ],
    });
  }

  return columns;
}
