export function allowedEmail(email: unknown, allowlist = process.env.ALLOWED_EMAILS || '') {
  if (typeof email !== 'string') return false;
  const allowed = allowlist
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.length > 0 && allowed.length <= 2 && allowed.includes(email.toLowerCase());
}
export function localAccess(host: string, env = process.env) {
  return (
    env.NODE_ENV === 'development' &&
    env.LOCAL_ACCESS === 'true' &&
    !env.VERCEL &&
    /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)
  );
}
