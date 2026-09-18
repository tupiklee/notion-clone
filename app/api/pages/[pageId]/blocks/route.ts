import { NextResponse } from "next/server"
import { getRouteAuth } from "@/lib/auth"
import { jsonError } from "@/lib/api/response"
import { mapBlockToApi } from "@/lib/supabase/mappers"
import { createBlockSchema } from "@/lib/validations/blocks"
import {
  createBlockForPage,
  listBlocksForPage,
} from "@/lib/services/blocks"

type Params = { params: Promise<{ pageId: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { supabase, user } = await getRouteAuth()
    const { pageId } = await params
    const blocks = await listBlocksForPage(supabase, user.id, pageId)
    return NextResponse.json({ blocks: blocks.map(mapBlockToApi) })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { supabase, user } = await getRouteAuth()
    const { pageId } = await params
    const body = await request.json()
    const parsed = createBlockSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 },
      )
    }

    const block = await createBlockForPage(
      supabase,
      user.id,
      pageId,
      parsed.data,
    )
    return NextResponse.json({ block: mapBlockToApi(block) }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
