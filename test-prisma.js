const { PrismaClient } = require('@prisma/client');
console.log('PrismaClient:', typeof PrismaClient);
const p = new PrismaClient();
console.log('Instance:', !!p);
console.log('Company:', typeof p.company);
p.$disconnect();