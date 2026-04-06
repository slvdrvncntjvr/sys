export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/board/:path*", "/archive/:path*", "/trash/:path*"],
};
