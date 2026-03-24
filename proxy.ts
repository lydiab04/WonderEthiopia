import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Super Admin routes
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "super_admin") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Tourism Admin routes
    if (pathname.startsWith("/tourism-admin")) {
      if (
        token?.role !== "tourism_admin" &&
        token?.role !== "super_admin"
      ) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Business Owner routes (Protected Dashboard, e.g. /business/dashboard)
    if (pathname.startsWith("/business/")) {
      if (
        token?.role !== "business_owner" &&
        token?.role !== "super_admin"
      ) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Dashboard routes (any authenticated user)
    if (pathname.startsWith("/dashboard")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes - allow without auth
        const publicRoutes = ["/", "/login", "/register", "/unauthorized", "/business"];
        if (publicRoutes.some((route) => pathname === route)) {
          return true;
        }

        // API auth routes and public business API routes are public
        if (
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/businesses/public") ||
          pathname.startsWith("/api/businesses/apply")
        ) {
          return true;
        }

        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/tourism-admin/:path*",
    "/business/:path*",
    "/dashboard/:path*",
    "/api/businesses/:path*",
    "/api/reports/:path*",
  ],
};
