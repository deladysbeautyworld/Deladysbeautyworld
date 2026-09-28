# De Lady's Beauty World 🌸

A luxury beauty e-commerce storefront for skincare, makeup, and fragrance.

## 🚀 Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS 4
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Paystack
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
Then, fill in your keys from the Supabase and Paystack dashboards.

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


## 💳 Paystack Integration
Payments are handled via Paystack's inline JS.
- **Public Key**: Used in the frontend for the payment popup.
- **Secret Key**: Used in the `api/verify-paystack.js` serverless function to verify transactions.

## 📦 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. Add the environment variables from `.env.example` to the Vercel project settings.
3. Deploy.

## 📁 Project Structure
- `src/components`: UI components divided by domain (home, layout, shop).
- `src/pages`: Main view components.
- `src/stores`: Zustand stores for global state (auth, cart).
- `src/utils`: Shared utilities (Supabase client, SEO helper).
- `api/`: Serverless functions for payment verification and other backend tasks.
