"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import {
  Star,
  MessageSquare,
  MoreHorizontal,
  ChevronsRight,
  Smile,
  ImageIcon,
  MessageCircle,
  Plus,
} from "lucide-react"
import { BLOCK_TYPE_OPTIONS } from "@/lib/notion/block-catalog"
import type { Block, BlockType, NotionPage } from "@/lib/notion/types"
import { BlockRow } from "./block-row"
import type { BlockEditorHandlers } from "./blocks"

interface EditorProps {
  page: NotionPage
  collapsed: boolean
  onExpand: () => void
  breadcrumb: string[]
  focusBlockId?: string | null
  onTitleChange: (title: string) => void
  onToggleFavorite: () => void
  onIconChange: (icon: string) => void
  onCoverChange: (coverUrl: string | null) => void
  onDeletePage: () => void
  onAddBlockAtEnd: (type: BlockType) => void
  blockHandlers: BlockEditorHandlers
}

function EditableTitle({
  pageId,
  title,
  onTitleChange,
}: {
  pageId: string
  title: string
  onTitleChange: (title: string) => void
}) {
  const ref = useRef<HTMLHeadingElement>(null)
  const isFocusedRef = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.textContent = title
    }
  }, [pageId])

  useEffect(() => {
    const el = ref.current
    if (!el || isFocusedRef.current) return
    if ((el.textContent ?? "") !== title) {
      el.textContent = title
    }
  }, [title, pageId])

  const scheduleSave = useCallback(
    (next: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => onTitleChange(next), 400)
    },
    [onTitleChange],
  )

  return (
    <h1
      ref={ref}
      role="textbox"
      contentEditable
      suppressContentEditableWarning
      className="text-[40px] font-bold leading-[1.2] outline-none empty:before:text-[var(--notion-text-faint)] empty:before:content-['제목_없음']"
      onFocus={() => {
        isFocusedRef.current = true
      }}
      onInput={(e) => scheduleSave(e.currentTarget.textContent ?? "")}
      onBlur={(e) => {
        isFocusedRef.current = false
        onTitleChange(e.currentTarget.textContent ?? "")
      }}
    />
  )
}

export function Editor({
  page,
  collapsed,
  onExpand,
  breadcrumb,
  focusBlockId,
  onTitleChange,
  onToggleFavorite,
  onIconChange,
  onCoverChange,
  onDeletePage,
  onAddBlockAtEnd,
  blockHandlers,
}: EditorProps) {
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false)
  const [newBlockType, setNewBlockType] = useState<BlockType>("text")

  const numberedIndices = useMemo(() => {
    const map = new Map<string, number>()
    let n = 0
    for (const b of page.blocks) {
      if (b.type === "numbered") {
        map.set(b.id, n)
        n++
      } else {
        n = 0
      }
    }
    return map
  }, [page.blocks])

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-white">
      <header className="flex h-[45px] shrink-0 items-center px-3">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {collapsed && (
            <button
              type="button"
              aria-label="사이드바 열기"
              onClick={onExpand}
              className="flex h-[26px] w-[26px] items-center justify-center rounded-[5px] transition-colors hover:bg-[var(--notion-sidebar-hover)]"
              style={{ color: "var(--notion-text-muted)" }}
            >
              <ChevronsRight className="h-[18px] w-[18px]" />
            </button>
          )}
          <nav className="flex min-w-0 items-center gap-1 text-[14px]">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <span style={{ color: "var(--notion-text-faint)" }}>/</span>
                )}
                <span
                  className="truncate rounded-[4px] px-1.5 py-0.5 transition-colors hover:bg-[var(--notion-sidebar-hover)]"
                  style={{ color: "var(--notion-text)" }}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        </div>

        <div className="relative flex items-center gap-1 text-[14px]" style={{ color: "var(--notion-text-muted)" }}>
          <button type="button" className="hidden rounded-[5px] px-2 py-1 transition-colors hover:bg-[var(--notion-sidebar-hover)] sm:block">
            공유
          </button>
          <button type="button" aria-label="댓글" className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] transition-colors hover:bg-[var(--notion-sidebar-hover)]">
            <MessageSquare className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label="즐겨찾기"
            aria-pressed={!!page.isFavorite}
            onClick={onToggleFavorite}
            className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] transition-colors hover:bg-[var(--notion-sidebar-hover)]"
          >
            <Star
              className="h-[18px] w-[18px]"
              fill={page.isFavorite ? "currentColor" : "none"}
              style={{ color: page.isFavorite ? "#f59e0b" : undefined }}
            />
          </button>
          <button
            type="button"
            aria-label="더보기"
            onClick={() => setHeaderMenuOpen((o) => !o)}
            className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] transition-colors hover:bg-[var(--notion-sidebar-hover)]"
          >
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </button>
          {headerMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setHeaderMenuOpen(false)} />
              <div
                className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-md border bg-white py-1 shadow-md"
                style={{ borderColor: "var(--notion-border)" }}
              >
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[13px] text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setHeaderMenuOpen(false)
                    onDeletePage()
                  }}
                >
                  페이지 삭제
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="notion-scroll flex-1 overflow-y-auto">
        {page.cover && (
          <div className="group/cover relative h-[180px] w-full sm:h-[220px]">
            <Image
              src={page.cover || "/placeholder.svg"}
              alt=""
              fill
              priority
              className="object-cover"
            />
            <button
              type="button"
              className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/cover:opacity-100"
              onClick={() => onCoverChange(null)}
            >
              커버 제거
            </button>
          </div>
        )}

        <div className="mx-auto w-full max-w-[720px] px-[54px] max-[600px]:px-6">
          <div className={page.cover ? "relative -mt-[36px]" : "pt-[80px]"}>
            <button
              type="button"
              className="flex h-[72px] w-[72px] items-center justify-center text-[64px] leading-none"
              title="아이콘 변경"
              onClick={() => {
                const next = window.prompt("페이지 아이콘 (이모지)", page.icon)
                if (next?.trim()) onIconChange(next.trim())
              }}
            >
              {page.icon}
            </button>
          </div>

          <div className="group pb-2">
            <div className="mb-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-[4px] px-1.5 py-1 text-[14px] transition-colors hover:bg-[var(--notion-sidebar-hover)]"
                style={{ color: "var(--notion-text-muted)" }}
                onClick={() => {
                  const next = window.prompt("페이지 아이콘 (이모지)", page.icon)
                  if (next?.trim()) onIconChange(next.trim())
                }}
              >
                <Smile className="h-4 w-4" /> 아이콘 변경
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-[4px] px-1.5 py-1 text-[14px] transition-colors hover:bg-[var(--notion-sidebar-hover)]"
                style={{ color: "var(--notion-text-muted)" }}
                onClick={() => {
                  if (page.cover) {
                    onCoverChange(null)
                    return
                  }
                  const url = window.prompt("커버 이미지 URL", page.cover ?? "")
                  if (url?.trim()) onCoverChange(url.trim())
                }}
              >
                <ImageIcon className="h-4 w-4" /> {page.cover ? "커버 제거" : "커버 추가"}
              </button>
              <button type="button" className="flex items-center gap-1.5 rounded-[4px] px-1.5 py-1 text-[14px] transition-colors hover:bg-[var(--notion-sidebar-hover)]" style={{ color: "var(--notion-text-muted)" }}>
                <MessageCircle className="h-4 w-4" /> 댓글 추가
              </button>
            </div>
            <EditableTitle
              pageId={page.id}
              title={page.title}
              onTitleChange={onTitleChange}
            />
          </div>

          <div className="pb-4 pl-7">
            {page.blocks.map((block: Block, i: number) => (
              <BlockRow
                key={block.id}
                block={block}
                index={numberedIndices.get(block.id) ?? 0}
                isFirst={i === 0}
                isLast={i === page.blocks.length - 1}
                autoFocus={focusBlockId === block.id}
                handlers={blockHandlers}
              />
            ))}
          </div>

          <div
            className="mb-40 flex flex-wrap items-center gap-2 border-t pt-4 pl-7"
            style={{ borderColor: "var(--notion-border)" }}
          >
            <select
              value={newBlockType}
              onChange={(e) => setNewBlockType(e.target.value as BlockType)}
              className="rounded border px-2 py-1 text-[13px]"
              style={{ borderColor: "var(--notion-border)" }}
            >
              {BLOCK_TYPE_OPTIONS.map((opt) => (
                <option key={opt.type} value={opt.type}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onAddBlockAtEnd(newBlockType)}
              className="flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-[13px] transition-colors hover:bg-[var(--notion-sidebar-hover)]"
              style={{ color: "var(--notion-text-muted)" }}
            >
              <Plus className="h-4 w-4" /> 블록 추가
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
