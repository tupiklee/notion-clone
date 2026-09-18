import { NextResponse } from "next/server"
import { z } from "zod"
import { getRouteAuth } from "@/lib/auth"
import { jsonError } from "@/lib/api/response"
import { mapBlockToApi } from "@/lib/supabase/mappers"
import { moveBlockForPage } from "@/lib/services/blocks"

type Params = { params: Promise<{ pageId: string; blockId: string }> }

const moveSchema = z.object({
  direction: z.enum(["up", "down"]),
})

export async function POST(request: Request, { params }: Params) {
  try {
    const { supabase, user } = await getRouteAuth()
    const { pageId, blockId } = await params
    const body = await request.json()
    const parsed = moveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 },
      )
    }

    const blocks = await moveBlockForPage(
      supabase,
      user.id,
      pageId,
      blockId,
      parsed.data.direction,
    )
    return NextResponse.json({ blocks: blocks.map(mapBlockToApi) })
  } catch (error) {
    return jsonError(error)
  }
}
