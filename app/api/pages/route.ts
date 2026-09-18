import { NextResponse } from "next/server"
import { getRouteAuth } from "@/lib/auth"
import { jsonError } from "@/lib/api/response"
import { buildSidebarTree } from "@/lib/notion/types"
import { createPageSchema } from "@/lib/validations/pages"
import { createPageForUser, listPagesForUser } from "@/lib/services/pages"

export async function GET() {
  try {
    const { supabase, user } = await getRouteAuth()
    const pages = await listPagesForUser(supabase, user.id)
    const sidebar = buildSidebarTree(pages)
    return NextResponse.json({ pages, sidebar })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getRouteAuth()
    const body = await request.json()
    const parsed = createPageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 },
      )
    }

    const page = await createPageForUser(supabase, user.id, parsed.data)
    return NextResponse.json({ page }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
