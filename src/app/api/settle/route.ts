import { z } from 'zod';
import { requireMember, sameOrigin, jsonBody, errorResponse } from '@/lib/access';
import { settlementSchema, settlePayment, reopenPayment } from '@/lib/settlement';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const member = await requireMember();
    return Response.json(
      await settlePayment(settlementSchema.parse(await jsonBody(request)), member.email),
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const member = await requireMember();
    const input = z
      .object({ id: z.string(), revision: z.number().int(), date: z.string() })
      .parse(await jsonBody(request));
    return Response.json(await reopenPayment(input.id, input.revision, input.date, member.email));
  } catch (e) {
    return errorResponse(e);
  }
}
