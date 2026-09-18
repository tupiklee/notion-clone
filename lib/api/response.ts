import { NextResponse } from "next/server"
import { AuthError } from "@/lib/auth"
import { ServiceError } from "@/lib/services/pages"

export function jsonError(error: unknown) {
  if (error instanceof AuthError || error instanceof ServiceError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    )
  }
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    )
  }
  console.error(error)
  return NextResponse.json({ error: "Internal server error" }, { status: 500 })
}
