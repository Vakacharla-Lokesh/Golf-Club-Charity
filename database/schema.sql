-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'lapsed')),
  subscription_plan TEXT CHECK (subscription_plan IS NULL OR subscription_plan IN ('monthly', 'yearly')),
  charity_id UUID,
  charity_percentage INTEGER DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- Admin bypass policy
CREATE POLICY "Admin can manage all profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() 
      AND email IN (SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- ============================================
-- CHARITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE charities ENABLE ROW LEVEL SECURITY;

-- Charities RLS Policies
CREATE POLICY "Everyone can view active charities"
  ON charities FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage all charities"
  ON charities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() 
      AND email IN (SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- ============================================
-- GOLF_SCORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS golf_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  played_at DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, played_at)
);

ALTER TABLE golf_scores ENABLE ROW LEVEL SECURITY;

-- Golf Scores RLS Policies
CREATE POLICY "Users can view own scores"
  ON golf_scores FOR SELECT
  USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own scores"
  ON golf_scores FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own scores"
  ON golf_scores FOR UPDATE
  USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete own scores"
  ON golf_scores FOR DELETE
  USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin can manage all scores"
  ON golf_scores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() 
      AND email IN (SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- ============================================
-- DRAWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'simulated', 'published')),
  winning_numbers INTEGER[] DEFAULT NULL,
  draw_type TEXT DEFAULT 'random' CHECK (draw_type IN ('random', 'algorithmic')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE draws ENABLE ROW LEVEL SECURITY;

-- Draws RLS Policies
CREATE POLICY "Everyone can view published draws"
  ON draws FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admin can manage draws"
  ON draws FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() 
      AND email IN (SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- ============================================
-- DRAW_ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS draw_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scores INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;

-- Draw Entries RLS Policies
CREATE POLICY "Users can view own entries"
  ON draw_entries FOR SELECT
  USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view entries for published draws"
  ON draw_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM draws WHERE draws.id = draw_entries.draw_id AND draws.status = 'published'
    )
  );

CREATE POLICY "Admin can manage draw entries"
  ON draw_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() 
      AND email IN (SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- ============================================
-- DRAW_RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS draw_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_type INTEGER NOT NULL CHECK (match_type IN (3, 4, 5)),
  prize_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (draw_id, user_id)
);

ALTER TABLE draw_results ENABLE ROW LEVEL SECURITY;

-- Draw Results RLS Policies
CREATE POLICY "Users can view own results"
  ON draw_results FOR SELECT
  USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view results for published draws"
  ON draw_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM draws WHERE draws.id = draw_results.draw_id AND draws.status = 'published'
    )
  );

CREATE POLICY "Admin can manage draw results"
  ON draw_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() 
      AND email IN (SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- ============================================
-- PRIZE_POOLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS prize_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL UNIQUE REFERENCES draws(id) ON DELETE CASCADE,
  tier_5 DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tier_4 DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tier_3 DECIMAL(10, 2) NOT NULL DEFAULT 0,
  jackpot_rollover DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE prize_pools ENABLE ROW LEVEL SECURITY;

-- Prize Pools RLS Policies
CREATE POLICY "Everyone can view published prize pools"
  ON prize_pools FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM draws WHERE draws.id = prize_pools.draw_id AND draws.status = 'published'
    )
  );

CREATE POLICY "Admin can manage prize pools"
  ON prize_pools FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() 
      AND email IN (SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'lapsed')),
  stripe_subscription_id TEXT UNIQUE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions RLS Policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin can manage subscriptions"
  ON subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() 
      AND email IN (SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- ============================================
-- INDEXES (Performance optimization)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_charity_id ON profiles(charity_id);
CREATE INDEX IF NOT EXISTS idx_golf_scores_user_id ON golf_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_golf_scores_played_at ON golf_scores(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_golf_scores_user_played_at ON golf_scores(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_draw_entries_draw_id ON draw_entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user_id ON draw_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_draw_results_draw_id ON draw_results(draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_results_user_id ON draw_results(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, auth_user_id)
  VALUES (uuid_generate_v4(), NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_on_signup();
