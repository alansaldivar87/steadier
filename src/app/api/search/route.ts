import { z } from 'zod';
import { requireMember, sameOrigin, jsonBody, errorResponse } from '@/lib/access';
import { retrieve } from '@/lib/ai/retrieval';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requireMember();
    const { query } = z
      .object({ query: z.string().trim().min(1).max(1000) })
      .parse(await jsonBody(request));
    return Response.json(await retrieve(query));
  } catch (e) {
    return errorResponse(e);
  }
}
