import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { ServiceError } from "@/lib/services/pages"

async function assertPageOwned(
  supabase: SupabaseClient<Database>,
  userId: string,
  pageId: string,
) {
  const { data: page } = await supabase
    .from("pages")
    .select("id")
    .eq("id", pageId)
    .eq("user_id", userId)
    .maybeSingle()
  if (!page) throw new ServiceError("Page not found", 404, "NOT_FOUND")
}

async function shiftBlockOrdersFrom(
  supabase: SupabaseClient<Database>,
  pageId: string,
  fromOrder: number,
  delta: number,
) {
  const { data: blocks } = await supabase
    .from("blocks")
    .select("id, sort_order")
    .eq("page_id", pageId)
    .gte("sort_order", fromOrder)
    .order("sort_order", { ascending: delta > 0 })

  for (const block of blocks ?? []) {
    await supabase
      .from("blocks")
      .update({ sort_order: block.sort_order + delta })
      .eq("id", block.id)
  }
}

export async function listBlocksForPage(
  supabase: SupabaseClient<Database>,
  userId: string,
  pageId: string,
) {
  await assertPageOwned(supabase, userId, pageId)
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("page_id", pageId)
    .order("sort_order")

  if (error) throw new ServiceError(error.message, 500)
  return data ?? []
}

export async function createBlockForPage(
  supabase: SupabaseClient<Database>,
  userId: string,
  pageId: string,
  data: {
    type: string
    content?: string | null
    checked?: boolean | null
    icon?: string | null
    sortOrder?: number
  },
) {
  await assertPageOwned(supabase, userId, pageId)

  let sortOrder = data.sortOrder
  if (sortOrder === undefined) {
    const { data: maxRow } = await supabase
      .from("blocks")
      .select("sort_order")
      .eq("page_id", pageId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()
    sortOrder = (maxRow?.sort_order ?? -1) + 1
  } else {
    await shiftBlockOrdersFrom(supabase, pageId, sortOrder, 1)
  }

  const { data: block, error } = await supabase
    .from("blocks")
    .insert({
      page_id: pageId,
      type: data.type,
      content: data.content ?? null,
      checked: data.checked ?? null,
      icon: data.icon ?? null,
      sort_order: sortOrder,
    })
    .select("*")
    .single()

  if (error) throw new ServiceError(error.message, 500)
  return block
}

export async function updateBlockForPage(
  supabase: SupabaseClient<Database>,
  userId: string,
  pageId: string,
  blockId: string,
  data: {
    type?: string
    content?: string | null
    checked?: boolean | null
    icon?: string | null
    sortOrder?: number
  },
) {
  await assertPageOwned(supabase, userId, pageId)

  const { data: block } = await supabase
    .from("blocks")
    .select("id")
    .eq("id", blockId)
    .eq("page_id", pageId)
    .maybeSingle()

  if (!block) throw new ServiceError("Block not found", 404, "NOT_FOUND")

  const patch: Database["public"]["Tables"]["blocks"]["Update"] = {}
  if (data.type !== undefined) patch.type = data.type
  if (data.content !== undefined) patch.content = data.content
  if (data.checked !== undefined) patch.checked = data.checked
  if (data.icon !== undefined) patch.icon = data.icon
  if (data.sortOrder !== undefined) patch.sort_order = data.sortOrder

  const { data: updated, error } = await supabase
    .from("blocks")
    .update(patch)
    .eq("id", blockId)
    .select("*")
    .single()

  if (error) throw new ServiceError(error.message, 500)
  return updated
}

export async function deleteBlockForPage(
  supabase: SupabaseClient<Database>,
  userId: string,
  pageId: string,
  blockId: string,
) {
  await assertPageOwned(supabase, userId, pageId)

  const { data: block } = await supabase
    .from("blocks")
    .select("sort_order")
    .eq("id", blockId)
    .eq("page_id", pageId)
    .maybeSingle()

  if (!block) throw new ServiceError("Block not found", 404, "NOT_FOUND")

  const { error } = await supabase.from("blocks").delete().eq("id", blockId)
  if (error) throw new ServiceError(error.message, 500)

  await shiftBlockOrdersFrom(supabase, pageId, block.sort_order + 1, -1)
}

export async function moveBlockForPage(
  supabase: SupabaseClient<Database>,
  userId: string,
  pageId: string,
  blockId: string,
  direction: "up" | "down",
) {
  await assertPageOwned(supabase, userId, pageId)

  const { error } = await supabase.rpc("move_block", {
    p_page_id: pageId,
    p_block_id: blockId,
    p_direction: direction,
  })

  if (error) {
    if (error.message.includes("Cannot move")) {
      throw new ServiceError(error.message, 400, "INVALID_MOVE")
    }
    throw new ServiceError(error.message, 500)
  }

  return listBlocksForPage(supabase, userId, pageId)
}
