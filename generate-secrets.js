// generate-secrets.js
import crypto from 'crypto';

// Generate JWT secret (64+ chars)
const jwtSecret = crypto.randomBytes(48).toString('hex'); // 48 bytes -> 96 hex chars
const jwtExpiresIn = '7d';

// Generate NextAuth secret (32+ chars)
const nextAuthSecret = crypto.randomBytes(32).toString('hex'); // 32 bytes -> 64 hex chars

console.log('--- JWT (Authentication) ---');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_EXPIRES_IN=${jwtExpiresIn}\n`);

console.log('--- Dashboard (Next.js) ---');
console.log(`NEXTAUTH_SECRET=${nextAuthSecret}`);