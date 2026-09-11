import { signIn } from '@/auth';
export const dynamic = 'force-dynamic';
export default function Login() {
  const configured = !!(
    process.env.AUTH_GOOGLE_ID &&
    process.env.AUTH_GOOGLE_SECRET &&
    process.env.AUTH_SECRET &&
    process.env.ALLOWED_EMAILS
  );
  return (
    <div className="login-wrap">
      <div className="login-card">
        <a className="brand" href="/">
          s<span>steadier</span>
          <i>●</i>
        </a>
        <h1>
          Our money.
          <br />A little clearer.
        </h1>
        <p>A shared space to find your footing, make a plan, and build breathing room.</p>
        {configured ? (
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: '/' });
            }}
          >
            <button type="submit">Continue with Google</button>
            <p className="help">
              Only the two approved household accounts can sign in. If access was denied, choose the
              approved Gmail account and try again.
            </p>
          </form>
        ) : (
          <div className="notice">
            Google sign-in is not connected yet. Finish the connection steps in the project’s setup
            guide before using this app from another device.
          </div>
        )}
      </div>
    </div>
  );
}
