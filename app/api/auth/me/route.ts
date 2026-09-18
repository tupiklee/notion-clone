import { NextResponse } from "next/server"
import { ensureProfile, getRouteSession } from "@/lib/auth"
import { jsonError } from "@/lib/api/response"

export async function GET() {
  try {
    const { supabase, user } = await getRouteSession()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      )
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (authUser) {
      await ensureProfile(supabase, authUser)
    }

    return NextResponse.json({ user })
  } catch (error) {
    return jsonError(error)
  }
}
