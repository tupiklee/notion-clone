"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/notion/sidebar"
import { Editor } from "@/components/notion/editor"
import type { BlockEditorHandlers } from "@/components/notion/blocks"
import { blockTypeForNewAfter, BLOCK_TYPE_OPTIONS } from "@/lib/notion/block-catalog"
import { buildBreadcrumb } from "@/lib/notion/breadcrumb"
import {
  pageToNotionPage,
  type BlockType,
  type NotionPage,
  type PageListItem,
  type SidebarItem,
} from "@/lib/notion/types"

type SidebarData = {
  favorites: SidebarItem[]
  workspacePages: SidebarItem[]
  privatePages: SidebarItem[]
}

export function WorkspaceApp() {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [pages, setPages] = useState<PageListItem[]>([])
  const [sidebar, setSidebar] = useState<SidebarData>({
    favorites: [],
    workspacePages: [],
    privatePages: [],
  })
  const [activePageId, setActivePageId] = useState<string | null>(null)
  const [page, setPage] = useState<NotionPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null)

  const refreshPages = useCallback(async () => {
    const res = await fetch("/api/pages")
    if (!res.ok) throw new Error("Failed to load pages")
    const data = await res.json()
    setPages(data.pages)
    setSidebar(data.sidebar)
    return data.pages as PageListItem[]
  }, [])

  const loadPage = useCallback(async (pageId: string) => {
    const res = await fetch(`/api/pages/${pageId}`)
    if (!res.ok) throw new Error("Failed to load page")
    const data = await res.json()
    setPage(data.page)
    setActivePageId(pageId)
  }, [])

  useEffect(() => {
    if (!focusBlockId) return
    const timer = setTimeout(() => setFocusBlockId(null), 100)
    return () => clearTimeout(timer)
  }, [focusBlockId])

  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch("/api/auth/me")
        if (meRes.ok) {
          const me = await meRes.json()
          setUserEmail(me.user.email)
        }
        const list = await refreshPages()
        if (list.length > 0) {
          await loadPage(list[0].id)
        } else {
          setPage(null)
          setActivePageId(null)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [refreshPages, loadPage])

  const handleSelect = async (id: string) => {
    await loadPage(id)
  }

  const handleAddPage = async (opts?: {
    parentId?: string
    sidebarSection?: "WORKSPACE" | "PRIVATE"
  }) => {
    const title = window.prompt("새 페이지 제목", "새 페이지")
    if (!title?.trim()) return

    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        parentId: opts?.parentId ?? null,
        sidebarSection: opts?.sidebarSection ?? "PRIVATE",
      }),
    })
    if (!res.ok) return
    const data = await res.json()
    await refreshPages()
    const created = pageToNotionPage(data.page, data.page.blocks ?? [])
    setPage(created)
    setActivePageId(data.page.id)
    setFocusBlockId(created.blocks[0]?.id ?? null)
  }

  const handleRenamePage = async (id: string) => {
    const current = pages.find((p) => p.id === id)
    const title = window.prompt("페이지 제목", current?.title ?? "")
    if (!title?.trim()) return

    const res = await fetch(`/api/pages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    })
    if (!res.ok) return
    const data = await res.json()
    await refreshPages()
    if (activePageId === id) {
      setPage(data.page)
    }
  }

  const handleDeletePage = async (id: string) => {
    if (!window.confirm("이 페이지를 삭제할까요?")) return

    const res = await fetch(`/api/pages/${id}`, { method: "DELETE" })
    if (!res.ok) return

    const list = await refreshPages()
    if (activePageId === id) {
      if (list.length > 0) {
        await loadPage(list[0].id)
      } else {
        setActivePageId(null)
        setPage(null)
      }
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const patchPage = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!activePageId) return null
      const res = await fetch(`/api/pages/${activePageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) return null
      return res.json()
    },
    [activePageId],
  )

  const handleTitleChange = useCallback(
    async (title: string) => {
      if (!activePageId) return
      const trimmed = title.trim() || "제목 없음"
      setPage((prev) => (prev ? { ...prev, title: trimmed } : prev))
      const data = await patchPage({ title: trimmed })
      if (data?.page) setPage(data.page)
      await refreshPages()
    },
    [activePageId, patchPage, refreshPages],
  )

  const handleToggleFavorite = useCallback(async () => {
    if (!page) return
    const data = await patchPage({ isFavorite: !page.isFavorite })
    if (data?.page) {
      setPage(data.page)
      await refreshPages()
    }
  }, [page, patchPage, refreshPages])

  const handleIconChange = useCallback(
    async (icon: string) => {
      const data = await patchPage({ icon })
      if (data?.page) {
        setPage(data.page)
        await refreshPages()
      }
    },
    [patchPage, refreshPages],
  )

  const handleCoverChange = useCallback(
    async (coverUrl: string | null) => {
      const data = await patchPage({ coverUrl })
      if (data?.page) setPage(data.page)
    },
    [patchPage],
  )

  const createBlock = useCallback(
    async (
      payload: {
        type: BlockType
        content?: string | null
        checked?: boolean | null
        icon?: string | null
        sortOrder?: number
      },
    ) => {
      if (!activePageId) return null
      const res = await fetch(`/api/pages/${activePageId}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) return null
      return res.json()
    },
    [activePageId],
  )

  const handleBlockContentChange = useCallback(
    async (blockId: string, content: string) => {
      if (!activePageId) return
      await fetch(`/api/pages/${activePageId}/blocks/${blockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
    },
    [activePageId],
  )

  const handleBlockCheckedChange = useCallback(
    async (blockId: string, checked: boolean) => {
      if (!activePageId) return
      setPage((prev) =>
        prev
          ? {
              ...prev,
              blocks: prev.blocks.map((b) =>
                b.id === blockId ? { ...b, checked } : b,
              ),
            }
          : prev,
      )
      await fetch(`/api/pages/${activePageId}/blocks/${blockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked }),
      })
    },
    [activePageId],
  )

  const handleEnterAfter = useCallback(
    async (blockId: string) => {
      if (!activePageId || !page) return
      const index = page.blocks.findIndex((b) => b.id === blockId)
      if (index < 0) return

      const current = page.blocks[index]
      const newType = blockTypeForNewAfter(current.type)
      const opt = BLOCK_TYPE_OPTIONS.find((o) => o.type === newType)

      const data = await createBlock({
        type: newType,
        content: newType === "divider" ? null : "",
        sortOrder: index + 1,
        icon: newType === "callout" ? (opt?.defaultIcon ?? "💡") : null,
        checked: newType === "todo" ? false : null,
      })
      if (!data) return
      await loadPage(activePageId)
      setFocusBlockId(data.block.id)
    },
    [activePageId, page, createBlock, loadPage],
  )

  const handleBackspaceEmpty = useCallback(
    async (blockId: string) => {
      if (!activePageId || !page || page.blocks.length <= 1) return
      const index = page.blocks.findIndex((b) => b.id === blockId)
      const prevBlockId = page.blocks[index - 1]?.id

      const res = await fetch(
        `/api/pages/${activePageId}/blocks/${blockId}`,
        { method: "DELETE" },
      )
      if (!res.ok) return
      await loadPage(activePageId)
      if (prevBlockId) setFocusBlockId(prevBlockId)
    },
    [activePageId, page, loadPage],
  )

  const handleTypeChange = useCallback(
    async (blockId: string, type: BlockType) => {
      if (!activePageId) return
      const opt = BLOCK_TYPE_OPTIONS.find((o) => o.type === type)
      await fetch(`/api/pages/${activePageId}/blocks/${blockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          icon: type === "callout" ? (opt?.defaultIcon ?? "💡") : null,
          content: type === "divider" ? null : undefined,
        }),
      })
      await loadPage(activePageId)
      setFocusBlockId(blockId)
    },
    [activePageId, loadPage],
  )

  const handleDeleteBlock = useCallback(
    async (blockId: string) => {
      if (!activePageId || !page) return

      if (page.blocks.length <= 1) {
        await fetch(`/api/pages/${activePageId}/blocks/${blockId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "text", content: "", icon: null }),
        })
        await loadPage(activePageId)
        setFocusBlockId(blockId)
        return
      }

      const block = page.blocks.find((b) => b.id === blockId)
      if (block?.content?.trim() && !window.confirm("이 블록을 삭제할까요?")) {
        return
      }

      const index = page.blocks.findIndex((b) => b.id === blockId)
      const prevBlockId = page.blocks[index - 1]?.id

      const res = await fetch(
        `/api/pages/${activePageId}/blocks/${blockId}`,
        { method: "DELETE" },
      )
      if (!res.ok) return
      await loadPage(activePageId)
      if (prevBlockId) setFocusBlockId(prevBlockId)
    },
    [activePageId, page, loadPage],
  )

  const handleMoveBlock = useCallback(
    async (blockId: string, direction: "up" | "down") => {
      if (!activePageId) return
      const res = await fetch(
        `/api/pages/${activePageId}/blocks/${blockId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction }),
        },
      )
      if (!res.ok) return
      await loadPage(activePageId)
      setFocusBlockId(blockId)
    },
    [activePageId, loadPage],
  )

  const handleCalloutIconChange = useCallback(
    async (blockId: string, icon: string) => {
      if (!activePageId) return
      await fetch(`/api/pages/${activePageId}/blocks/${blockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icon }),
      })
      await loadPage(activePageId)
    },
    [activePageId, loadPage],
  )

  const handleAddBlockAtEnd = useCallback(
    async (type: BlockType) => {
      if (!activePageId) return
      const opt = BLOCK_TYPE_OPTIONS.find((o) => o.type === type)
      const data = await createBlock({
        type,
        content: type === "divider" ? null : "",
        icon: type === "callout" ? (opt?.defaultIcon ?? "💡") : null,
        checked: type === "todo" ? false : null,
      })
      if (!data) return
      await loadPage(activePageId)
      setFocusBlockId(data.block.id)
    },
    [activePageId, createBlock, loadPage],
  )

  const blockHandlers: BlockEditorHandlers = useMemo(
    () => ({
      onContentChange: handleBlockContentChange,
      onCheckedChange: handleBlockCheckedChange,
      onEnterAfter: handleEnterAfter,
      onBackspaceEmpty: handleBackspaceEmpty,
      onTypeChange: handleTypeChange,
      onDeleteBlock: handleDeleteBlock,
      onMoveBlock: handleMoveBlock,
      onCalloutIconChange: handleCalloutIconChange,
    }),
    [
      handleBlockContentChange,
      handleBlockCheckedChange,
      handleEnterAfter,
      handleBackspaceEmpty,
      handleTypeChange,
      handleDeleteBlock,
      handleMoveBlock,
      handleCalloutIconChange,
    ],
  )

  if (loading) {
    return (
      <main className="notion-app flex h-screen items-center justify-center bg-white">
        <p className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
          불러오는 중…
        </p>
      </main>
    )
  }

  return (
    <main className="notion-app flex h-screen w-full overflow-hidden bg-white">
      {!collapsed && (
        <Sidebar
          activePage={activePageId}
          favorites={sidebar.favorites}
          workspacePages={sidebar.workspacePages}
          privatePages={sidebar.privatePages}
          userEmail={userEmail}
          onSelect={handleSelect}
          onCollapse={() => setCollapsed(true)}
          onAddPage={() => handleAddPage({ sidebarSection: "PRIVATE" })}
          onAddChildPage={(parentId) =>
            handleAddPage({ parentId, sidebarSection: "WORKSPACE" })
          }
          onRenamePage={handleRenamePage}
          onDeletePage={handleDeletePage}
          onLogout={handleLogout}
        />
      )}
      {page && activePageId ? (
        <Editor
          page={page}
          collapsed={collapsed}
          onExpand={() => setCollapsed(false)}
          breadcrumb={buildBreadcrumb(pages, activePageId)}
          focusBlockId={focusBlockId}
          onTitleChange={handleTitleChange}
          onToggleFavorite={handleToggleFavorite}
          onIconChange={handleIconChange}
          onCoverChange={handleCoverChange}
          onDeletePage={() => handleDeletePage(activePageId)}
          onAddBlockAtEnd={handleAddBlockAtEnd}
          blockHandlers={blockHandlers}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p style={{ color: "var(--notion-text-muted)" }}>
            페이지가 없습니다. 사이드바에서 페이지를 추가하세요.
          </p>
        </div>
      )}
    </main>
  )
}
