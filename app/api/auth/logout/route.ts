import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { jsonError } from "@/lib/api/response"

export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
