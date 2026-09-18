"use client"

import { useCallback, useEffect, useLayoutEffect, useRef } from "react"
import type { Block } from "@/lib/notion/types"

export type BlockEditorHandlers = {
  onContentChange: (blockId: string, content: string) => void
  onCheckedChange: (blockId: string, checked: boolean) => void
  onEnterAfter: (blockId: string) => void
  onBackspaceEmpty: (blockId: string) => void
  onTypeChange: (blockId: string, type: Block["type"]) => void
  onDeleteBlock: (blockId: string) => void
  onMoveBlock: (blockId: string, direction: "up" | "down") => void
  onCalloutIconChange: (blockId: string, icon: string) => void
}

function EditableText({
  blockId,
  value,
  className,
  placeholder,
  autoFocus,
  multiline,
  onContentChange,
  onEnterAfter,
  onBackspaceEmpty,
}: {
  blockId: string
  value: string
  className: string
  placeholder?: string
  autoFocus?: boolean
  multiline?: boolean
  onContentChange: (blockId: string, content: string) => void
  onEnterAfter: (blockId: string) => void
  onBackspaceEmpty: (blockId: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFocusedRef = useRef(false)

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.textContent = value
    }
  }, [blockId])

  useEffect(() => {
    const el = ref.current
    if (!el || isFocusedRef.current) return
    const domText = el.textContent ?? ""
    if (domText !== value) {
      el.textContent = value
    }
  }, [value, blockId])

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus()
      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(ref.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [autoFocus, blockId])

  const scheduleSave = useCallback(
    (text: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => onContentChange(blockId, text), 300)
    },
    [blockId, onContentChange],
  )

  return (
    <div
      ref={ref}
      role="textbox"
      contentEditable
      suppressContentEditableWarning
      data-block-id={blockId}
      data-placeholder={placeholder}
      className={`outline-none empty:before:text-[var(--notion-text-faint)] empty:before:content-[attr(data-placeholder)] ${className}`}
      onFocus={() => {
        isFocusedRef.current = true
      }}
      onInput={(e) => scheduleSave(e.currentTarget.textContent ?? "")}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !multiline) {
          e.preventDefault()
          onContentChange(blockId, e.currentTarget.textContent ?? "")
          onEnterAfter(blockId)
        }
        if (e.key === "Backspace" && (e.currentTarget.textContent ?? "") === "") {
          e.preventDefault()
          onBackspaceEmpty(blockId)
        }
      }}
      onBlur={(e) => {
        isFocusedRef.current = false
        onContentChange(blockId, e.currentTarget.textContent ?? "")
      }}
    />
  )
}

function TodoBlock({
  block,
  autoFocus,
  handlers,
}: {
  block: Block
  autoFocus?: boolean
  handlers: BlockEditorHandlers
}) {
  return (
    <div className="flex items-start gap-2 py-[3px]">
      <button
        type="button"
        role="checkbox"
        aria-checked={!!block.checked}
        aria-label={block.content ?? "할 일"}
        onClick={() => handlers.onCheckedChange(block.id, !block.checked)}
        className="mt-[3px] flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[3px] border transition-colors"
        style={{
          backgroundColor: block.checked ? "var(--notion-blue)" : "transparent",
          borderColor: block.checked ? "var(--notion-blue)" : "rgba(55,53,47,0.35)",
        }}
      >
        {block.checked && (
          <svg viewBox="0 0 14 14" className="h-[11px] w-[11px]" fill="none" stroke="white" strokeWidth="2">
            <path d="M2 7l3.5 3.5L12 3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <EditableText
        blockId={block.id}
        value={block.content ?? ""}
        placeholder="할 일"
        autoFocus={autoFocus}
        className={`min-w-0 flex-1 text-[16px] leading-[1.5] ${
          block.checked ? "text-[var(--notion-text-muted)] line-through" : ""
        }`}
        onContentChange={handlers.onContentChange}
        onEnterAfter={handlers.onEnterAfter}
        onBackspaceEmpty={handlers.onBackspaceEmpty}
      />
    </div>
  )
}

export function BlockView({
  block,
  index,
  autoFocus,
  handlers,
}: {
  block: Block
  index: number
  autoFocus?: boolean
  handlers: BlockEditorHandlers
}) {
  const h = handlers

  switch (block.type) {
    case "heading1":
      return (
        <EditableText
          blockId={block.id}
          value={block.content ?? ""}
          placeholder="제목 1"
          autoFocus={autoFocus}
          className="mb-[1px] mt-[26px] text-[30px] font-bold leading-[1.3]"
          onContentChange={h.onContentChange}
          onEnterAfter={h.onEnterAfter}
          onBackspaceEmpty={h.onBackspaceEmpty}
        />
      )
    case "heading2":
      return (
        <EditableText
          blockId={block.id}
          value={block.content ?? ""}
          placeholder="제목 2"
          autoFocus={autoFocus}
          className="mb-[1px] mt-[20px] text-[24px] font-semibold leading-[1.3]"
          onContentChange={h.onContentChange}
          onEnterAfter={h.onEnterAfter}
          onBackspaceEmpty={h.onBackspaceEmpty}
        />
      )
    case "heading3":
      return (
        <EditableText
          blockId={block.id}
          value={block.content ?? ""}
          placeholder="제목 3"
          autoFocus={autoFocus}
          className="mb-[1px] mt-[16px] text-[20px] font-semibold leading-[1.3]"
          onContentChange={h.onContentChange}
          onEnterAfter={h.onEnterAfter}
          onBackspaceEmpty={h.onBackspaceEmpty}
        />
      )
    case "text":
      return (
        <EditableText
          blockId={block.id}
          value={block.content ?? ""}
          placeholder="글을 입력하세요"
          autoFocus={autoFocus}
          className="py-[3px] text-[16px] leading-[1.6]"
          onContentChange={h.onContentChange}
          onEnterAfter={h.onEnterAfter}
          onBackspaceEmpty={h.onBackspaceEmpty}
        />
      )
    case "bulleted":
      return (
        <div className="flex items-start gap-2 py-[3px]">
          <span className="mt-[9px] h-[6px] w-[6px] shrink-0 rounded-full bg-[var(--notion-text)]" />
          <EditableText
            blockId={block.id}
            value={block.content ?? ""}
            placeholder="목록"
            autoFocus={autoFocus}
            className="min-w-0 flex-1 text-[16px] leading-[1.5]"
            onContentChange={h.onContentChange}
            onEnterAfter={h.onEnterAfter}
            onBackspaceEmpty={h.onBackspaceEmpty}
          />
        </div>
      )
    case "numbered":
      return (
        <div className="flex items-start gap-2 py-[3px]">
          <span className="min-w-[18px] text-[16px] leading-[1.5]">{(index ?? 0) + 1}.</span>
          <EditableText
            blockId={block.id}
            value={block.content ?? ""}
            placeholder="목록"
            autoFocus={autoFocus}
            className="min-w-0 flex-1 text-[16px] leading-[1.5]"
            onContentChange={h.onContentChange}
            onEnterAfter={h.onEnterAfter}
            onBackspaceEmpty={h.onBackspaceEmpty}
          />
        </div>
      )
    case "todo":
      return <TodoBlock block={block} autoFocus={autoFocus} handlers={handlers} />
    case "quote":
      return (
        <blockquote className="my-[6px] border-l-[3px] border-[var(--notion-text)] py-[2px] pl-[14px]">
          <EditableText
            blockId={block.id}
            value={block.content ?? ""}
            placeholder="인용"
            autoFocus={autoFocus}
            className="text-[16px] leading-[1.5]"
            onContentChange={h.onContentChange}
            onEnterAfter={h.onEnterAfter}
            onBackspaceEmpty={h.onBackspaceEmpty}
          />
        </blockquote>
      )
    case "callout":
      return (
        <div
          className="my-[6px] flex items-start gap-3 rounded-[6px] px-4 py-3"
          style={{ backgroundColor: "rgba(55,53,47,0.045)" }}
        >
          <button
            type="button"
            className="text-[18px] leading-[1.5]"
            title="아이콘 변경"
            onClick={() => {
              const next = window.prompt("콜아웃 아이콘 (이모지)", block.icon ?? "💡")
              if (next?.trim()) h.onCalloutIconChange(block.id, next.trim())
            }}
          >
            {block.icon ?? "💡"}
          </button>
          <EditableText
            blockId={block.id}
            value={block.content ?? ""}
            placeholder="콜아웃"
            autoFocus={autoFocus}
            className="min-w-0 flex-1 text-[16px] leading-[1.5]"
            onContentChange={h.onContentChange}
            onEnterAfter={h.onEnterAfter}
            onBackspaceEmpty={h.onBackspaceEmpty}
          />
        </div>
      )
    case "divider":
      return <hr className="my-[10px] border-0 border-t" style={{ borderColor: "var(--notion-border)" }} />
    default:
      return null
  }
}
