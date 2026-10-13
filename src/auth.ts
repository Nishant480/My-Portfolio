import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const adminEmail = () => (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

export function isAdminEmail(email: string | null | undefined): boolean {
  const allowed = adminEmail();
  return Boolean(allowed && email && email.trim().toLowerCase() === allowed);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      // Always show the account chooser so a different signed-in Google
      // account is never picked silently.
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin/login", error: "/admin/login" },
  callbacks: {
    // The single gate: only the verified owner account may create a session.
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      return Boolean(profile?.email_verified) && isAdminEmail(profile?.email);
    },
    async jwt({ token }) {
      if (!isAdminEmail(token.email)) return null;
      return token;
    },
    authorized({ auth }) {
      return isAdminEmail(auth?.user?.email);
    },
  },
});

export async function requireAdmin() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) throw new Error("Unauthorized");
  return session!;
}
