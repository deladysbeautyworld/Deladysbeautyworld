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
Payments use KoraPay Checkout Standard. The frontend uses the public key to open checkout, and `api/verify-korapay.js` verifies the transaction with the server-only secret key before an order is finalized.

The migration `supabase/migrations/20260929064943_switch_payment_provider_to_korapay.sql` updates the order payment method and `finalize_order` function. Apply it to the Supabase project before deploying the new checkout code.

## 📦 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. Add the variables from `.env.example` to the Vercel project settings. Set `VITE_KORAPAY_PUBLIC_KEY` for the frontend build and `KORAPAY_SECRET_KEY` as a server environment variable.
3. Deploy.

## 📁 Project Structure
- `src/components`: UI components divided by domain (home, layout, shop).
- `src/pages`: Main view components.
- `src/stores`: Zustand stores for global state (auth, cart).
- `src/utils`: Shared utilities (Supabase client, SEO helper).
- `api/`: Serverless functions for payment verification and other backend tasks.
