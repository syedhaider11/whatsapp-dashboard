import type { NextAuthConfig } from "next-auth";
import type { PermissionKey, RoleName } from "@/lib/permissions";

export const authConfig = {
  secret: process.env.AUTH_SESSION_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) return Boolean(auth?.user);
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = user.role;
        token.roleLabel = user.roleLabel;
        token.permissions = user.permissions;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as RoleName;
        session.user.roleLabel = token.roleLabel as string;
        session.user.permissions = (token.permissions as PermissionKey[]) ?? [];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
