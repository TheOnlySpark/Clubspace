-- ClubSpace v1 Seed Script
-- Run this in the Supabase SQL editor AFTER you have signed up in the app with the email below.

DO $$
DECLARE
  target_email text := 'you@gmail.com'; 
  target_user_id uuid;
BEGIN
  -- Find the user ID from the auth.users table
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  
  -- If the user doesn't exist yet, stop execution
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please sign up first.', target_email;
  END IF;

  -- Promote the user to super_admin if they don't already have the role
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_user_id AND role = 'super_admin') THEN
    INSERT INTO user_roles (id, user_id, role)
    VALUES (gen_random_uuid(), target_user_id, 'super_admin');
  END IF;

END $$;