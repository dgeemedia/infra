#!/usr/bin/env ts-node
// apps/api/scripts/admin-tools.ts
//
// Usage (run from apps/api/):
//   npx ts-node scripts/admin-tools.ts list
//   npx ts-node scripts/admin-tools.ts set-password <email> <new-password>
//   npx ts-node scripts/admin-tools.ts create-admin <email> <name> <password>
//
// Or add to package.json scripts:
//   "admin:list":    "ts-node scripts/admin-tools.ts list",
//   "admin:passwd":  "ts-node scripts/admin-tools.ts set-password",

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function listUsers() {
  const partners = await prisma.partner.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id:           true,
      name:         true,
      email:        true,
      role:         true,
      status:       true,
      passwordHash: true,
      createdAt:    true,
    },
  });

  const total  = partners.length;
  const admins = partners.filter((p) => p.role   === 'ADMIN').length;
  const active = partners.filter((p) => p.status === 'ACTIVE').length;
  const noPass = partners.filter((p) => !p.passwordHash).length;

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  Partners / Users   (${total} total)`);
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Active: ${active}  |  Admins: ${admins}  |  No password set: ${noPass}`);
  console.log('───────────────────────────────────────────────────');

  for (const p of partners) {
    const hasPass = p.passwordHash ? '✓ password' : '✗ NO PASSWORD';
    console.log(
      `  [${p.role.padEnd(7)}] [${p.status.padEnd(14)}]  ${p.email.padEnd(40)}  ${p.name.padEnd(30)}  ${hasPass}`,
    );
  }

  console.log('═══════════════════════════════════════════════════\n');
}

async function setPassword(email: string, newPassword: string) {
  if (!email || !newPassword) {
    console.error('Usage: admin-tools.ts set-password <email> <new-password>');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const partner = await prisma.partner.findUnique({ where: { email } });
  if (!partner) {
    console.error(`No partner found with email: ${email}`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.partner.update({
    where: { email },
    data:  { passwordHash: hash },
  });

  console.log(`\n✓ Password updated for ${partner.name} (${email})\n`);
}

async function createAdmin(email: string, name: string, password: string) {
  if (!email || !name || !password) {
    console.error('Usage: admin-tools.ts create-admin <email> <name> <password>');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const existing = await prisma.partner.findUnique({ where: { email } });
  if (existing) {
    // If the user exists, just promote them to ADMIN + set password
    const hash = await bcrypt.hash(password, 12);
    await prisma.partner.update({
      where: { email },
      data:  { role: 'ADMIN', status: 'ACTIVE', passwordHash: hash },
    });
    console.log(`\n✓ Promoted existing user to ADMIN: ${email}\n`);
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.partner.create({
    data: {
      name,
      email,
      passwordHash: hash,
      role:         'ADMIN',
      status:       'ACTIVE',
      country:      'GB',   // default — update as needed
    },
  });

  console.log(`\n✓ Admin user created: ${name} (${email})\n`);
}

async function main() {
  const [,, command, ...args] = process.argv;

  try {
    switch (command) {
      case 'list':
        await listUsers();
        break;

      case 'set-password':
        await setPassword(args[0]!, args[1]!);
        break;

      case 'create-admin':
        await createAdmin(args[0]!, args[1]!, args[2]!);
        break;

      default:
        console.log(`
Elorge Admin Tools
──────────────────
  list                              — show all users + counts
  set-password <email> <password>   — set/reset a user's password
  create-admin <email> <name> <pw>  — create or promote to admin
        `);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});