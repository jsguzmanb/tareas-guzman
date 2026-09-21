import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const identityEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const notificationEmail = process.env.REMINDER_EMAIL_TO?.trim().toLowerCase();
  const timeZone = process.env.ADMIN_TIME_ZONE?.trim() || "UTC";

  if (!username || !password || !identityEmail || !notificationEmail) {
    throw new Error(
      "Define ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL y REMINDER_EMAIL_TO en .env antes de seedear",
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash, identityEmail },
    create: { username, passwordHash, identityEmail },
  });

  await prisma.$transaction([
    prisma.accessGrant.upsert({
      where: {
        userId_source_entitlement: {
          userId: user.id,
          source: "TECHNICAL",
          entitlement: "tasks",
        },
      },
      update: { active: true, sourceStatus: "seeded-admin" },
      create: {
        userId: user.id,
        source: "TECHNICAL",
        entitlement: "tasks",
        active: true,
        sourceStatus: "seeded-admin",
      },
    }),
    prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: { notificationEmail, timeZone },
      create: {
        userId: user.id,
        notificationEmail,
        timeZone,
      },
    }),
  ]);

  console.log(`Usuario "${username}" listo.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
