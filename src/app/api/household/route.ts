import { requireMember, errorResponse } from '@/lib/access';
import { household, query, householdId } from '@/lib/db';
import { forecast } from '@/lib/finance';
import { today } from '@/lib/domain';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const member = await requireMember();
    const data = await household();
    const day = today(data.settings.timeZone);
    const usage = await query(
      'SELECT COUNT(*) AS calls, SUM(input_tokens) AS inputTokens, SUM(output_tokens) AS outputTokens FROM ai_usage WHERE household=? AND day=?',
      [householdId(), new Date().toISOString().slice(0, 10)],
    );
    return Response.json(
      {
        data,
        forecast: forecast(data, day),
        today: day,
        member,
        connections: {
          ai: !!(process.env.AI_API_KEY && process.env.AI_MODEL),
          model: process.env.AI_MODEL || null,
          storage: process.env.STORAGE_DRIVER || 'local',
          database: process.env.DATABASE_URL?.startsWith('libsql:') ? 'cloud' : 'local',
          usage: usage.rows[0],
          dailyCallLimit: Number(process.env.AI_DAILY_CALL_LIMIT || 40),
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
