import { z } from 'zod';
import { requireMember, sameOrigin, jsonBody, errorResponse } from '@/lib/access';
import { coach, conversation } from '@/lib/ai/coach';
import { requestLocale } from '@/lib/i18n';
export const maxDuration = 120;
export async function GET() {
  try {
    const member = await requireMember();
    return Response.json(await conversation(member.email), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const member = await requireMember();
    const { message } = z
      .object({ message: z.string().trim().min(1).max(4000) })
      .parse(await jsonBody(request));
    return Response.json(await coach(message, member.email, requestLocale(request)));
  } catch (e) {
    return errorResponse(e);
  }
}
