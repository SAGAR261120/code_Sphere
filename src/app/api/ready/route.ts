import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function GET() {
  const start = Date.now();
  let dbStatus = 'DOWN';
  let dbLatencyMs = -1;
  let dbError: string | null = null;

  try {
    // Ping database with minimal query
    await prisma.$queryRaw`SELECT 1 as ping`;
    dbLatencyMs = Date.now() - start;
    dbStatus = 'CONNECTED';
  } catch (err: any) {
    dbStatus = 'ERROR';
    dbError = err.message || 'Database query failed';
  }

  // Check essential environment variables presence (without leaking values)
  const hasDb = !!process.env.DATABASE_URL;
  const hasSession = !!(process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET);
  const missingEnv: string[] = [];
  if (!hasDb) missingEnv.push('DATABASE_URL');
  if (!hasSession) missingEnv.push('SESSION_SECRET');

  const isHealthy = dbStatus === 'CONNECTED' && missingEnv.length === 0;
  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? 'READY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          error: dbError,
        },
        environment: {
          status: missingEnv.length === 0 ? 'CONFIGURED' : 'INCOMPLETE',
          missingVariables: missingEnv,
        },
      },
      uptimeSeconds: Math.floor(process.uptime()),
    },
    {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
