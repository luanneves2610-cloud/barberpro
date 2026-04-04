/**
 * Supabase Auth Callback — PKCE flow
 *
 * O Supabase redireciona para este endpoint após:
 *  - Confirmação de e-mail no cadastro
 *  - Clique no link de recuperação de senha
 *  - Magic link login (se habilitado)
 *
 * Troca o `code` por uma sessão SSR e redireciona para `next` (padrão: /dashboard).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    // Nenhum code → redireciona para login
    return NextResponse.redirect(`${origin}/login`)
  }

  // Cria o Supabase client com cookies mutáveis
  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=link_expirado`)
  }

  return response
}
