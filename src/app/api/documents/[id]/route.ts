import { requireMember, sameOrigin, errorResponse } from '@/lib/access';
import { getRecord } from '@/lib/db';
import { DocumentRecord } from '@/lib/domain';
import { loadFile } from '@/lib/storage';
import { processDocument } from '@/lib/documents';
export const maxDuration = 60;
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMember();
    const { id } = await params;
    const doc = await getRecord<DocumentRecord>(id);
    if (!doc || doc.recordKind !== 'document') throw new Error('Document not found.');
    const bytes = await loadFile(doc.storageKey);
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': doc.mime,
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
        'Cache-Control': 'private, no-store',
        'Content-Security-Policy': 'sandbox',
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    const member = await requireMember();
    return Response.json(await processDocument((await params).id, member.email));
  } catch (e) {
    return errorResponse(e);
  }
}
