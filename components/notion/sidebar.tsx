"use client"

import { useState } from "react"
import {
  Search,
  Home,
  Inbox,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Trash2,
  Sparkles,
  FileText,
  ChevronsLeft,
  LogOut,
  Pencil,
} from "lucide-react"
import type { SidebarItem } from "@/lib/notion/types"

interface SidebarProps {
  activePage: string | null
  favorites: SidebarItem[]
  workspacePages: SidebarItem[]
  privatePages: SidebarItem[]
  userEmail?: string | null
  onSelect: (id: string) => void
  onCollapse: () => void
  onAddPage: () => void
  onAddChildPage: (parentId: string) => void
  onRenamePage: (id: string) => void
  onDeletePage: (id: string) => void
  onLogout: () => void
}

function PageRow({
  item,
  depth,
  activePage,
  onSelect,
  onAddChildPage,
  onRenamePage,
  onDeletePage,
}: {
  item: SidebarItem
  depth: number
  activePage: string | null
  onSelect: (id: string) => void
  onAddChildPage: (parentId: string) => void
  onRenamePage: (id: string) => void
  onDeletePage: (id: string) => void
}) {
  const [open, setOpen] = useState(depth === 0)
  const hasChildren = !!item.children?.length
  const isActive = activePage === item.id

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(item.id)}
        onKeyDown={(e) => e.key === "Enter" && onSelect(item.id)}
        className="group flex h-[27px] cursor-pointer items-center rounded-[5px] pr-1 text-[14px] transition-colors"
        style={{
          paddingLeft: 8 + depth * 16,
          backgroundColor: isActive ? "var(--notion-sidebar-active)" : "transparent",
          color: "var(--notion-text)",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = "var(--notion-sidebar-hover)"
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = "transparent"
        }}
      >
        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) setOpen((o) => !o)
          }}
          className="mr-1 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[4px]"
          style={{ color: "var(--notion-text-muted)" }}
        >
          <span className="relative h-full w-full">
            <span className="absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0">
              {item.icon}
            </span>
            {hasChildren ? (
              <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--notion-sidebar-active)] rounded-[4px]">
                {open ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                {item.icon}
              </span>
            )}
          </span>
        </span>
        <span className="truncate">{item.label}</span>
        <span className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            aria-label="제목 변경"
            onClick={(e) => {
              e.stopPropagation()
              onRenamePage(item.id)
            }}
            className="flex h-[20px] w-[20px] items-center justify-center rounded-[4px] hover:bg-[var(--notion-sidebar-active)]"
            style={{ color: "var(--notion-text-muted)" }}
          >
            <Pencil className="h-[13px] w-[13px]" />
          </button>
          <button
            aria-label="삭제"
            onClick={(e) => {
              e.stopPropagation()
              onDeletePage(item.id)
            }}
            className="flex h-[20px] w-[20px] items-center justify-center rounded-[4px] hover:bg-[var(--notion-sidebar-active)]"
            style={{ color: "var(--notion-text-muted)" }}
          >
            <Trash2 className="h-[13px] w-[13px]" />
          </button>
          <button
            aria-label="하위 페이지 추가"
            onClick={(e) => {
              e.stopPropagation()
              onAddChildPage(item.id)
            }}
            className="flex h-[20px] w-[20px] items-center justify-center rounded-[4px] hover:bg-[var(--notion-sidebar-active)]"
            style={{ color: "var(--notion-text-muted)" }}
          >
            <Plus className="h-[14px] w-[14px]" />
          </button>
        </span>
      </div>
      {hasChildren && open && (
        <div>
          {item.children!.map((child) => (
            <PageRow
              key={child.id}
              item={child}
              depth={depth + 1}
              activePage={activePage}
              onSelect={onSelect}
              onAddChildPage={onAddChildPage}
              onRenamePage={onRenamePage}
              onDeletePage={onDeletePage}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NavItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className="flex h-[28px] cursor-pointer items-center gap-2 rounded-[5px] px-2 text-[14px] transition-colors"
      style={{ color: "var(--notion-text)" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--notion-sidebar-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <span className="flex h-5 w-5 items-center justify-center" style={{ color: "var(--notion-text-muted)" }}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-[26px] items-center px-2 text-[12px] font-medium"
      style={{ color: "var(--notion-text-muted)" }}
    >
      {children}
    </div>
  )
}

export function Sidebar({
  activePage,
  favorites,
  workspacePages,
  privatePages,
  userEmail,
  onSelect,
  onCollapse,
  onAddPage,
  onAddChildPage,
  onRenamePage,
  onDeletePage,
  onLogout,
}: SidebarProps) {
  const initial = userEmail?.[0]?.toUpperCase() ?? "U"

  return (
    <aside
      className="notion-scroll flex h-full w-[240px] shrink-0 flex-col overflow-y-auto"
      style={{ backgroundColor: "var(--notion-sidebar-bg)" }}
    >
      <div className="group flex h-[45px] shrink-0 items-center px-3">
        <div
          className="flex flex-1 cursor-pointer items-center gap-2 rounded-[5px] py-1 pl-1 pr-2 transition-colors"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--notion-sidebar-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-[#37352f] text-[13px] font-semibold text-white">
            {initial}
          </div>
          <span className="truncate text-[14px] font-medium">
            {userEmail ?? "워크스페이스"}
          </span>
          <ChevronDown className="h-[14px] w-[14px]" style={{ color: "var(--notion-text-muted)" }} />
        </div>
        <button
          aria-label="사이드바 접기"
          onClick={onCollapse}
          className="flex h-[26px] w-[26px] items-center justify-center rounded-[5px] opacity-0 transition-opacity hover:bg-[var(--notion-sidebar-active)] group-hover:opacity-100"
          style={{ color: "var(--notion-text-muted)" }}
        >
          <ChevronsLeft className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="px-2">
        <NavItem icon={<Search className="h-[18px] w-[18px]" />} label="검색" />
        <NavItem icon={<Sparkles className="h-[18px] w-[18px]" />} label="Notion AI" />
        <NavItem icon={<Home className="h-[18px] w-[18px]" />} label="홈" />
        <NavItem icon={<Inbox className="h-[18px] w-[18px]" />} label="수신함" />
      </div>

      {favorites.length > 0 && (
        <div className="mt-4 px-2">
          <SectionLabel>즐겨찾기</SectionLabel>
          {favorites.map((item) => (
            <PageRow
              key={`fav-${item.id}`}
              item={item}
              depth={0}
              activePage={activePage}
              onSelect={onSelect}
              onAddChildPage={onAddChildPage}
              onRenamePage={onRenamePage}
              onDeletePage={onDeletePage}
            />
          ))}
        </div>
      )}

      <div className="mt-4 px-2">
        <SectionLabel>워크스페이스</SectionLabel>
        {workspacePages.map((item) => (
          <PageRow
            key={item.id}
            item={item}
            depth={0}
            activePage={activePage}
            onSelect={onSelect}
            onAddChildPage={onAddChildPage}
            onRenamePage={onRenamePage}
            onDeletePage={onDeletePage}
          />
        ))}
      </div>

      <div className="mt-4 px-2">
        <SectionLabel>개인 페이지</SectionLabel>
        {privatePages.map((item) => (
          <PageRow
            key={item.id}
            item={item}
            depth={0}
            activePage={activePage}
            onSelect={onSelect}
            onAddChildPage={onAddChildPage}
            onRenamePage={onRenamePage}
            onDeletePage={onDeletePage}
          />
        ))}
        <div
          role="button"
          tabIndex={0}
          onClick={onAddPage}
          onKeyDown={(e) => e.key === "Enter" && onAddPage()}
          className="mt-0.5 flex h-[28px] cursor-pointer items-center gap-2 rounded-[5px] px-2 text-[14px] transition-colors"
          style={{ color: "var(--notion-text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--notion-sidebar-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Plus className="h-[18px] w-[18px]" />
          <span>페이지 추가</span>
        </div>
      </div>

      <div className="mt-auto px-2 pb-3 pt-4">
        <NavItem icon={<Settings className="h-[18px] w-[18px]" />} label="설정" />
        <NavItem icon={<FileText className="h-[18px] w-[18px]" />} label="템플릿" />
        <NavItem icon={<Trash2 className="h-[18px] w-[18px]" />} label="휴지통" />
        <NavItem
          icon={<LogOut className="h-[18px] w-[18px]" />}
          label="로그아웃"
          onClick={onLogout}
        />
      </div>
    </aside>
  )
}
