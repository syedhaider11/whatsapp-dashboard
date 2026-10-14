import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { ROLE_LABELS, type PermissionKey } from "@/lib/permissions";
import { RATE_LIMITS, consumeRateLimit, parseClientIp } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SESSION_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        const ip = parseClientIp(request?.headers.get("x-forwarded-for"));
        const ipLimit = await consumeRateLimit(`login:ip:${ip}`, RATE_LIMITS.loginIp);
        const emailLimit = await consumeRateLimit(`login:email:${email}`, RATE_LIMITS.loginEmail);
        if (!ipLimit.allowed || !emailLimit.allowed) return null;

        const profile = await prisma.profile.findUnique({
          where: { email },
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        });

        if (!profile || !profile.isActive) return null;

        const valid = await verifyPassword(password, profile.passwordHash);
        if (!valid) return null;

        await prisma.profile.update({
          where: { id: profile.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.avatarUrl,
          role: profile.role.name,
          roleLabel: ROLE_LABELS[profile.role.name].label,
          permissions: profile.role.rolePermissions.map(
            (entry) => entry.permission.key as PermissionKey,
          ),
        };
      },
    }),
  ],
});
