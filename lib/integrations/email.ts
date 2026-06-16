import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "GloveBox <login@glovebox.local>";

/** True when a real Resend key is configured. Without it, emails log to console. */
export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

let _resend: Resend | null = null;
function client(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  _resend ??= new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Send an email via Resend, or — when no key is configured — log it to the
 * server console (the standard dev transport). Returns whether it actually sent.
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<{ sent: boolean; preview: string }> {
  const text = input.text ?? stripHtml(input.html);
  const c = client();
  if (!c) {
    console.log(
      `\n──────── [GloveBox dev email — not sent, no RESEND_API_KEY] ────────\n` +
        `To:      ${input.to}\nSubject: ${input.subject}\n\n${text}\n` +
        `────────────────────────────────────────────────────────────────────\n`,
    );
    return { sent: false, preview: text };
  }
  await c.emails.send({
    from: FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text,
  });
  return { sent: true, preview: text };
}

/** Magic-link sign-in email (Auth.js sendVerificationRequest). */
export async function sendMagicLink(to: string, url: string): Promise<void> {
  const html = `
  <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1A1714">
    <p style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#8F8B83">GloveBox</p>
    <h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;margin:8px 0 16px">Sign in to GloveBox</h1>
    <p style="font-size:16px;line-height:1.6">Click below to sign in. This link expires in 60 minutes and can be used once.</p>
    <p style="margin:28px 0">
      <a href="${url}" style="background:#8E9B79;color:#0C0B0A;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Sign in →</a>
    </p>
    <p style="font-size:13px;color:#8F8B83">If you didn't request this, you can ignore this email.</p>
  </div>`;
  const text = `Sign in to GloveBox:\n${url}\n\nThis link expires in 60 minutes.`;
  const res = await sendEmail({ to, subject: "Your GloveBox sign-in link", html, text });
  // In dev (no key), surface the link prominently so you can actually sign in.
  if (!res.sent) console.log(`\n🔑 GloveBox magic link for ${to}:\n${url}\n`);
}

function stripHtml(html: string): string {
  return html
    .replace(/<a [^>]*href="([^"]+)"[^>]*>/g, "$1 ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
