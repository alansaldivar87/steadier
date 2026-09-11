import { z } from 'zod';
import { requireMember, sameOrigin, jsonBody, errorResponse } from '@/lib/access';
import {
  aiSettingsSchema,
  listModels,
  providerNames,
  publicAiConfig,
  saveAiConfig,
  saveDocumentAiConfig,
  documentAiSchema,
} from '@/lib/ai/config';
export async function GET() {
  try {
    await requireMember();
    return Response.json(await publicAiConfig(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const member = await requireMember();
    const body = await jsonBody(request);
    const key = z.string().trim().min(10).max(1000).optional();
    if (body.action === 'document') {
      const input = documentAiSchema
        .extend({ apiKey: key, revision: z.number().int().min(0) })
        .parse(body);
      return Response.json(await saveDocumentAiConfig(input, member.email), {
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    if (body.action === 'models') {
      const input = z.object({ provider: z.enum(providerNames), apiKey: key }).parse(body);
      return Response.json(await listModels(input.provider, input.apiKey), {
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    const input = aiSettingsSchema
      .extend({ apiKey: key, revision: z.number().int().min(0) })
      .parse(body);
    return Response.json(await saveAiConfig(input, member.email), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
