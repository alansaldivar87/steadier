import { auth } from '@/auth';
import { headers } from 'next/headers';
import { allowedEmail, localAccess } from './auth-policy';
export class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function requireMember() {
  const h = await headers();
  if (localAccess(h.get('host') || ''))
    return { email: 'local@steadier.test', name: 'Local household', local: true };
  const session = await auth();
  if (!session?.user?.email || !allowedEmail(session.user.email))
    throw new HttpError('Sign in with an approved household Google account.', 401);
  return { email: session.user.email, name: session.user.name || 'Household member', local: false };
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  // Next may construct request.url using an internal localhost origin. Host is
  // the browser-facing authority; production uses the configured public URL.
  const url = new URL(request.url);
  const expected = process.env.AUTH_URL
    ? new URL(process.env.AUTH_URL).origin
    : `${url.protocol}//${request.headers.get('host') || url.host}`;
  if (!origin || origin !== expected)
    throw new HttpError('Open the app and try this action again.', 403);
}
export async function jsonBody(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 100000)
    throw new HttpError('This entry is too long.', 413);
  const body = await request.text();
  if (body.length > 100000) throw new HttpError('This entry is too long.', 413);
  return JSON.parse(body);
}
export function errorResponse(error: unknown) {
  let status = error instanceof HttpError ? error.status : 400;
  let message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  if (message.includes('SQLITE_CONSTRAINT') || message.includes('UNIQUE constraint')) {
    message = 'This item has already been saved. Refresh to see it.';
    status = 409;
  }
  if (message.length > 600)
    message =
      'Some fields are missing or invalid. Check the dates, amounts, and selected accounts.';
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}
