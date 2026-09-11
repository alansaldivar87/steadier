import { requireMember, errorResponse } from '@/lib/access';
import { household, query, householdId, list } from '@/lib/db';
export async function GET() {
  try {
    await requireMember();
    const data = await household();
    const audit = await query('SELECT * FROM audit WHERE household=? ORDER BY created_at', [
      householdId(),
    ]);
    const usage = await query('SELECT * FROM ai_usage WHERE household=? ORDER BY created_at', [
      householdId(),
    ]);
    return Response.json(
      {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        data,
        messages: await list('message'),
        audit: audit.rows,
        aiUsage: usage.rows,
      },
      {
        headers: {
          'Content-Disposition': 'attachment; filename="steadier-household.json"',
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
