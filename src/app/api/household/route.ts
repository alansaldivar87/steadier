import { requireMember, errorResponse } from '@/lib/access';
import { household, query, householdId } from '@/lib/db';
import { forecast } from '@/lib/finance';
import { today } from '@/lib/domain';
import { aiConfig, documentAiConfig } from '@/lib/ai/config';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const member = await requireMember();
    const data = await household();
    const day = today(data.settings.timeZone);
    const ai = await aiConfig();
    const documentAi = await documentAiConfig();
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
          ai: ai.configured,
          model: ai.model || null,
          documentAi: documentAi.configured,
          documentModel: documentAi.model || null,
          storage: process.env.STORAGE_DRIVER || 'local',
          database: process.env.DATABASE_URL?.startsWith('libsql:') ? 'cloud' : 'local',
          usage: usage.rows[0],
          dailyCallLimit: ai.dailyCallLimit,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
