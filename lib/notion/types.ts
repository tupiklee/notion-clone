export type BlockType =
  | "heading1"
  | "heading2"
  | "heading3"
  | "text"
  | "bulleted"
  | "numbered"
  | "todo"
  | "quote"
  | "callout"
  | "divider"

export interface Block {
  id: string
  type: BlockType
  content?: string
  checked?: boolean
  icon?: string
}

export interface NotionPage {
  id: string
  icon: string
  title: string
  cover?: string
  isFavorite?: boolean
  blocks: Block[]
}

export interface PageListItem {
  id: string
  parentId: string | null
  title: string
  icon: string
  sortOrder: number
  isFavorite: boolean
  sidebarSection: "FAVORITE" | "WORKSPACE" | "PRIVATE"
}

export interface SidebarItem {
  id: string
  icon: string
  label: string
  children?: SidebarItem[]
}

function pagesToTree(items: PageListItem[]): SidebarItem[] {
  const ids = new Set(items.map((p) => p.id))
  const roots = items.filter((p) => !p.parentId || !ids.has(p.parentId))

  const build = (page: PageListItem): SidebarItem => ({
    id: page.id,
    icon: page.icon,
    label: page.title,
    children: items
      .filter((c) => c.parentId === page.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(build),
  })

  return roots.sort((a, b) => a.sortOrder - b.sortOrder).map(build)
}

export function buildSidebarTree(pages: PageListItem[]): {
  favorites: SidebarItem[]
  workspacePages: SidebarItem[]
  privatePages: SidebarItem[]
} {
  const workspace = pages.filter((p) => p.sidebarSection === "WORKSPACE")
  const priv = pages.filter((p) => p.sidebarSection === "PRIVATE")

  return {
    favorites: pages
      .filter((p) => p.isFavorite)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({ id: p.id, icon: p.icon, label: p.title })),
    workspacePages: pagesToTree(workspace),
    privatePages: pagesToTree(priv),
  }
}

export function pageToNotionPage(
  page: {
    id: string
    icon: string
    title: string
    coverUrl: string | null
    isFavorite?: boolean
  },
  blocks: Array<{
    id: string
    type: string
    content: string | null
    checked: boolean | null
    icon: string | null
    sortOrder: number
  }>,
): NotionPage {
  return {
    id: page.id,
    icon: page.icon,
    title: page.title,
    cover: page.coverUrl ?? undefined,
    isFavorite: page.isFavorite,
    blocks: blocks
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((b) => ({
        id: b.id,
        type: b.type as BlockType,
        content: b.content ?? undefined,
        checked: b.checked ?? undefined,
        icon: b.icon ?? undefined,
      })),
  }
}
