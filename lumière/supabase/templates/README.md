# Supabase Auth email templates

Branded versions of the emails Supabase Auth sends. **Generated** by
`node scripts/build-auth-emails.mjs` — edit the script, not the HTML.

Apply them in Supabase → Authentication → Emails → Templates. For each
template, set the subject below and paste the matching file as the body.

| Supabase template | File | Subject |
|---|---|---|
| Confirm signup | `confirmation.html` | Welcome to De Lady's Beauty World — please confirm your email |
| Invite user | `invite.html` | You're invited to De Lady's Beauty World |
| Magic link | `magic_link.html` | Your De Lady's Beauty World sign-in link |
| Change email address | `email_change.html` | Confirm your new email address |
| Reset password | `recovery.html` | Reset your De Lady's Beauty World password |
| Reauthentication | `reauthentication.html` | Your De Lady's Beauty World verification code |

The logo is loaded from https://www.deladysbeautyworld.com/logo.png, so keep that file in `public/`.
