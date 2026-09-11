import { z } from 'zod';
import { requireMember, sameOrigin, jsonBody, errorResponse } from '@/lib/access';
import { reviewDraft } from '@/lib/review';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const member = await requireMember();
    const input = z
      .object({
        id: z.string(),
        revision: z.number().int(),
        action: z.enum(['accept', 'dismiss']),
        data: z.unknown(),
        allowDuplicate: z.boolean().default(false),
        target: z.object({ id: z.string(), revision: z.number().int() }).optional(),
      })
      .parse(await jsonBody(request));
    return Response.json(
      await reviewDraft(
        input.id,
        input.revision,
        input.action,
        input.data,
        member.email,
        input.allowDuplicate,
        input.target,
      ),
    );
  } catch (e) {
    return errorResponse(e);
  }
}
