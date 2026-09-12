/** Toggle only visible IDs, preserving any selection outside the search results. */
export function allVisibleSelected(selected: string[], visible: string[]) {
  const ids = new Set(selected);
  return visible.length > 0 && visible.every(id => ids.has(id));
}
export function toggleVisibleSelection(selected: string[], visible: string[], checked: boolean) {
  const ids = new Set(selected);
  for (const id of visible) { if (checked) ids.add(id); else ids.delete(id); }
  return [...ids];
}
