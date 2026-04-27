import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware (request: NextRequest) {
  // 1. Cek apakah pengunjung punya tiket masuk (cookie 'admin_session')
  const hasSession = request.cookies.has('admin_session')

  // 2. Daftar halaman yang wajib dijaga (harus login)
  // SEKARANG KITA TAMBAHKAN "/" SEBAGAI HALAMAN RAHASIA JUGA
  const isProtectedPath =
    request.nextUrl.pathname === '/' || // <--- Tambahan baru
    request.nextUrl.pathname.startsWith('/products') ||
    request.nextUrl.pathname.startsWith('/qrcode') ||
    request.nextUrl.pathname.startsWith('/list-qrcode') // Saya lihat Anda punya halaman baru ini

  // 3. Jika mencoba masuk halaman terlindungi TAPI tidak punya tiket
  if (isProtectedPath && !hasSession) {
    // Tendang balik ke halaman login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 4. Jika sudah punya tiket tapi malah buka halaman login lagi
  if (request.nextUrl.pathname === '/login' && hasSession) {
    // Langsung arahkan ke halaman utama (Landing Page)
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// 5. Konfigurasi agar satpam ini berjaga di pintu-pintu ini
export const config = {
  matcher: [
    '/',
    '/products/:path*',
    '/qrcode/:path*',
    '/list-qrcode/:path*',
    '/login'
  ]
}
