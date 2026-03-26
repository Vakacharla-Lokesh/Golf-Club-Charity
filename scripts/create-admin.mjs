#!/usr/bin/env node

/**
 * Script to create an admin account in the Golf Charity Platform
 * 
 * Usage:
 *   node scripts/create-admin.mjs <email> <password> [fullName]
 * 
 * Example:
 *   node scripts/create-admin.mjs admin@example.com SecurePass123 "Admin User"
 * 
 * IMPORTANT: After running this script, add the email to ADMIN_EMAILS in .env.local:
 *   ADMIN_EMAILS=admin@example.com,other-admin@example.com
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
function loadEnv() {
  const envPath = path.join(rootDir, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local not found');
    console.error(`   Expected at: ${envPath}`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const [key, ...valueParts] = trimmed.split('=');
    env[key] = valueParts.join('=').replace(/^"(.*)"$/, '$1');
  });

  return env;
}

async function createAdmin() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node scripts/create-admin.mjs <email> <password> [fullName]');
    console.log('\nExample:');
    console.log('  node scripts/create-admin.mjs admin@example.com SecurePass123 "Admin User"');
    process.exit(1);
  }

  const [email, password, fullName = ''] = args;

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('❌ Invalid email format');
    process.exit(1);
  }

  // Validate password strength
  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters');
    process.exit(1);
  }

  console.log('📋 Loading environment variables...');
  const env = loadEnv();

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing required environment variables:');
    if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseServiceRoleKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log(`📌 Supabase URL: ${supabaseUrl}`);

  // Create admin client (uses service role key for elevated privileges)
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`\n👤 Creating admin user with email: ${email}`);

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
      },
      email_confirm: true, // Auto-confirm email for admin users
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

    // Wait a moment for the trigger to create the profile
    console.log('⏳ Waiting for profile auto-creation...');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, auth_user_id')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = no rows found, other errors are actual problems
      console.warn('⚠️  Profile verification warning:', profileError.message);
    } else if (profile) {
      console.log(`✅ Profile created: ${profile.id}`);
    } else {
      console.warn('⚠️  Profile not found (may not be auto-created yet)');
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
    console.log(`\n   (or append to existing: ADMIN_EMAILS=existing@example.com,${email})`);
    console.log(`\n2. Restart your dev server`);
    console.log(`\n3. Log in with the credentials above`);
    console.log(`\n4. You'll have access to /admin routes\n`);
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

createAdmin().catch(() => process.exit(1));
