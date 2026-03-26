-- Fix: permission denied for table users during profile reads
-- Root cause: profiles admin RLS policy queried auth.users directly,
-- which regular authenticated users cannot access.

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_id
      AND email IN (
        SELECT unnest(
          string_to_array(coalesce(current_setting('app.admin_emails', true), ''), ',')
        )
      )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth;

DROP POLICY IF EXISTS "Admin can manage all profiles" ON profiles;
CREATE POLICY "Admin can manage all profiles"
  ON profiles FOR ALL
  USING (is_admin(auth.uid()));
