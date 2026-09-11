import { z } from 'zod';
import { requireMember, sameOrigin, jsonBody, errorResponse } from '@/lib/access';
import { list } from '@/lib/db';
import { coach } from '@/lib/ai/coach';
export const maxDuration = 60;
export async function GET() {
  try {
    await requireMember();
    return Response.json((await list('message')).slice(0, 100).reverse(), {
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
    return Response.json(await coach(message, member.email));
  } catch (e) {
    return errorResponse(e);
  }
}
