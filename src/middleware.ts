import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // On
  // ly protect admin routes
  if (path.startsWith('/admin')) {
    try {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // Debug log
      console.log('Admin route access attempt:', {
        path,
        hasToken: !!token,
        userEmail: token?.email,
        isAdmin: token?.isAdmin,
        tokenContents: token,
        url: req.url,
        nextUrl: req.nextUrl.toString(),
      });

      // Check if the user is not logged in or not an admin
      if (!token || !token.isAdmin) {
        console.log('Access denied:', {
          hasToken: !!token,
          isAdmin: token?.isAdmin,
          redirectingTo: '/auth/login',
        });

        // Create base URL without query parameters
        const baseUrl = new URL(req.nextUrl.origin);
        baseUrl.pathname = '/auth/login';
        
        // Add the current URL as the callback
        baseUrl.searchParams.set('callbackUrl', req.nextUrl.href);
        
        // Add error message if not admin
        if (token && !token.isAdmin) {
          baseUrl.searchParams.set('error', 'Not authorized as admin');
        }
        
        return NextResponse.redirect(baseUrl);
      }

      console.log('Access granted to admin route');
    } catch (error) {
      console.error('Middleware error:', error);
      // Redirect to login with error
      const baseUrl = new URL(req.nextUrl.origin);
      baseUrl.pathname = '/auth/login';
      baseUrl.searchParams.set('error', 'Authentication error');
      baseUrl.searchParams.set('callbackUrl', req.nextUrl.href);
      return NextResponse.redirect(baseUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
}; 