import { describe, it, expect } from 'vitest';
import { buildNavTree, markCurrent, type NavSource } from '../src/lib/nav-tree';

const page = (id: string, order = 99, label = id): NavSource => ({
  id,
  path: `/${id}/`,
  label,
  order,
});

describe('buildNavTree (WA-48)', () => {
  it('leaves a flat page set flat', () => {
    const tree = buildNavTree([page('admissions', 10), page('contact', 90)]);
    expect(tree).toEqual([
      { label: 'admissions', path: '/admissions/' },
      { label: 'contact', path: '/contact/' },
    ]);
    expect(tree.every((n) => !('children' in n))).toBe(true);
  });

  it('nests a child under its top-level parent', () => {
    const tree = buildNavTree([page('academics', 20), page('academics/pyp', 1, 'PYP')]);
    expect(tree).toEqual([
      {
        label: 'academics',
        path: '/academics/',
        children: [{ label: 'PYP', path: '/academics/pyp/' }],
      },
    ]);
  });

  it('promotes an orphan whose parent does not resolve, rather than dropping it', () => {
    // 'academics' is draft, so only the child resolves — it must still appear.
    const tree = buildNavTree([page('academics/pyp', 1, 'PYP'), page('contact', 90)]);
    expect(tree).toEqual([
      { label: 'PYP', path: '/academics/pyp/' },
      { label: 'contact', path: '/contact/' },
    ]);
  });

  it('groups a deeper-than-two id under its first segment, staying two levels', () => {
    const tree = buildNavTree([page('academics', 20), page('academics/dp/subjects', 1, 'Subjects')]);
    expect(tree).toHaveLength(1);
    expect(tree[0]!.children).toEqual([{ label: 'Subjects', path: '/academics/dp/subjects/' }]);
    // No third level.
    expect(tree[0]!.children!.every((c) => !('children' in c))).toBe(true);
  });

  it('sorts both levels by order, then label', () => {
    const tree = buildNavTree([
      page('academics', 20),
      page('admissions', 10),
      page('academics/myp', 2, 'MYP'),
      page('academics/dp', 2, 'DP'),
      page('academics/pyp', 1, 'PYP'),
    ]);
    expect(tree.map((n) => n.label)).toEqual(['admissions', 'academics']);
    expect(tree[1]!.children!.map((c) => c.label)).toEqual(['PYP', 'DP', 'MYP']);
  });

  it('keeps siblings without children free of an empty children array', () => {
    const tree = buildNavTree([page('academics', 20), page('academics/pyp', 1), page('contact', 90)]);
    const contact = tree.find((n) => n.label === 'contact')!;
    expect('children' in contact).toBe(false);
  });
});

describe('markCurrent', () => {
  it('flags the active top-level page', () => {
    const marked = markCurrent(buildNavTree([page('contact', 90)]), '/contact/');
    expect(marked[0]!.current).toBe(true);
  });

  it('flags an active child without claiming the parent is the page', () => {
    const tree = buildNavTree([page('academics', 20), page('academics/pyp', 1, 'PYP')]);
    const marked = markCurrent(tree, '/academics/pyp/');
    expect(marked[0]!.current).toBe(false);
    expect(marked[0]!.children![0]!.current).toBe(true);
  });

  it('marks nothing when the path matches no item', () => {
    const marked = markCurrent(buildNavTree([page('contact', 90)]), '/nowhere/');
    expect(marked.every((n) => !n.current)).toBe(true);
  });
});
