import type { DefaultSession } from "next-auth";
import type { PermissionKey, RoleName } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: RoleName;
      roleLabel: string;
      permissions: PermissionKey[];
    } & DefaultSession["user"];
  }

  interface User {
    role: RoleName;
    roleLabel: string;
    permissions: PermissionKey[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: RoleName;
    roleLabel: string;
    permissions: PermissionKey[];
  }
}
