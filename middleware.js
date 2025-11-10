// middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // If user opens root "/", redirect them to /login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Otherwise, continue as normal
  return NextResponse.next();
}
