import { createAuthMiddleware } from "@enjambre/auth/middleware";

export const middleware = createAuthMiddleware({
  publicRoutes: ["/", "/login"],
  authRedirect: "/login",
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|assets|icons).*)",
  ],
};
