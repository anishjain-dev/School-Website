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
 * Full sitemap for the footer (WA-48). Every top-level nav item becomes its
 * own column; items with children list those children beneath; items without
 * children appear as a single link in their column. A "Home" link is prepended
 * to the first column so there is always a root anchor.
 */
export function footerColumns(nav: NavLike[], homePath: string): FooterColumn[] {
  if (!nav.length) return [];

  const columns: FooterColumn[] = nav.map((item) => ({
    heading: item.label,
    links: item.children?.length
      ? [
          { label: `${item.label} overview`, path: item.path },
          ...item.children.map((child) => ({ label: child.label, path: child.path })),
        ]
      : [{ label: item.label, path: item.path }],
  }));

  // Prepend Home to the first column
  columns[0]!.links = [{ label: 'Home', path: homePath }, ...columns[0]!.links];

  return columns;
}
