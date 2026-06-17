import { sendEmail } from "./email";
import { sendSms } from "./sms";

/**
 * Channel-aware notification used by background jobs + confirm-gated sends.
 * Routes to SMS (Twilio) or email (Resend) per the user's chosen channel, with
 * an email fallback if SMS is selected but no phone is on file. channel "none"
 * sends nothing (respects the user's opt-out).
 */
export async function notifyUser(
  user: { email: string; phone?: string | null; channel?: string | null },
  msg: { subject: string; html?: string; text: string },
): Promise<{ sent: boolean; via: "email" | "sms" | "none" }> {
  const channel = user.channel ?? "email";
  if (channel === "none") return { sent: false, via: "none" };

  if (channel === "sms" && user.phone) {
    const r = await sendSms(user.phone, `GloveBox — ${msg.subject}\n\n${msg.text}`);
    return { sent: r.sent, via: "sms" };
  }

  const r = await sendEmail({
    to: user.email,
    subject: msg.subject,
    html: msg.html ?? `<p>${msg.text.replace(/\n/g, "<br>")}</p>`,
    text: msg.text,
  });
  return { sent: r.sent, via: "email" };
}
