# De Lady's Beauty World 🌸

A luxury beauty e-commerce storefront for skincare, makeup, and fragrance.

## 🚀 Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS 4
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: KoraPay Checkout Standard
- **State Management**: Zustand

## 🛠️ Local Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd lumiere
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Then, fill in your Supabase and KoraPay keys. Use the KoraPay public key in `VITE_KORAPAY_PUBLIC_KEY`; keep `KORAPAY_SECRET_KEY` server-side only.

### 3. Run Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## 🐘 Supabase Configuration

### Database Schema
The project uses several key tables. Ensure these are created in your Supabase project:
- `profiles`: User profiles linked to `auth.users`.
- `products`: Product details, pricing, and stock.
- `categories`: Product categories.
- `orders`: Order history and status.
- `promo_codes`: Discount code management.
- `routines`: Curated beauty routines.
- `posts`: Journal/blog entries.

### Database Functions
The app uses a custom PostgreSQL function `finalize_order` for atomic order creation. See `supabase/sql/202608200001_predeploy_security_checkout.sql` for the implementation.


## 💳 KoraPay Integration
Payments use KoraPay Checkout Standard. The frontend uses the public key to open checkout, and `api/verify-korapay.js` verifies the transaction with the server-only secret key before an order is finalized. The `api/korapay-webhook.js` endpoint independently validates KoraPay's `x-korapay-signature`, verifies successful charges with KoraPay, and marks the matching order as paid in Supabase. Duplicate notifications are safe to process, and notifications received before their order exists receive a retryable response.

The migration `supabase/migrations/20260929064943_switch_payment_provider_to_korapay.sql` updates the order payment method and `finalize_order` function. Apply it to the Supabase project before deploying the new checkout code.

Configure this webhook URL in the KoraPay dashboard:

```text
https://<your-deployed-domain>/api/korapay-webhook
```

Set `KORAPAY_SECRET_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` as server-side environment variables in Vercel. Never use a `VITE_` prefix for the Supabase service role key.

## 📱 Admin Order App

The installable admin app opens at `/admin/orders`; its dedicated login link is `/admin/login`. Only accounts with the existing admin role can access order information. Sign in on each phone or computer and enable alerts on each device. Push notifications say only “New order received”; tapping one opens the order after admin sign-in. Alerts are sent to registered devices even when the admin panel is closed.

On Android, open the admin link in Chrome and use **Install app** or **Add to Home screen**. On iPhone, open it in Safari, use **Share → Add to Home Screen**, then launch the installed app before enabling notifications. iPhone web push requires iOS/iPadOS 16.4 or later.

### Push notification setup

1. Generate one VAPID key pair locally with `node -e "console.log(require('web-push').generateVAPIDKeys())"`. Keep the private key secret. Set the generated public key as both `VITE_ADMIN_PUSH_PUBLIC_KEY` (frontend build variable) and `VAPID_PUBLIC_KEY` (server variable); set the generated private key as `VAPID_PRIVATE_KEY`.
2. Create a long random shared secret locally (for example, with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`). Set it as `ADMIN_PUSH_WEBHOOK_SECRET` in Vercel.
3. Deploy the app. In Supabase SQL Editor, enable Vault if it is not already enabled, then save the deployed notify endpoint URL and the same shared secret into Vault:

   ```sql
   create extension if not exists supabase_vault with schema vault;

   select vault.create_secret(
     'https://<your-deployed-domain>/api/admin-push-notify',
     'admin_push_webhook_url'
   );
   select vault.create_secret(
     '<same random shared secret as ADMIN_PUSH_WEBHOOK_SECRET>',
     'admin_push_webhook_secret'
   );
   ```

   Keep the secret out of source control and do not paste it into chat.
4. Apply `supabase/migrations/202610030001_admin_order_push_notifications.sql` to the Supabase project. It creates a private device-subscription table and an order-insert trigger that calls the Vercel push endpoint.
5. Open `/admin/orders` on each device and tap **Enable alerts**. Push permission is per device/browser; enabling it on one device does not enable it on the others.

The push endpoint uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` already required by the KoraPay webhook. Store `VAPID_PRIVATE_KEY` and `ADMIN_PUSH_WEBHOOK_SECRET` only as server-side secrets in Vercel and Supabase Vault.

## 📦 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. Add the required variables from `.env.example` to the Vercel project settings. Set `VITE_KORAPAY_PUBLIC_KEY` and `VITE_ADMIN_PUSH_PUBLIC_KEY` for the frontend build. Set `KORAPAY_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and `ADMIN_PUSH_WEBHOOK_SECRET` as server environment variables.
3. Deploy, then configure `https://<your-deployed-domain>/api/korapay-webhook` in the KoraPay dashboard's API Configuration settings.

## 📈 Load Testing

The k6 script under `tests/k6/storefront.js` runs a read-only production test against the homepage and shop page, ramping to 20 virtual users for 90 seconds before ramping down (2 minutes total). It does not place orders or call payment endpoints. The POS API product-list request is included only when both `POS_API_URL` and `POS_API_KEY` are provided.

Install k6, then run the storefront-only test:

```powershell
npm run loadtest:k6
```

To include the product-list API, set its URL and API key in the current PowerShell session before running k6. Do not commit API keys or put them in source files:

```powershell
$env:POS_API_URL = "https://delady-api-production.up.railway.app/api"
$env:POS_API_KEY = Read-Host "POS API key"
npm run loadtest:k6
```

You can override the website target with `$env:BASE_URL`. Start with this conservative profile and only increase load after reviewing the results and confirming the services remain healthy.

## 📁 Project Structure
- `src/components`: UI components divided by domain (home, layout, shop).
- `src/pages`: Main view components.
- `src/stores`: Zustand stores for global state (auth, cart).
- `src/utils`: Shared utilities (Supabase client, SEO helper).
- `api/`: Serverless functions for payment verification and other backend tasks.
