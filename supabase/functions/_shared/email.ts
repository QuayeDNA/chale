function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function waitlistConfirmationEmail(confirmUrl: string): { html: string; text: string } {
  const href = escapeHtml(confirmUrl);
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#fbf3df;color:#2b1a0f;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf3df;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff9e8;border:1px solid #ede0be;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:36px 32px 8px;">
                <p style="margin:0 0 24px;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8a7562;">Chale beta</p>
                <h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;font-family:Georgia,serif;font-weight:700;">One click and you're in.</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#5f4a38;">Confirm your email so we can save your spot for the Android beta. Then bring your person.</p>
                <p style="margin:0 0 28px;">
                  <a href="${href}" style="display:inline-block;padding:15px 24px;border-radius:999px;background:#f5b400;color:#2b1a0f;font-size:16px;font-weight:700;text-decoration:none;">Confirm my email</a>
                </p>
                <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#8a7562;">This link expires in 48 hours. If you didn't ask to join, you can ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px;border-top:1px solid #ede0be;">
                <p style="margin:0;font-size:13px;line-height:1.5;color:#8a7562;">Chale - better questions, deeper chats.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "Confirm you're in.",
    '',
    'Confirm your email so we can save your spot for the Chale Android beta:',
    confirmUrl,
    '',
    'This link expires in 48 hours. If you did not ask to join, you can ignore this email.',
    '',
    'Chale - better questions, deeper chats.',
  ].join('\n');

  return { html, text };
}

export async function sendWaitlistConfirmation(to: string, confirmUrl: string): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('WAITLIST_FROM_EMAIL');
  if (!apiKey) throw new Error('resend_not_configured');
  if (!from) throw new Error('waitlist_from_not_configured');

  const { html, text } = waitlistConfirmationEmail(confirmUrl);
  const payload: Record<string, unknown> = {
    from,
    to: [to],
    subject: "Confirm you're in - Chale beta",
    html,
    text,
  };

  const replyTo = Deno.env.get('WAITLIST_REPLY_TO');
  if (replyTo) payload.reply_to = replyTo;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('resend send failed', res.status, detail.slice(0, 500));
    throw new Error(`resend_${res.status}`);
  }
}
