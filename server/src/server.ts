import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './db/prisma';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`✅ Lesson Diary API is running on port ${env.PORT}`);
  console.log(`   Health:  http://localhost:${env.PORT}/api/health`);
  console.log(`   Swagger: http://localhost:${env.PORT}/api-docs`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received, shutting down...`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
