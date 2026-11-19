/**
 * Builds the branded Supabase Auth email templates.
 *
 *   node scripts/build-auth-emails.mjs
 *
 * Writes one HTML file per Supabase email type to supabase/templates/.
 * Paste each file into Supabase → Authentication → Emails → Templates,
 * with the subject listed in SUBJECTS below (also in supabase/templates/README.md).
 *
 * Templates use Supabase's Go-template variables ({{ .ConfirmationURL }},
 * {{ .Email }}, {{ .NewEmail }}, {{ .Token }}, {{ .Data.full_name }}), so
 * they must stay as plain strings here — do not interpolate them in JS.
 *
 * Email HTML rules followed: table layout, inline styles, no external CSS,
 * web-safe font fallbacks, a bulletproof (table-cell) button, a plain-text
 * link under every button, and a hidden preheader line.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://www.deladysbeautyworld.com";
const BRAND = {
  pink: "#D90078",
  pinkPale: "#FCECF5",
  navy: "#171332",
  ink: "#28204F",
  muted: "#75697B",
  faint: "#A79AA9",
  border: "#E9D3E0",
  cream: "#FFF9FC",
  page: "#F8F1F5",
};
const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const GREETING =
  "{{ if .Data.full_name }}Hi {{ .Data.full_name }},{{ else }}Hi there,{{ end }}";

function button(label, href) {
  return `
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 8px;">
            <tr>
              <td align="center" bgcolor="${BRAND.pink}" style="border-radius:999px;">
                <a href="${href}" target="_blank" style="display:inline-block;padding:15px 34px;font-family:${SANS};font-size:15px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:999px;">${label}</a>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${BRAND.faint};text-align:center;">
            Button not working? Copy and paste this link into your browser:<br>
            <a href="${href}" target="_blank" style="color:${BRAND.pink};word-break:break-all;">${href}</a>
          </p>`;
}

function codeBlock(token) {
  return `
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px auto 6px;">
            <tr>
              <td align="center" bgcolor="${BRAND.pinkPale}" style="border:1px solid ${BRAND.border};border-radius:14px;padding:16px 30px;">
                <span style="font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:700;letter-spacing:8px;color:${BRAND.navy};">${token}</span>
              </td>
            </tr>
          </table>`;
}

function paragraph(html) {
  return `
          <p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:1.7;color:${BRAND.ink};">${html}</p>`;
}

function layout({ preheader, eyebrow, heading, body, note }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>De Lady's Beauty World</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.page};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${preheader}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.page}" style="background-color:${BRAND.page};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 22px;">
              <a href="${SITE}" target="_blank" style="text-decoration:none;">
                <img src="${SITE}/logo.png" width="76" height="76" alt="De Lady's Beauty World" style="display:block;width:76px;height:76px;border:0;border-radius:50%;background:#ffffff;">
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid ${BRAND.border};border-radius:20px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td height="5" bgcolor="${BRAND.pink}" style="height:5px;line-height:5px;font-size:0;background-color:${BRAND.pink};">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:38px 36px 34px;">
                    <p style="margin:0 0 10px;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:2.4px;text-transform:uppercase;color:${BRAND.pink};text-align:center;">${eyebrow}</p>
                    <h1 style="margin:0 0 24px;font-family:${SERIF};font-size:30px;font-weight:400;line-height:1.25;color:${BRAND.navy};text-align:center;">${heading}</h1>
${body}
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 36px 26px;border-top:1px solid ${BRAND.border};background-color:${BRAND.cream};">
                    <p style="margin:0;font-family:${SANS};font-size:12.5px;line-height:1.65;color:${BRAND.muted};text-align:center;">${note}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:26px 12px 0;">
              <p style="margin:0 0 6px;font-family:${SERIF};font-size:17px;font-style:italic;color:${BRAND.navy};">De Lady's <span style="color:${BRAND.pink};">Beauty World</span></p>
              <p style="margin:0 0 14px;font-family:${SANS};font-size:12px;letter-spacing:0.6px;color:${BRAND.muted};">Makeup &middot; Skincare &middot; Fragrance &mdash; delivered nationwide across Nigeria</p>
              <p style="margin:0;font-family:${SANS};font-size:12px;color:${BRAND.muted};">
                <a href="${SITE}/shop" target="_blank" style="color:${BRAND.pink};text-decoration:none;">Shop</a>
                &nbsp;&middot;&nbsp;
                <a href="${SITE}/journal" target="_blank" style="color:${BRAND.pink};text-decoration:none;">Journal</a>
                &nbsp;&middot;&nbsp;
                <a href="${SITE}/contact" target="_blank" style="color:${BRAND.pink};text-decoration:none;">Contact us</a>
              </p>
              <p style="margin:14px 0 0;font-family:${SANS};font-size:12px;color:${BRAND.muted};">Need help? Email <a href="mailto:support@deladysbeautyworld.com" style="color:${BRAND.pink};text-decoration:none;">support@deladysbeautyworld.com</a> &mdash; please don't reply to this email.</p>
              <p style="margin:12px 0 0;font-family:${SANS};font-size:11px;line-height:1.6;color:${BRAND.faint};">This is an account email about {{ .Email }}. You're receiving it because of an action on deladysbeautyworld.com.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

const IGNORE = "Didn't ask for this? You can safely ignore this email.";

const TEMPLATES = {
  confirmation: {
    subject: "Welcome to De Lady's Beauty World — please confirm your email",
    html: layout({
      preheader: "One quick tap to confirm your email and start shopping.",
      eyebrow: "Members' club",
      heading: "Welcome to De Lady's",
      body:
        paragraph(GREETING) +
        paragraph("Thank you for joining De Lady's Beauty World. Please confirm your email address so you can check out faster, save your favourites and follow your orders.") +
        button("Confirm my email", "{{ .ConfirmationURL }}"),
      note: `${IGNORE} No account will be created unless the email is confirmed.`,
    }),
  },
  invite: {
    subject: "You're invited to De Lady's Beauty World",
    html: layout({
      preheader: "Accept your invitation to set up your account.",
      eyebrow: "You're invited",
      heading: "Join De Lady's Beauty World",
      body:
        paragraph("Hi there,") +
        paragraph("You've been invited to create an account on De Lady's Beauty World. Accept the invitation below to set up your account.") +
        button("Accept invitation", "{{ .ConfirmationURL }}"),
      note: `Not expecting this invitation? ${IGNORE.replace("Didn't ask for this? ", "")}`,
    }),
  },
  magic_link: {
    subject: "Your De Lady's Beauty World sign-in link",
    html: layout({
      preheader: "Your one-time link to sign in.",
      eyebrow: "Sign in",
      heading: "Your sign-in link",
      body:
        paragraph(GREETING) +
        paragraph("Tap the button below to sign in to your De Lady's Beauty World account. For your security, this link expires in 1 hour and can only be used once.") +
        button("Sign in", "{{ .ConfirmationURL }}"),
      note: `${IGNORE} Nobody can sign in without this link.`,
    }),
  },
  email_change: {
    subject: "Confirm your new email address",
    html: layout({
      preheader: "Confirm the change to your account email.",
      eyebrow: "Account update",
      heading: "Confirm your new email",
      body:
        paragraph(GREETING) +
        paragraph("We received a request to change the email on your De Lady's Beauty World account from <strong>{{ .Email }}</strong> to <strong>{{ .NewEmail }}</strong>.") +
        paragraph("Please confirm the change below.") +
        button("Confirm new email", "{{ .ConfirmationURL }}"),
      note: "Didn't ask for this? Don't click the button — your email will stay the same. If you're worried, reset your password from the sign-in page.",
    }),
  },
  recovery: {
    subject: "Reset your De Lady's Beauty World password",
    html: layout({
      preheader: "Choose a new password for your account.",
      eyebrow: "Password reset",
      heading: "Reset your password",
      body:
        paragraph(GREETING) +
        paragraph("We received a request to reset the password for <strong>{{ .Email }}</strong>. Tap the button below to choose a new one. This link expires in 1 hour and can only be used once.") +
        button("Choose a new password", "{{ .ConfirmationURL }}"),
      note: `${IGNORE} Your password won't change unless you choose a new one using the link above.`,
    }),
  },
  reauthentication: {
    subject: "{{ .Token }} is your De Lady's Beauty World verification code",
    html: layout({
      preheader: "Your one-time verification code.",
      eyebrow: "Verification",
      heading: "Confirm it's you",
      body:
        paragraph(GREETING) +
        paragraph("Enter this code to confirm the change you're making to your account:") +
        codeBlock("{{ .Token }}") +
        `
          <p style="margin:12px 0 0;font-family:${SANS};font-size:12.5px;color:${BRAND.faint};text-align:center;">The code can only be used once.</p>`,
      note: `${IGNORE} Never share this code with anyone — De Lady's staff will never ask for it.`,
    }),
  },
};

// Names as they appear in the Supabase dashboard.
const LABELS = {
  confirmation: "Confirm signup",
  invite: "Invite user",
  magic_link: "Magic link",
  email_change: "Change email address",
  recovery: "Reset password",
  reauthentication: "Reauthentication",
};

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "templates");
mkdirSync(outDir, { recursive: true });

for (const [name, { html }] of Object.entries(TEMPLATES)) {
  writeFileSync(join(outDir, `${name}.html`), html);
}

const readme = `# Supabase Auth email templates

Branded versions of the emails Supabase Auth sends. **Generated** by
\`node scripts/build-auth-emails.mjs\` — edit the script, not the HTML.

Apply them in Supabase → Authentication → Emails → Templates. For each
template, set the subject below and paste the matching file as the body.

| Supabase template | File | Subject |
|---|---|---|
${Object.entries(TEMPLATES)
  .map(([name, { subject }]) => `| ${LABELS[name]} | \`${name}.html\` | ${subject} |`)
  .join("\n")}

The logo is loaded from ${SITE}/logo.png, so keep that file in \`public/\`.
`;
writeFileSync(join(outDir, "README.md"), readme);
console.log(`Wrote ${Object.keys(TEMPLATES).length} templates to ${outDir}`);

export { TEMPLATES };
