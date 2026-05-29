export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: ['/library/:path*', '/social/:path*', '/profile/:path*'],
}
