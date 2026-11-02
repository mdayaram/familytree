/** Node ids the map should bring into view: the whole path when there is one, else just the person. */
export function focusTargets(path: string[] | null, selectedId: string): string[] {
  return path && path.length > 1 ? path : [selectedId];
}
