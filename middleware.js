import { NextResponse } from 'next/server';
import { verifyToken } from './src/lib/auth';

// Only these paths are accessible without authentication
const publicPaths = [
  '/login', 
  '/signup',
  '/api/login',
  '/api/signup',
  '/api/verify-otp',
  '/api/resend-otp'
];

// Check if path is a public path
const isPublicPath = (path) => {
  return publicPaths.some(publicPath => 
    path === publicPath || 
    path.startsWith(`${publicPath}/`) ||
    // Allow static files and assets
    path.startsWith('/_next/') ||
    path.startsWith('/favicon.ico') ||
    /\.(svg|png|jpg|jpeg|gif|webp|css|js)$/.test(path)
  );
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const isAuthPage = ['/login', '/signup', '/otp'].some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // If user is authenticated and tries to access auth pages, redirect to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow public paths (login, signup, static files, etc.)
  if (isPublicPath(pathname)) {
    // If user is already authenticated and tries to access root, redirect to dashboard
    if (token && (pathname === '/' || pathname === '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Redirect to login if no token
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    // Only set redirect if it's not an auth page
    if (!isAuthPage) {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Verify token for protected routes
  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      throw new Error('Invalid token');
    }
    
    // Add user info to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.id);
    requestHeaders.set('x-user-email', decoded.email);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    // Clear invalid token and redirect to login
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('token');
    return response;
  }
}

// Match all routes except static files and API routes that don't need protection
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes are handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - image files
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
};
