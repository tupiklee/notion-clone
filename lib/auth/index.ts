import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/server"
import type { SessionUser } from "./types"

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
  }
}

export async function getSession(
  supabase: SupabaseClient<Database>,
): Promise<SessionUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, email")
    .eq("id", user.id)
    .maybeSingle()

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    name: profile?.display_name ?? user.user_metadata?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
  }
}

export async function requireUser(
  supabase: SupabaseClient<Database>,
): Promise<SessionUser> {
  const session = await getSession(supabase)
  if (!session) {
    throw new AuthError("Unauthorized", 401, "UNAUTHORIZED")
  }
  return session
}

export async function ensureProfile(
  supabase: SupabaseClient<Database>,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> },
) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()

  if (existing) return

  await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email ?? null,
    display_name:
      (user.user_metadata?.full_name as string) ??
      (user.user_metadata?.name as string) ??
      null,
    avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
  })
}

export type { SessionUser } from "./types"

export async function getRouteAuth() {
  const supabase = await createClient()
  const user = await requireUser(supabase)
  return { supabase, user }
}

export async function getRouteSession() {
  const supabase = await createClient()
  const user = await getSession(supabase)
  return { supabase, user }
}
