import { z } from 'zod';
import { requireMember, sameOrigin, jsonBody, errorResponse } from '@/lib/access';
import { saveEntity, removeRecord } from '@/lib/db';
import { schemas, type RecordKind } from '@/lib/domain';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const member = await requireMember();
    const input = z
      .object({
        kind: z.enum(Object.keys(schemas) as [RecordKind, ...RecordKind[]]),
        data: z.unknown(),
        id: z.string().max(100).optional(),
        revision: z.number().int().optional(),
        requestId: z.string().uuid().optional(),
      })
      .parse(await jsonBody(request));
    const id = input.kind === 'settings' ? 'settings' : input.id;
    const result = await saveEntity(input.kind, input.data, member.email, {
      id,
      revision: input.revision,
      uniqueKey: !id && input.requestId ? 'request:' + input.requestId : undefined,
    });
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const member = await requireMember();
    const input = z
      .object({ id: z.string(), revision: z.number().int() })
      .parse(await jsonBody(request));
    await removeRecord(input.id, input.revision, member.email);
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
