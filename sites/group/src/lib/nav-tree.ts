// Pure two-level nav tree builder (WA-48). Kept separate from matrix.ts so
// it is testable without the content layer — same reason resolve.ts is pure.
//
// The nav is two levels by decision, not by accident: a page nested deeper
// than one segment still groups under its FIRST segment rather than growing
// a third level.

export interface NavSource {
  /** Resolved page id, e.g. 'academics' or 'academics/pyp' */
  id: string;
  path: string;
  label: string;
  order: number;
}

export interface NavNode {
  label: string;
  path: string;
  children?: NavNode[];
}

const byOrder = <T extends { order: number; label: string }>(a: T, b: T) =>
  a.order - b.order || a.label.localeCompare(b.label);

/**
 * Groups nested pages under their top-level parent.
 *
 * A child whose parent page does not resolve (draft, excluded, or simply
 * absent) is **promoted to top level** rather than dropped — nav must never
 * silently lose a real page.
 */
export function buildNavTree(pages: NavSource[]): NavNode[] {
  const topLevel = pages.filter((p) => !p.id.includes('/'));
  const nested = pages.filter((p) => p.id.includes('/'));
  const topIds = new Set(topLevel.map((p) => p.id));

  const childrenOf = new Map<string, NavSource[]>();
  const orphans: NavSource[] = [];
  for (const page of nested) {
    const parent = page.id.split('/')[0]!;
    if (!topIds.has(parent)) {
      orphans.push(page);
      continue;
    }
    const list = childrenOf.get(parent) ?? [];
    list.push(page);
    childrenOf.set(parent, list);
  }

  return [...topLevel, ...orphans]
    .sort(byOrder)
    .map(({ id, label, path }) => {
      const children = (childrenOf.get(id) ?? [])
        .sort(byOrder)
        .map((c) => ({ label: c.label, path: c.path }));
      return children.length ? { label, path, children } : { label, path };
    });
}

/** Flags the active page, and marks a parent whose child is active. */
export function markCurrent<T extends NavNode & { current?: boolean }>(
  items: T[],
  activePath: string,
): (NavNode & { current?: boolean })[] {
  return items.map((item) => {
    const children = item.children?.map((c) => ({ ...c, current: c.path === activePath }));
    return {
      ...item,
      ...(children ? { children } : {}),
      current: item.path === activePath,
    };
  });
}
