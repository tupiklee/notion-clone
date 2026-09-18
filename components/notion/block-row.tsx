"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react"
import { BLOCK_TYPE_OPTIONS } from "@/lib/notion/block-catalog"
import type { Block, BlockType } from "@/lib/notion/types"
import { BlockView, type BlockEditorHandlers } from "./blocks"

export function BlockRow({
  block,
  index,
  isFirst,
  isLast,
  autoFocus,
  handlers,
}: {
  block: Block
  index: number
  isFirst: boolean
  isLast: boolean
  autoFocus?: boolean
  handlers: BlockEditorHandlers
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="group/block relative flex items-start gap-1">
      <div
        className="-ml-7 flex w-6 shrink-0 flex-col items-center gap-0.5 pt-1 opacity-0 transition-opacity group-hover/block:opacity-100 max-[720px]:hidden"
        style={{ color: "var(--notion-text-muted)" }}
      >
        <GripVertical className="h-4 w-4 opacity-40" aria-hidden />
        <button
          type="button"
          aria-label="위로"
          disabled={isFirst}
          onClick={() => handlers.onMoveBlock(block.id, "up")}
          className="rounded p-0.5 hover:bg-[var(--notion-sidebar-hover)] disabled:opacity-30"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="아래로"
          disabled={isLast}
          onClick={() => handlers.onMoveBlock(block.id, "down")}
          className="rounded p-0.5 hover:bg-[var(--notion-sidebar-hover)] disabled:opacity-30"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <BlockView
          block={block}
          index={index}
          autoFocus={autoFocus}
          handlers={handlers}
        />
      </div>

      <div className="relative shrink-0 pt-1 opacity-0 transition-opacity group-hover/block:opacity-100">
        <button
          type="button"
          aria-label="블록 메뉴"
          onClick={() => setMenuOpen((o) => !o)}
          className="rounded px-1.5 py-0.5 text-[12px] hover:bg-[var(--notion-sidebar-hover)]"
          style={{ color: "var(--notion-text-muted)" }}
        >
          ⋮
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="absolute right-0 z-20 mt-1 min-w-[160px] rounded-md border bg-white py-1 shadow-md"
              style={{ borderColor: "var(--notion-border)" }}
            >
              <p
                className="px-3 py-1 text-[11px] font-medium"
                style={{ color: "var(--notion-text-muted)" }}
              >
                블록 유형
              </p>
              {BLOCK_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-[13px] hover:bg-[var(--notion-sidebar-hover)]"
                  onClick={() => {
                    handlers.onTypeChange(block.id, opt.type)
                    setMenuOpen(false)
                  }}
                >
                  {opt.label}
                  {block.type === opt.type ? " ✓" : ""}
                </button>
              ))}
              <hr className="my-1" style={{ borderColor: "var(--notion-border)" }} />
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-red-600 hover:bg-red-50"
                onClick={() => {
                  handlers.onDeleteBlock(block.id)
                  setMenuOpen(false)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> 삭제
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
