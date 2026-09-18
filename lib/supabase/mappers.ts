import type { Tables } from "@/lib/database.types"
import { pageToNotionPage } from "@/lib/notion/types"

export type PageListRow = {
  id: string
  parentId: string | null
  title: string
  icon: string
  sortOrder: number
  isFavorite: boolean
  sidebarSection: "FAVORITE" | "WORKSPACE" | "PRIVATE"
}

export function mapPageListRow(row: Tables<"pages">): PageListRow {
  return {
    id: row.id,
    parentId: row.parent_id,
    title: row.title,
    icon: row.icon,
    sortOrder: row.sort_order,
    isFavorite: row.is_favorite,
    sidebarSection: row.sidebar_section as PageListRow["sidebarSection"],
  }
}

export function mapPageWithBlocks(
  page: Tables<"pages">,
  blocks: Tables<"blocks">[],
) {
  const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order)
  return pageToNotionPage(
    {
      id: page.id,
      icon: page.icon,
      title: page.title,
      coverUrl: page.cover_url,
      isFavorite: page.is_favorite,
    },
    sorted.map((b) => ({
      id: b.id,
      type: b.type,
      content: b.content,
      checked: b.checked,
      icon: b.icon,
      sortOrder: b.sort_order,
    })),
  )
}

export function mapBlockToApi(row: Tables<"blocks">) {
  return {
    id: row.id,
    pageId: row.page_id,
    type: row.type,
    content: row.content,
    checked: row.checked,
    icon: row.icon,
    sortOrder: row.sort_order,
  }
}

export function mapPageRecordForApi(
  page: Tables<"pages">,
  blocks: Tables<"blocks">[],
) {
  const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order)
  return {
    id: page.id,
    icon: page.icon,
    title: page.title,
    coverUrl: page.cover_url,
    isFavorite: page.is_favorite,
    blocks: sorted.map(mapBlockToApi),
  }
}
