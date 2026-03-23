import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { email, companyName, roleName, inviterName, inviterEmail } = await req.json();

    const clientId = Deno.env.get('AZURE_CLIENT_ID');
    const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET');
    const tenantId = Deno.env.get('AZURE_TENANT_ID');
    const senderEmail = Deno.env.get('SENDER_EMAIL'); // mailbox UPN: tgradinar@mesartim.cz
    const appUrl = Deno.env.get('APP_URL'); // https://beta.app.g-track.eu

    // Get Azure AD token
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
        }),
      }
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return Response.json({ error: 'Failed to get Azure token', details: tokenData }, { status: 500 });
    }

    // Send email via Graph API
    // NOTE: URL uses senderEmail (mailbox UPN), but "from" in body uses alias noreply@g-track.eu
    const sendRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject: `You've been invited to join ${companyName} on G-Track`,
            from: {
              emailAddress: { name: 'G-Track', address: 'noreply@g-track.eu' }
            },
            body: {
              contentType: 'HTML',
              content: buildEmailHtml(companyName, roleName, inviterName, inviterEmail, appUrl),
            },
            toRecipients: [{ emailAddress: { address: email } }],
          },
        }),
      }
    );

    if (!sendRes.ok) {
      const err = await sendRes.text();
      return Response.json({ error: 'Graph API error', details: err }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildEmailHtml(companyName, roleName, inviterName, inviterEmail, appUrl) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background-color:#1e3a5f;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:0.5px;">G-Track</h1>
          <p style="margin:4px 0 0;color:#94b8d4;font-size:13px;">Transport Management System</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 16px;color:#1e3a5f;font-size:22px;">You're invited!</h2>
          <p style="margin:0 0 24px;color:#4a5568;font-size:15px;line-height:1.6;">
            <strong>${inviterName}</strong> (${inviterEmail}) has invited you to join
            <strong>${companyName}</strong> as <strong>${roleName}</strong>.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;"><tr><td>
            <a href="${appUrl}" target="_blank" style="display:inline-block;background-color:#22c55e;color:#ffffff;font-size:16px;font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none;">
              Accept Invitation →
            </a>
          </td></tr></table>
          <p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;">
            If you don't have an account yet, you'll be able to create one after clicking the link.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
            G-Track — Transport Management System<br>
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}