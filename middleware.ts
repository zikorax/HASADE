import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  // Auth.js v5 uses "authjs.session-token", v4 used "next-auth.session-token"
  const session =
    req.cookies.get("authjs.session-token") ||
    req.cookies.get("__Secure-authjs.session-token") ||
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token")

  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard")
  const isLogin = req.nextUrl.pathname.startsWith("/login")
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth")

  if (isDashboard && !session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isLogin && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
