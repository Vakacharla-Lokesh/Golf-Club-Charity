---
name: golf-charity-instructions
description: "Senior full-stack developer guidelines for Golf Charity Subscription Platform. Use when: building features, designing components, implementing APIs, or writing database code. Applies to: all code changes across the project."
applyTo: "**"
---

# Golf Charity Subscription Platform — Developer Guidelines

You are a **senior full-stack developer** building a golf charity subscription platform. Follow best practices for **Next.js 14+**, **Supabase/PostgreSQL**, **Stripe payments**, and **Vercel deployment** while maintaining **modular, scalable architecture** and **modern, clean UI**.

---

## Project Stack (Locked)

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | Next.js 14+ (App Router) | TypeScript, Tailwind CSS, SSR |
| **Backend** | Next.js API Routes | `/app/api` directory |
| **Database** | Supabase (PostgreSQL) | Row-Level Security (RLS) enforced |
| **Auth** | Supabase Auth | JWT-based sessions, email/password |
| **Payments** | Stripe (Test Mode) | Webhooks, subscriptions, checkout |
| **Deployment** | Vercel | Connected to this repo, auto-deploy main branch |

---

## Code Organization & Modularity

### Directory Structure (Enforce This)

```
golf-charity/
├── app/
│   ├── (auth)/          # Auth pages: login, signup (not protected)
│   ├── (protected)/     # Protected routes: middleware checks auth
│   │   ├── dashboard/
│   │   ├── charities/
│   │   └── admin/
│   ├── api/             # API routes by domain, not flat
│   │   ├── auth/
│   │   ├── scores/
│   │   ├── stripe/
│   │   ├── webhooks/
│   │   └── admin/
│   ├── layout.tsx
│   └── page.tsx         # Homepage
├── components/          # Reusable, composition-first
│   ├── common/          # Used everywhere (Header, Footer, Modal, etc.)
│   ├── dashboard/       # Dashboard-specific components
│   ├── admin/           # Admin-specific components
│   ├── forms/           # Form components (reusable input, wrappers)
│   └── ui/              # Base UI components (Button, Input, Card, etc.)
├── lib/
│   ├── auth.ts          # Auth helpers (session, middleware, RLS context)
│   ├── db.ts            # Supabase client initialization
│   ├── stripe.ts        # Stripe helpers (checkout, webhooks)
│   ├── hooks.ts         # Custom React hooks (useAuth, useUser, etc.)
│   ├── validators.ts    # Input validation schemas (Zod/Yup)
│   ├── constants.ts     # Magic numbers, enum values
│   ├── types.ts         # TypeScript interfaces for domain entities
│   ├── draw-engine.ts   # Draw logic (pure functions, no side effects)
│   └── utils.ts         # General utilities
├── styles/
│   └── globals.css      # Tailwind config + global overrides
├── middleware.ts        # Next.js middleware for auth/RBAC
├── .env.local           # Environment variables (Supabase keys, Stripe keys, etc.)
└── public/              # Static assets (images, icons)
```

### Component Design (Composition Over Inheritance)

- **One component per file** — no nested component definitions
- **Props over context** for local state — context only for auth/user/theme
- **Render props or children** for flexibility
- **Styled with Tailwind** — no CSS files unless global
- **TypeScript props interfaces** — strict typing always

```typescript
// ✅ GOOD: Focused, reusable, type-safe
interface ScoreInputProps {
  defaultValue?: number;
  onSubmit: (score: number) => Promise<void>;
  isLoading?: boolean;
}

export function ScoreInput({ defaultValue, onSubmit, isLoading }: ScoreInputProps) {
  // ...
}

// ❌ AVOID: Overly complex, mixed concerns
export function Dashboard({ userId, admin = false, onUpdate, theme, showModal, ... }) {
  // ...
}
```

---

## Database Best Practices

### Schema & RLS

- **Every table has Row-Level Security (RLS) enforced** — no exceptions
- **RLS policies are explicit**:
  - Users can read/write only their own rows (identity-based)
  - Admins bypass RLS via a role check
  - Service account (for webhooks) uses `anon` role with precise scopes

```sql
-- Example: RLS policy on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Query Patterns

- **Use Supabase JS client** (`@supabase/supabase-js`) for queries
- **Server-side queries in API routes only** — never expose raw queries to client
- **Parameterized queries always** — Supabase client handles this
- **Fetch only needed columns** — `.select('id, name, created_at')`
- **Use `.with()` for simple joins** — don't over-fetch related data

```typescript
// ✅ GOOD: Efficient, parameterized, server-side
const { data, error } = await supabase
  .from('user_profiles')
  .select('id, full_name, subscription_status')
  .eq('auth_user_id', userId);

// ❌ AVOID: Client-side queries, inefficient
const allUsers = await db.query('SELECT * FROM user_profiles'); // ❌
```

### Migrations & Seed Data

- **Run schema SQL in Supabase SQL editor** (for now — MVP phase)
- **Seed charities + test data** in a separate SQL file
- **Document all triggers** (e.g., profile creation on new auth user)

---

## Authentication & Authorization

### Auth Flow

1. **Signup/Login** → Supabase Auth handles email/password
2. **Profile Creation** → Auto-created via Supabase trigger or POST `/api/auth/callback`
3. **Session Management** → Middleware validates JWT token; Supabase client refreshes automatically
4. **Protected Routes** → Middleware redirects unauthenticated users to `/login`

### Middleware Pattern

```typescript
// middleware.ts — protect routes by prefix
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();

  // Protect /dashboard, /admin routes
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

### Admin Check

- **Small MVP**: Hardcoded admin emails in `.env.local`
- **Later**: Add `is_admin` boolean on `user_profiles` table

```typescript
// lib/auth.ts
export function isAdmin(userEmail: string): boolean {
  const admins = (process.env.ADMIN_EMAILS || '').split(',');
  return admins.includes(userEmail);
}
```

---

## API Route Design

### Conventions

- **Group by domain** — `/api/scores/*`, `/api/stripe/*`, `/api/admin/*`
- **RESTful naming** — POST for create, PUT/PATCH for update, DELETE for delete, GET for read
- **Input validation first** — validate request body before DB queries
- **Error responses with status codes** — 400 for validation, 401 for auth, 500 for server error
- **Type-safe responses** — define response shape as TypeScript interface

```typescript
// api/scores/submit.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ScoreSchema = z.object({
  score: z.number().int().min(1).max(45),
  playedAt: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { score, playedAt } = ScoreSchema.parse(body);

    const session = await getSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Insert into DB
    const { data, error } = await supabase
      .from('golf_scores')
      .insert({ user_id: session.user.id, score, played_at: playedAt });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

---

## UI/UX Standards

### Design System (Tailwind)

- **Color palette**: Use Tailwind's default (blue, red, green, gray) — no custom colors unless required
- **Spacing scale**: Always use scale steps (4, 8, 12, 16, 24, 32) — no arbitrary values
- **Responsive**: Mobile-first — `sm:`, `md:`, `lg:` prefixes
- **Accessibility**: Semantic HTML (`<button>`, `<label>`, `<form>`), ARIA labels where needed

### Component Library (Reusable UI)

Create base components in `components/ui/`:

- **Button** — primary, secondary, danger variants
- **Input** — text, email, number with validation feedback
- **Card** — container with padding and border
- **Modal/Dialog** — for confirmations, forms
- **Toast/Alert** — success, error, warning notifications
- **Badge** — subscription status, match type labels
- **Spinner/Skeleton** — loading states

```typescript
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export function Button({ variant = 'primary', isLoading, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      className={`px-4 py-2 rounded font-medium transition ${variants[variant]} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={isLoading}
      {...props}
    />
  );
}
```

### Layout & Patterns

- **Consistent spacing** — use `gap-*` for flex/grid layouts
- **Loading states** — show skeletons or spinners during async operations
- **Error states** — display error messages in toasts or inline forms
- **Empty states** — show helpful messages when lists are empty
- **Pagination** — for large lists (scores, users, results)

---

## Testing & Quality

### Validation

- **Input validation on all forms** — use Zod schemas
- **Server-side validation repeats client validation** — never trust client
- **Error messages are user-friendly** — "Please enter a score between 1 and 45" not "VALIDATION_ERROR"

### Error Handling

- **Try-catch for async operations** — don't let errors bubble silently
- **Log errors to console (development) and monitoring tool (production)**
- **User-facing errors are generic** — "Something went wrong. Please try again later." — don't leak stack traces

### Performance

- **Lazy-load heavy components** — `next/dynamic` for below-the-fold sections
- **Use `useMemo` and `useCallback`** for expensive calculations, not preemptively
- **Image optimization** — use `next/image` component, never raw `<img>`
- **API routes cache headers** — set `Cache-Control` to `no-store` for user data, `public, max-age=3600` for public data

---

## Payments & Webhooks (Stripe)

### Checkout Flow

1. User clicks "Subscribe"
2. POST `/api/stripe/create-checkout` → returns Stripe Checkout session URL
3. User redirected to Stripe Checkout (hosted)
4. User completes payment → redirects to `/dashboard` with session ID in URL
5. Webhook `/api/webhooks/stripe` receives `checkout.session.completed` event
6. Update `subscriptions` and `user_profiles` tables with new status

### Webhook Security

- **Verify webhook signature** using Stripe secret
- **Idempotent** — webhook handler must be safe to call multiple times
- **No blocking operations** — return 200 immediately, process async if needed

```typescript
// api/webhooks/stripe.ts
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle event types
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    // Update subscription status in DB
  }

  return NextResponse.json({ received: true });
}
```

---

## Environment Variables

Set in `.env.local` (development) and Vercel dashboard (production):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Admin
ADMIN_EMAILS=admin@example.com

# Base URL (for Stripe redirects, etc.)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Common Patterns & Rules

### ✅ DO

- Type everything — no `any` types
- Use `const` by default, `let` only when reassignment is needed
- Extract constants to `lib/constants.ts` — don't hardcode magic numbers
- Use `useSuspense` pattern for data fetching (Next.js 14+)
- Document complex functions with JSDoc comments
- Name event handlers as `onAction` — `onClick`, `onSubmit`, `onClose`
- State management with React hooks — use `useState`, `useReducer`; no Redux for MVP

### ❌ AVOID

- `any` types — use `unknown` or proper types
- Inline styles — use Tailwind classes
- Default exports from utility functions — use named exports
- Prop drilling beyond 2-3 levels — use context or composition
- `<div className="...">` for every container — create reusable wrapper components
- Hardcoded strings/numbers — extract to constants
- Client-side database queries — all DB access via API routes
- `var` keyword — use `const`/`let`

---

## Deployment & Environment

### Local Development

```bash
npm install
npm run dev  # Starts dev server on :3000

# Environment setup:
# 1. Copy .env.example to .env.local
# 2. Add Supabase keys and Stripe test keys
# 3. Run `npm run dev`
```

### Production (Vercel)

- Connect GitHub repo to Vercel project
- Set environment variables in Vercel dashboard (mirrors .env.local)
- Auto-deploy on push to `main` branch
- Preview deployments on PRs

---

## Guiding Principles

1. **Ship fast, iterate on feedback** — perfect is enemy of done in a 2-day MVP
2. **Modular code over premature abstraction** — extract patterns after repetition
3. **User experience first** — clean UI, responsive, no 404 errors
4. **Security by default** — RLS on all tables, no raw queries, webhook signatures verified
5. **Type safety** — TypeScript strict mode, Zod validation for runtime
6. **Performance matters** — lazy load, optimize images, cache where sensible

---

## When in Doubt

- Check the **implementation plan** for feature scope and requirements
- Follow **Next.js best practices** (App Router patterns, Server vs Client components)
- Use **Supabase RLS** for authorization, never trust the client
- Ask **"How would a senior dev implement this?"** — favoring readability and maintainability over cleverness
