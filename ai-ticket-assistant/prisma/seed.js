import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";

// Bootstraps an admin user so the system has someone to fall back to for
// ticket assignment and to manage roles. Safe to run repeatedly (upsert).
async function main() {
  const email = "admin@ticketflow.com";
  const password = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password,
      role: "admin",
      skills: ["Technical Support", "Troubleshooting"],
    },
  });

  console.log(`Seeded admin: ${email} (password: admin123 - change it)`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
