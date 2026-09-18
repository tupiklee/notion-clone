"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? "/"
  const authError = searchParams.get("error") === "auth"

  const [error, setError] = useState<string | null>(
    authError ? "Google 로그인에 실패했습니다. 다시 시도해 주세요." : null,
  )
  const [loading, setLoading] = useState(false)

  async function signInWithGoogle() {
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      })
      if (oauthError) {
        setError(oauthError.message)
        setLoading(false)
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">로그인</h1>
        <p className="text-sm text-muted-foreground">
          Google 계정으로 워크스페이스에 접속하세요
        </p>
      </div>
      {error && (
        <p className="text-sm text-destructive text-center" role="alert">
          {error}
        </p>
      )}
      <Button
        type="button"
        className="w-full"
        disabled={loading}
        onClick={signInWithGoogle}
      >
        {loading ? "이동 중…" : "Google로 계속하기"}
      </Button>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense fallback={<p className="text-sm text-muted-foreground">로딩…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
