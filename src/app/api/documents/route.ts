import { requireMember, sameOrigin, errorResponse, HttpError } from '@/lib/access';
import { uploadDocument } from '@/lib/documents';
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const member = await requireMember();
    if (Number(request.headers.get('content-length') || 0) > 4.4 * 1024 * 1024)
      throw new HttpError('Choose a file smaller than 4 MB.', 413);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new Error('Choose a document or photo.');
    const accountId = String(form.get('accountId') || '') || null;
    return Response.json(
      await uploadDocument(
        new Uint8Array(await file.arrayBuffer()),
        file.name,
        member.email,
        accountId,
      ),
    );
  } catch (e) {
    return errorResponse(e);
  }
}
