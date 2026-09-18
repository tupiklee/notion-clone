import type { PageListItem } from "./types"

export function buildBreadcrumb(
  pages: PageListItem[],
  pageId: string,
): string[] {
  const byId = new Map(pages.map((p) => [p.id, p]))
  const trail: string[] = []
  let current = byId.get(pageId)
  while (current) {
    trail.unshift(current.title)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return trail
}
