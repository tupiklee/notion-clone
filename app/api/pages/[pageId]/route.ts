import { NextResponse } from "next/server"
import { getRouteAuth } from "@/lib/auth"
import { jsonError } from "@/lib/api/response"
import { pageToNotionPage } from "@/lib/notion/types"
import { updatePageSchema } from "@/lib/validations/pages"
import {
  deletePageForUser,
  getPageForUser,
  updatePageForUser,
} from "@/lib/services/pages"

type Params = { params: Promise<{ pageId: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { supabase, user } = await getRouteAuth()
    const { pageId } = await params
    const page = await getPageForUser(supabase, user.id, pageId)
    return NextResponse.json({
      page: pageToNotionPage(page, page.blocks),
    })
  } catch (error) {
    return jsonError(error)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { supabase, user } = await getRouteAuth()
    const { pageId } = await params
    const body = await request.json()
    const parsed = updatePageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 },
      )
    }

    const page = await updatePageForUser(
      supabase,
      user.id,
      pageId,
      parsed.data,
    )
    return NextResponse.json({
      page: pageToNotionPage(page, page.blocks),
    })
  } catch (error) {
    return jsonError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { supabase, user } = await getRouteAuth()
    const { pageId } = await params
    await deletePageForUser(supabase, user.id, pageId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
