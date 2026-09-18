import { NextResponse } from "next/server"
import { getRouteAuth } from "@/lib/auth"
import { jsonError } from "@/lib/api/response"
import { mapBlockToApi } from "@/lib/supabase/mappers"
import { updateBlockSchema } from "@/lib/validations/blocks"
import {
  deleteBlockForPage,
  updateBlockForPage,
} from "@/lib/services/blocks"

type Params = { params: Promise<{ pageId: string; blockId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { supabase, user } = await getRouteAuth()
    const { pageId, blockId } = await params
    const body = await request.json()
    const parsed = updateBlockSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 },
      )
    }

    const block = await updateBlockForPage(
      supabase,
      user.id,
      pageId,
      blockId,
      parsed.data,
    )
    return NextResponse.json({ block: mapBlockToApi(block) })
  } catch (error) {
    return jsonError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { supabase, user } = await getRouteAuth()
    const { pageId, blockId } = await params
    await deleteBlockForPage(supabase, user.id, pageId, blockId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
