import { PrismaClient, RoleName } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { PERMISSIONS, ROLE_LABELS, ROLE_PERMISSIONS, ROLES } from "../src/lib/permissions";

const prisma = new PrismaClient();

async function seedRbac() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { label: permission.label, group: permission.group },
      create: { key: permission.key, label: permission.label, group: permission.group },
    });
  }

  for (const name of ROLES) {
    const meta = ROLE_LABELS[name];
    const role = await prisma.role.upsert({
      where: { name },
      update: { label: meta.label, description: meta.description },
      create: { name, label: meta.label, description: meta.description },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    const permissions = await prisma.permission.findMany({
      where: { key: { in: ROLE_PERMISSIONS[name] } },
      select: { id: true },
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
      skipDuplicates: true,
    });
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !name || !password) {
    throw new Error(
      "Missing admin credentials. Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding.",
    );
  }

  const role = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.SUPER_ADMIN } });
  const passwordHash = await hashPassword(password);

  const profile = await prisma.profile.upsert({
    where: { email },
    update: { name, roleId: role.id, passwordHash, isActive: true },
    create: { email, name, roleId: role.id, passwordHash, isActive: true },
  });

  console.log(`Super Admin ready: ${profile.email}`);
}

async function main() {
  await seedRbac();
  await seedAdmin();
  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
