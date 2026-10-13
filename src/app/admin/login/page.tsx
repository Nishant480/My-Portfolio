import { redirect } from "next/navigation";
import { auth, isAdminEmail } from "@/auth";
import { signInAction } from "../actions";

const messages: Record<string, string> = {
  AccessDenied: "That Google account isn't allowed in. Only the site owner can sign in.",
  Configuration: "Sign-in isn't configured yet. Check the AUTH_* and ADMIN_EMAIL settings.",
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const session = await auth();
  if (isAdminEmail(session?.user?.email)) redirect("/admin");
  const { error } = await searchParams;
  const message = typeof error === "string" ? (messages[error] ?? "Sign-in failed. Please try again.") : null;

  return (
    <main className="login">
      <div className="login-card">
        <div className="login-lock" aria-hidden>
          🔒
        </div>
        <h1>Owner access only</h1>
        <p>This panel controls everything on the site. Sign in with the owner&apos;s Google account to continue.</p>
        {message && <p className="login-error">{message}</p>}
        <form action={signInAction}>
          <button className="g-btn" type="submit">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Continue with Google
          </button>
        </form>
        <a className="login-back" href="/">
          ← Back to the site
        </a>
      </div>
    </main>
  );
}
