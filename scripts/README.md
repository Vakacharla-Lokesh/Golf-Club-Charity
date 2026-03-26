# Creating Admin Accounts

This directory contains scripts to create admin accounts for the Golf Charity Subscription Platform.

## Quick Start

### Option 1: Using Node.js (Recommended)

```bash
node scripts/create-admin.mjs admin@example.com SecurePass123 "Admin User"
```

### Option 2: Using Bash

```bash
bash scripts/create-admin.sh admin@example.com SecurePass123 "Admin User"
```

## Prerequisites

- ✅ `.env.local` file with Supabase credentials:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Node.js 18+ installed

## Usage

### Node.js Script (Recommended)

```bash
node scripts/create-admin.mjs <email> <password> [fullName]
```

**Arguments:**
- `email` (required): Admin user's email
- `password` (required): Admin user's password (min 6 characters)
- `fullName` (optional): Admin user's display name

**Example:**
```bash
node scripts/create-admin.mjs admin@golf-charity.com MySecurePass123 "Platform Admin"
```

**Output:**
```
📋 Loading environment variables...
📌 Supabase URL: https://xxx.supabase.co
👤 Creating admin user with email: admin@golf-charity.com
✅ Auth user created: 550e8400-e29b-41d4-a716-446655440000
✅ Profile created: 550e8400-e29b-41d4-a716-446655440001

============================================================
✨ ADMIN USER CREATED SUCCESSFULLY
============================================================

📧 Email:    admin@golf-charity.com
🔐 Password: MySecurePass123
👤 Name:     Platform Admin

⚙️  NEXT STEPS:
1. Add the email to your .env.local:

   ADMIN_EMAILS=admin@golf-charity.com

   (or append to existing: ADMIN_EMAILS=existing@example.com,admin@golf-charity.com)

2. Restart your dev server

3. Log in with the credentials above

4. You'll have access to /admin routes
```

### Bash Script

```bash
bash scripts/create-admin.sh <email> <password> [fullName]
```

Same arguments and behavior as the Node.js script.

## Important: Enable Admin Privileges

After the script completes, **you must update `.env.local`** to enable admin access:

```env
# .env.local

# Add or update the ADMIN_EMAILS variable
ADMIN_EMAILS=admin@golf-charity.com

# Or if you have multiple admins (comma-separated):
ADMIN_EMAILS=admin1@golf-charity.com,admin2@golf-charity.com
```

Then restart your dev server:

```bash
npm run dev
```

## How It Works

1. **Script creates auth user** → Uses Supabase admin API to create a new authenticated user
2. **Profile auto-created** → Database trigger `create_profile_on_signup` automatically creates a profile record
3. **Add to ADMIN_EMAILS** → You manually add the email to `.env.local` to grant admin privileges
4. **RLS bypass enabled** → Database policies check `is_admin()` function which verifies the email against `ADMIN_EMAILS`

## Admin Access

Once an email is in `ADMIN_EMAILS`, that user can:
- Access `/admin/*` routes (middleware checks `isAdmin()`)
- Bypass database Row-Level Security (RLS) for admin operations
- Manage draws, see all users, approve results, etc.

## Multiple Admin Accounts

Simply create multiple accounts by running the script multiple times:

```bash
node scripts/create-admin.mjs admin1@example.com Pass123 "Admin One"
node scripts/create-admin.mjs admin2@example.com Pass456 "Admin Two"
```

Then update `.env.local`:

```env
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## Troubleshooting

### ❌ "Missing required environment variables"

**Solution:** Ensure `.env.local` contains:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### ❌ "Invalid email format"

**Solution:** Use a valid email address:
```bash
# ✅ Good
node scripts/create-admin.mjs admin@example.com Pass123

# ❌ Bad
node scripts/create-admin.mjs admin Pass123
```

### ❌ "Password must be at least 6 characters"

**Solution:** Use a password with at least 6 characters:
```bash
node scripts/create-admin.mjs admin@example.com MyPassword123
```

### ❌ "Email already exists"

**Solution:** Choose a different email address or check if the user already exists in Supabase Auth.

### ❌ "Admin user created but ADMIN_EMAILS not updated"

**Solution:** Don't forget to update `.env.local`:
```env
ADMIN_EMAILS=admin@example.com
```

And restart the dev server.

## Testing Admin Access

1. Run the create-admin script
2. Update `.env.local` with the new email
3. Restart `npm run dev`
4. Go to [http://localhost:3000/login](http://localhost:3000/login)
5. Log in with the admin email and password
6. You should now see the admin panel at [http://localhost:3000/admin](http://localhost:3000/admin)

## Database Setup

The scripts assume your database tables are already created. If you haven't set up the database yet:

```bash
# Apply schema and seed data in Supabase SQL editor:
# 1. Copy contents of database/schema.sql
# 2. Paste into Supabase SQL editor and run
# 3. Copy contents of database/seed.sql
# 4. Paste and run (optional, for test charities)
```

## References

- [Supabase Admin API](https://supabase.com/docs/reference/admin-api)
- [Golf Charity Platform - Architecture Guide](../copilot-instructions.md)
