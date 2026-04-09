#!/usr/bin/env ts-node
"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function listUsers() {
    return __awaiter(this, void 0, void 0, function () {
        var partners, total, admins, active, noPass, _i, partners_1, p, hasPass;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.partner.findMany({
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            status: true,
                            passwordHash: true,
                            createdAt: true,
                        },
                    })];
                case 1:
                    partners = _a.sent();
                    total = partners.length;
                    admins = partners.filter(function (p) { return p.role === 'ADMIN'; }).length;
                    active = partners.filter(function (p) { return p.status === 'ACTIVE'; }).length;
                    noPass = partners.filter(function (p) { return !p.passwordHash; }).length;
                    console.log('\n═══════════════════════════════════════════════════');
                    console.log("  Partners / Users   (".concat(total, " total)"));
                    console.log('═══════════════════════════════════════════════════');
                    console.log("  Active: ".concat(active, "  |  Admins: ").concat(admins, "  |  No password set: ").concat(noPass));
                    console.log('───────────────────────────────────────────────────');
                    for (_i = 0, partners_1 = partners; _i < partners_1.length; _i++) {
                        p = partners_1[_i];
                        hasPass = p.passwordHash ? '✓ password' : '✗ NO PASSWORD';
                        console.log("  [".concat(p.role.padEnd(7), "] [").concat(p.status.padEnd(14), "]  ").concat(p.email.padEnd(40), "  ").concat(p.name.padEnd(30), "  ").concat(hasPass));
                    }
                    console.log('═══════════════════════════════════════════════════\n');
                    return [2 /*return*/];
            }
        });
    });
}
function setPassword(email, newPassword) {
    return __awaiter(this, void 0, void 0, function () {
        var partner, hash;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!email || !newPassword) {
                        console.error('Usage: admin-tools.ts set-password <email> <new-password>');
                        process.exit(1);
                    }
                    if (newPassword.length < 8) {
                        console.error('Password must be at least 8 characters.');
                        process.exit(1);
                    }
                    return [4 /*yield*/, prisma.partner.findUnique({ where: { email: email } })];
                case 1:
                    partner = _a.sent();
                    if (!partner) {
                        console.error("No partner found with email: ".concat(email));
                        process.exit(1);
                    }
                    return [4 /*yield*/, bcrypt.hash(newPassword, 12)];
                case 2:
                    hash = _a.sent();
                    return [4 /*yield*/, prisma.partner.update({
                            where: { email: email },
                            data: { passwordHash: hash },
                        })];
                case 3:
                    _a.sent();
                    console.log("\n\u2713 Password updated for ".concat(partner.name, " (").concat(email, ")\n"));
                    return [2 /*return*/];
            }
        });
    });
}
function createAdmin(email, name, password) {
    return __awaiter(this, void 0, void 0, function () {
        var existing, hash_1, hash;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!email || !name || !password) {
                        console.error('Usage: admin-tools.ts create-admin <email> <name> <password>');
                        process.exit(1);
                    }
                    if (password.length < 8) {
                        console.error('Password must be at least 8 characters.');
                        process.exit(1);
                    }
                    return [4 /*yield*/, prisma.partner.findUnique({ where: { email: email } })];
                case 1:
                    existing = _a.sent();
                    if (!existing) return [3 /*break*/, 4];
                    return [4 /*yield*/, bcrypt.hash(password, 12)];
                case 2:
                    hash_1 = _a.sent();
                    return [4 /*yield*/, prisma.partner.update({
                            where: { email: email },
                            data: { role: 'ADMIN', status: 'ACTIVE', passwordHash: hash_1 },
                        })];
                case 3:
                    _a.sent();
                    console.log("\n\u2713 Promoted existing user to ADMIN: ".concat(email, "\n"));
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, bcrypt.hash(password, 12)];
                case 5:
                    hash = _a.sent();
                    return [4 /*yield*/, prisma.partner.create({
                            data: {
                                name: name,
                                email: email,
                                passwordHash: hash,
                                role: 'ADMIN',
                                status: 'ACTIVE',
                                country: 'GB', // default — update as needed
                            },
                        })];
                case 6:
                    _a.sent();
                    console.log("\n\u2713 Admin user created: ".concat(name, " (").concat(email, ")\n"));
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, command, args, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = process.argv, command = _a[2], args = _a.slice(3);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, , 10, 12]);
                    _b = command;
                    switch (_b) {
                        case 'list': return [3 /*break*/, 2];
                        case 'set-password': return [3 /*break*/, 4];
                        case 'create-admin': return [3 /*break*/, 6];
                    }
                    return [3 /*break*/, 8];
                case 2: return [4 /*yield*/, listUsers()];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 9];
                case 4: return [4 /*yield*/, setPassword(args[0], args[1])];
                case 5:
                    _c.sent();
                    return [3 /*break*/, 9];
                case 6: return [4 /*yield*/, createAdmin(args[0], args[1], args[2])];
                case 7:
                    _c.sent();
                    return [3 /*break*/, 9];
                case 8:
                    console.log("\nElorge Admin Tools\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n  list                              \u2014 show all users + counts\n  set-password <email> <password>   \u2014 set/reset a user's password\n  create-admin <email> <name> <pw>  \u2014 create or promote to admin\n        ");
                    _c.label = 9;
                case 9: return [3 /*break*/, 12];
                case 10: return [4 /*yield*/, prisma.$disconnect()];
                case 11:
                    _c.sent();
                    return [7 /*endfinally*/];
                case 12: return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    console.error(err);
    process.exit(1);
});
