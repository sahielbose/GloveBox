/**
 * Twilio SMS for reminders/alerts. Sends via the Twilio REST API (no SDK dep)
 * when TWILIO_* creds are set; otherwise logs to the server console (dev), so the
 * 'sms' channel degrades gracefully exactly like email does.
 */
export function smsEnabled(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  );
}

export async function sendSms(
  to: string,
  body: string,
): Promise<{ sent: boolean }> {
  if (!smsEnabled()) {
    console.log(
      `\n──────── [GloveBox dev SMS — not sent, no Twilio creds] ────────\n` +
        `To:   ${to}\n${body}\n────────────────────────────────────────────────────────────────\n`,
    );
    return { sent: false };
  }
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: process.env.TWILIO_FROM_NUMBER!,
          To: to,
          Body: body.slice(0, 1500),
        }),
      },
    );
    return { sent: res.ok };
  } catch {
    return { sent: false };
  }
}
