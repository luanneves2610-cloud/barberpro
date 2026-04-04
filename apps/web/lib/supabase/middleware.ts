import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Atualiza a sessão — NÃO remova esta chamada
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de auth
  // Rotas que não exigem login
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/agendar',
    '/avaliar',
    '/confirmar',
    '/sucesso',
    '/cancelamento',
    '/api/auth/callback',
    '/api/rating',
  ]
  const isPublicRoute = publicRoutes.some((r) =>
    r === '/' ? pathname === '/' : pathname.startsWith(r),
  )

  // Rotas públicas que NÃO devem redirecionar usuários já autenticados
  // (clientes acessam sem conta; admins logados podem acessar normalmente)
  const neverRedirectRoutes = [
    '/agendar',
    '/avaliar',
    '/confirmar',
    '/sucesso',
    '/cancelamento',
    '/reset-password',
    '/api/auth/callback',
    '/api/rating',
  ]
  const isNeverRedirect = neverRedirectRoutes.some((r) => pathname.startsWith(r))

  // Redireciona para login se não autenticado em rota protegida
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redireciona para dashboard se já autenticado tentando acessar auth
  // (mas não para rotas de booking/confirmação — clientes sem conta devem acessar)
  if (user && isPublicRoute && !isNeverRedirect) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
