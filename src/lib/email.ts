// Transcript delivery email (TASK-030). A Resend failure never blocks the
// capture — the email address is already stored and the in-page unlock
// already works, so this is best-effort and swallows its own errors.
import { Resend } from "resend";

// ponytail: one same-request retry, not a durable DO-alarm queue — a second
// Durable Object just to redeliver a best-effort email is disproportionate at
// this scale. Upgrade to an alarm-backed retry queue if delivery rate matters.
async function sendWithRetry(apiKey: string, payload: { to: string; subject: string; text: string }): Promise<boolean> {
  const resend = new Resend(apiKey);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { error } = await resend.emails.send({ from: "MCP Audit <audits@mcpaudit.dev>", ...payload });
      if (!error) return true;
    } catch {
      // fall through to retry
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

export async function sendTranscriptEmail(apiKey: string, to: string, reportUrl: string): Promise<boolean> {
  return sendWithRetry(apiKey, {
    to,
    subject: "Your MCP Audit transcripts",
    text: `Transcripts sent. Every query we ran and what Claude picked, per tool.\n\n${reportUrl}`,
  });
}

// Founder notification on a paid tune-up order (TASK-032). Best-effort — the
// order row is already stored regardless of whether this send succeeds.
export async function sendTuneUpOrderEmail(
  apiKey: string,
  founderEmail: string,
  buyerEmail: string,
  reportUrl: string,
): Promise<boolean> {
  return sendWithRetry(apiKey, {
    to: founderEmail,
    subject: "Tune-up ordered",
    text: `${buyerEmail} ordered a tune-up.\n\nReport: ${reportUrl}`,
  });
}
