# Golf Charity Subscription Platform — 2-Day Implementation Plan

> **Verdict: Yes, you can do this in 2 days — but only if you scope it ruthlessly.**
> The PRD is comprehensive, but for a selection process they're evaluating *your architecture decisions and code quality*, not a production-ready SaaS. Build a working, demo-able system — not a polished product.

---

## Stack Decision (Lock this in before you start)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) | SSR, easy Vercel deploy, you know it |
| Backend | Next.js API Routes | No separate server setup, faster dev |
| Database | Supabase (PostgreSQL) | Required by PRD, has auth built-in |
| Auth | Supabase Auth | JWT-based, handles sessions |
| Payments | Stripe (Test Mode) | Required by PRD |
| Deployment | Vercel | Required by PRD |

---

## Database Schema (Design this first — everything depends on it)

```sql
-- users (extended from Supabase auth.users)
profiles: id, full_name, subscription_status, subscription_plan, 
          charity_id, charity_percentage, stripe_customer_id, created_at

-- charities
charities: id, name, description, image_url, is_featured, is_active, created_at

-- golf_scores
scores: id, user_id, score (1-45), played_at (date), created_at
-- Only 5 per user — enforce via trigger or app logic

-- draws
draws: id, draw_date, status (draft|simulated|published), 
       winning_numbers (int[5]), draw_type (random|algorithmic), created_at

-- draw_entries (snapshot of user scores at draw time)
draw_entries: id, draw_id, user_id, scores (int[5])

-- draw_results
draw_results: id, draw_id, user_id, match_type (3|4|5), 
              prize_amount, payment_status (pending|paid), proof_url

-- prize_pools
prize_pools: id, draw_id, tier_5 (decimal), tier_4 (decimal), 
             tier_3 (decimal), jackpot_rollover (decimal)

-- subscriptions
subscriptions: id, user_id, plan (monthly|yearly), amount, 
               status (active|cancelled|lapsed), stripe_subscription_id,
               current_period_end, created_at
```

---

## Day 1 — Foundation + Core Features (10–12 hours)

### Morning Block (4 hours): Setup + Auth + DB

**Hour 1 — Project Setup**
- [ ] `npx create-next-app@latest golf-charity --typescript --tailwind --app`
- [ ] Connect to new Supabase project (fresh, not personal — PRD requirement)
- [ ] Set up new Vercel project (fresh account — PRD requirement)
- [ ] Configure `.env.local`: Supabase URL/keys, Stripe keys
- [ ] Push initial deploy to verify pipeline works

**Hour 2 — Database**
- [ ] Run schema SQL in Supabase SQL editor
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Write RLS policies: users can only read/write their own data; admins bypass all
- [ ] Seed 3–4 charity records for demo

**Hours 3–4 — Auth**
- [ ] Supabase Auth: email/password signup + login
- [ ] Create `/app/(auth)/login` and `/app/(auth)/signup` pages
- [ ] Middleware to protect `/dashboard` and `/admin` routes
- [ ] Profile creation trigger: on new user → insert into `profiles`
- [ ] Test: signup → redirect to dashboard, unauthenticated → redirect to login

---

### Midday Block (4 hours): Subscription + Score System

**Hours 5–6 — Stripe Subscriptions**
- [ ] Create Stripe products: Monthly (₹X) and Yearly (₹X discounted)
- [ ] `/api/stripe/create-checkout` — creates Stripe Checkout session
- [ ] `/api/webhooks/stripe` — handles `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] Webhook updates `subscriptions` and `profiles` tables
- [ ] Subscription gate: middleware checks `subscription_status === 'active'` on dashboard routes
- [ ] Test full flow: subscribe → webhook fires → status updates in DB

**Hours 7–8 — Score Entry System**
- [ ] Score entry form: 5 inputs (score 1–45, date picker each)
- [ ] `/api/scores/upsert` endpoint:
  - Validates range (1–45)
  - Fetches current scores sorted by `played_at` ASC
  - If count < 5: insert new score
  - If count = 5: delete oldest, insert new (rolling window)
- [ ] Score display component: reverse chronological order
- [ ] Test edge cases: adding a 6th score replaces oldest

---

### Evening Block (3–4 hours): User Dashboard + Charity System

**Hours 9–10 — User Dashboard**

Build the complete dashboard page at `/dashboard` with:
- [ ] Subscription status card (active/inactive, renewal date from Stripe)
- [ ] Score entry + edit interface
- [ ] Charity selector (dropdown from charities table)
- [ ] Charity contribution slider (min 10%, default 10%, user-adjustable)
- [ ] Participation summary (placeholder if no draws yet)
- [ ] Winnings overview (empty state for now)

**Hours 11–12 — Charity Pages**
- [ ] `/charities` — listing page with search + filter (by name/category)
- [ ] `/charities/[id]` — individual charity profile (name, description, image)
- [ ] Featured charity section: query `is_featured = true` for homepage
- [ ] Homepage (`/`) — hero section: what you do, how you win, charity impact, Subscribe CTA

---

## Day 2 — Draw Engine + Admin + Polish (10–12 hours)

### Morning Block (4 hours): Draw Engine

**Hours 1–2 — Draw Logic Core**

Write the draw engine as a pure function first (easier to test):

```typescript
// lib/draw-engine.ts

// Random draw: generates 5 numbers from 1-45
function generateRandomDraw(): number[] {
  const nums = new Set<number>();
  while (nums.size < 5) nums.add(Math.floor(Math.random() * 45) + 1);
  return [...nums].sort((a, b) => a - b);
}

// Algorithmic draw: weighted by frequency of user scores
// Most frequent scores have LOWER weight (harder to match = bigger prize pool incentive)
function generateAlgorithmicDraw(allUserScores: number[]): number[] {
  const freq: Record<number, number> = {};
  allUserScores.forEach(s => freq[s] = (freq[s] || 0) + 1);
  // Build weighted pool — less frequent = more likely to be drawn
  // ... implementation
}

// Match checker
function checkMatch(userScores: number[], drawNumbers: number[]): 3 | 4 | 5 | null {
  const matches = userScores.filter(s => drawNumbers.includes(s)).length;
  if (matches >= 5) return 5;
  if (matches >= 4) return 4;
  if (matches >= 3) return 3;
  return null;
}
```

**Hours 3–4 — Draw API Endpoints**
- [ ] `/api/admin/draw/simulate` — runs draw logic, returns results WITHOUT saving
- [ ] `/api/admin/draw/publish` — saves draw to DB, calculates prize pools, runs match logic against all active subscribers, populates `draw_results`
- [ ] Prize pool calculation:
  - Get active subscriber count × subscription amount
  - Apply split: 40% tier-5 (+ any rollover), 35% tier-4, 25% tier-3
  - Divide each tier equally among winners in that tier
  - If no tier-5 winner: carry jackpot to next draw's `prize_pools.jackpot_rollover`
- [ ] Jackpot rollover: query last unpaid tier-5 pool and add to current calculation

---

### Midday Block (4 hours): Admin Dashboard

Build at `/admin` — protect with a role check (`is_admin` field on profile, or a hardcoded admin email check for the demo).

**Hours 5–6 — User & Draw Management**
- [ ] `/admin/users` — paginated user list, view/edit subscription status, edit scores
- [ ] `/admin/draws` — draw list with status badges
- [ ] Draw configuration panel: select draw type (random/algorithmic), simulation mode
- [ ] Simulate button → shows preview of results without publishing
- [ ] Publish button → confirms and runs final draw
- [ ] Draw results view: list of winners by tier

**Hours 7–8 — Charity & Winner Management**
- [ ] `/admin/charities` — CRUD: add, edit, delete, toggle featured
- [ ] `/admin/winners` — list all winners with match type, prize amount, payment status
- [ ] Winner detail: view uploaded proof, Approve/Reject buttons
- [ ] Mark payout as complete button (Pending → Paid)
- [ ] Basic analytics panel: total users, total prize pool, charity contribution total

---

### Afternoon Block (2–3 hours): Polish + Deploy

**Hours 9–10 — Error Handling + UX Polish**
- [ ] Loading states on all async actions (score save, subscribe, draw run)
- [ ] Toast notifications for success/error (use `react-hot-toast` or Sonner)
- [ ] Empty states for dashboard modules (no scores yet, no draws yet, no winnings)
- [ ] Form validation with clear error messages
- [ ] Mobile responsive check — test all pages at 375px width
- [ ] Handle lapsed subscription: show "Renew Subscription" CTA, block score entry

**Hour 11 — Final Deploy**
- [ ] Push to GitHub
- [ ] Confirm Vercel deploy succeeds
- [ ] Set all env vars in Vercel dashboard
- [ ] Test Stripe webhook endpoint in production (use Stripe CLI or Stripe dashboard)
- [ ] Create test credentials:
  - Regular user: `testuser@demo.com` / `password123`
  - Admin user: `admin@demo.com` / `admin123`
- [ ] Run through the full testing checklist from the PRD (Section 16)

---

## What to Cut If You're Running Behind

Do these in order — each item is safe to drop:

1. **Algorithmic draw mode** — just ship random mode, mention algorithmic is stubbed
2. **Winner proof upload** — fake a file upload UI, no actual storage
3. **Charity events** ("upcoming golf days") — static placeholder text
4. **Analytics charts** — plain numbers/text instead of charts
5. **Email notifications** — log to console, mention Resend/SendGrid integration point in README
6. **Independent donations** (not tied to gameplay) — hide the UI, note it in README
7. **Yearly plan** — just do monthly, mention yearly is configured in Stripe but not wired

---

## What NOT to Cut

These are the core evaluation criteria — if any of these are broken, the submission fails:

- ✅ Signup + login
- ✅ Subscription flow (Stripe, even test mode)
- ✅ 5-score rolling logic (this is specifically called out)
- ✅ Draw system with simulation + publish
- ✅ Charity selection + contribution % calculation
- ✅ User dashboard — all 5 modules present
- ✅ Admin panel — user mgmt, draw mgmt, charity mgmt, winner verification
- ✅ Mobile responsive
- ✅ Deployed + publicly accessible

---

## Rough Timeline Summary

| Time | Focus |
|---|---|
| Day 1 Morning | Setup, DB schema, Auth |
| Day 1 Midday | Stripe subscriptions, Score system |
| Day 1 Evening | User dashboard, Charity pages, Homepage |
| Day 2 Morning | Draw engine (core logic + APIs) |
| Day 2 Midday | Admin dashboard (all panels) |
| Day 2 Afternoon | Polish, error handling, deploy, test |

---

## Tips for This Specific PRD

- **Score rolling logic** will be examined closely — write a test or at least a console-log-based sanity check before moving on
- **Draw simulation vs publish** is a key distinction — keep them as separate API endpoints, don't conflate them
- **Prize pool math** must be exact — hard-code the percentages (40/35/25) as constants and calculate from subscriber count × plan amount
- **Admin credentials** must work on first try — set them up before your final submission
- **UI doesn't need to be stunning** — clean, functional, and mobile-responsive is enough. Don't spend more than 20% of your time on CSS.
