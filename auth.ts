import NextAuth from "next-auth";
import type { EmailConfig } from "next-auth/providers/email";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db/client";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";
import { sendMagicLink } from "@/lib/integrations/email";

// Custom magic-link provider. Defined directly (rather than via the Nodemailer
// factory, which requires an SMTP server) so it works with Resend OR the
// console dev transport — see lib/integrations/email.ts.
const emailProvider: EmailConfig = {
  id: "email",
  type: "email",
  name: "Email",
  from: process.env.EMAIL_FROM ?? "GloveBox <login@glovebox.local>",
  maxAge: 60 * 60, // magic link valid 60 minutes
  options: {},
  sendVerificationRequest: async ({ identifier, url }) => {
    await sendMagicLink(identifier, url);
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  trustHost: true,
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-email",
    error: "/signin",
  },
  providers: [emailProvider],
  callbacks: {
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
