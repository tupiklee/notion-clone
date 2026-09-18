import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { mapPageListRow, mapPageRecordForApi } from "@/lib/supabase/mappers"

export class ServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
  }
}

export type SidebarSection = "FAVORITE" | "WORKSPACE" | "PRIVATE"

export async function listPagesForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("user_id", userId)
    .order("sidebar_section")
    .order("sort_order")
    .order("title")

  if (error) throw new ServiceError(error.message, 500)
  return (data ?? []).map(mapPageListRow)
}

export async function getPageForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  pageId: string,
) {
  const { data: page, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw new ServiceError(error.message, 500)
  if (!page) throw new ServiceError("Page not found", 404, "NOT_FOUND")

  const { data: blocks, error: blocksError } = await supabase
    .from("blocks")
    .select("*")
    .eq("page_id", pageId)
    .order("sort_order")

  if (blocksError) throw new ServiceError(blocksError.message, 500)

  return mapPageRecordForApi(page, blocks ?? [])
}

export async function createPageForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: {
    title: string
    icon?: string
    parentId?: string | null
    sidebarSection?: SidebarSection
    coverUrl?: string | null
  },
) {
  if (data.parentId) {
    const { data: parent } = await supabase
      .from("pages")
      .select("id")
      .eq("id", data.parentId)
      .eq("user_id", userId)
      .maybeSingle()
    if (!parent) throw new ServiceError("Parent page not found", 404, "NOT_FOUND")
  }

  const section = data.sidebarSection ?? "PRIVATE"

  let query = supabase
    .from("pages")
    .select("sort_order")
    .eq("user_id", userId)
    .eq("sidebar_section", section)

  if (data.parentId) {
    query = query.eq("parent_id", data.parentId)
  } else {
    query = query.is("parent_id", null)
  }

  const { data: siblings } = await query.order("sort_order", { ascending: false }).limit(1)
  const nextOrder = (siblings?.[0]?.sort_order ?? -1) + 1

  const { data: page, error } = await supabase
    .from("pages")
    .insert({
      user_id: userId,
      title: data.title,
      icon: data.icon ?? "📄",
      parent_id: data.parentId ?? null,
      sidebar_section: section,
      cover_url: data.coverUrl ?? null,
      sort_order: nextOrder,
    })
    .select("*")
    .single()

  if (error) throw new ServiceError(error.message, 500)

  const { data: block, error: blockError } = await supabase
    .from("blocks")
    .insert({
      page_id: page.id,
      type: "text",
      content: "",
      sort_order: 0,
    })
    .select("*")
    .single()

  if (blockError) throw new ServiceError(blockError.message, 500)

  return mapPageRecordForApi(page, [block])
}

export async function updatePageForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  pageId: string,
  data: {
    title?: string
    icon?: string
    coverUrl?: string | null
    parentId?: string | null
    isFavorite?: boolean
    sortOrder?: number
    sidebarSection?: SidebarSection
  },
) {
  const { data: existing } = await supabase
    .from("pages")
    .select("id")
    .eq("id", pageId)
    .eq("user_id", userId)
    .maybeSingle()

  if (!existing) throw new ServiceError("Page not found", 404, "NOT_FOUND")

  if (data.parentId) {
    if (data.parentId === pageId) {
      throw new ServiceError("Page cannot be its own parent", 400, "INVALID_PARENT")
    }
    const { data: parent } = await supabase
      .from("pages")
      .select("id")
      .eq("id", data.parentId)
      .eq("user_id", userId)
      .maybeSingle()
    if (!parent) throw new ServiceError("Parent page not found", 404, "NOT_FOUND")
  }

  const patch: Database["public"]["Tables"]["pages"]["Update"] = {}
  if (data.title !== undefined) patch.title = data.title
  if (data.icon !== undefined) patch.icon = data.icon
  if (data.coverUrl !== undefined) patch.cover_url = data.coverUrl
  if (data.parentId !== undefined) patch.parent_id = data.parentId
  if (data.isFavorite !== undefined) patch.is_favorite = data.isFavorite
  if (data.sortOrder !== undefined) patch.sort_order = data.sortOrder
  if (data.sidebarSection !== undefined) patch.sidebar_section = data.sidebarSection

  const { error } = await supabase.from("pages").update(patch).eq("id", pageId)

  if (error) throw new ServiceError(error.message, 500)

  return getPageForUser(supabase, userId, pageId)
}

export async function deletePageForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  pageId: string,
) {
  const { data: existing } = await supabase
    .from("pages")
    .select("id")
    .eq("id", pageId)
    .eq("user_id", userId)
    .maybeSingle()

  if (!existing) throw new ServiceError("Page not found", 404, "NOT_FOUND")

  const { error } = await supabase.from("pages").delete().eq("id", pageId)
  if (error) throw new ServiceError(error.message, 500)
}
