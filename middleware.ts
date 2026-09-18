import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const publicPaths = ["/login", "/auth/callback"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  if (pathname === "/signup") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const { supabase, response } = await updateSession(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (publicPaths.includes(pathname)) {
    if (user) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return response
  }

  if (pathname.startsWith("/api/")) {
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      )
    }
    return response
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
