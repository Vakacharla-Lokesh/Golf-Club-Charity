#!/bin/bash

# Script to create an admin account for Golf Charity Platform
# 
# Usage:
#   ./scripts/create-admin.sh <email> <password> [fullName]
#
# Example:
#   ./scripts/create-admin.sh admin@example.com SecurePass123 "Admin User"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/.env.local"

echo "📋 Loading environment variables from $ENV_FILE..."

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: .env.local not found at $ROOT_DIR/.env.local"
  exit 1
fi

# Load env variables
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Parse arguments
if [ $# -lt 2 ]; then
  echo "Usage: ./scripts/create-admin.sh <email> <password> [fullName]"
  echo ""
  echo "Example:"
  echo "  ./scripts/create-admin.sh admin@example.com SecurePass123 \"Admin User\""
  exit 1
fi

EMAIL="$1"
PASSWORD="$2"
FULL_NAME="${3:-}"

# Validate email
if ! [[ "$EMAIL" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]]; then
  echo "❌ Invalid email format"
  exit 1
fi

# Validate password strength
if [ ${#PASSWORD} -lt 6 ]; then
  echo "❌ Password must be at least 6 characters"
  exit 1
fi

# Check required env vars
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing required environment variables:"
  [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] && echo "   - NEXT_PUBLIC_SUPABASE_URL"
  [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "   - SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo "📌 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""
echo "👤 Creating admin user: $EMAIL"
echo ""

# Use Node.js to create the admin (fallback to the .mjs script)
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js or use the .mjs script directly."
  exit 1
fi

# Create a temporary Node.js script to call Supabase
node --input-type=module << 'EOFNODE'
import { createClient } from '@supabase/supabase-js';

const email = process.env.EMAIL;
const password = process.env.PASSWORD;
const fullName = process.env.FULL_NAME || '';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

try {
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: {
      full_name: fullName,
    },
    email_confirm: true,
  });

  if (authError) {
    console.error('❌ Failed to create auth user:', authError.message);
    process.exit(1);
  }

  if (!authData.user) {
    console.error('❌ No user returned from auth creation');
    process.exit(1);
  }

  console.log(`✅ Auth user created: ${authData.user.id}`);
  
  await new Promise(r => setTimeout(r, 1000));

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', authData.user.id)
    .single();

  if (profile) {
    console.log(`✅ Profile created: ${profile.id}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ ADMIN USER CREATED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log(`\n📧 Email:    ${email}`);
  console.log(`🔐 Password: ${password}`);
  if (fullName) console.log(`👤 Name:     ${fullName}`);
  console.log(`\n⚙️  NEXT STEPS:`);
  console.log(`1. Add the email to your .env.local:`);
  console.log(`\n   ADMIN_EMAILS=${email}`);
  console.log(`\n2. Restart your dev server`);
  console.log(`\n3. Log in with the credentials above\n`);
  
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
EOFNODE
