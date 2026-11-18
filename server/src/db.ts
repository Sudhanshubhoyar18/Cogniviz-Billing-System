import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import { config } from './config.js';

let prisma: PrismaClient;

if (config.tursoUrl && config.tursoUrl.startsWith('libsql://')) {
  // Production / Remote Turso database
  const libsql = createClient({
    url: config.tursoUrl,
    authToken: config.tursoToken,
  });
  const adapter = new PrismaLibSQL(libsql);
  prisma = new PrismaClient({ adapter });
} else {
  // Local development SQLite / libSQL
  prisma = new PrismaClient();
}

export { prisma };
export default prisma;
