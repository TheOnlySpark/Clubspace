-- Seed instructions for ClubSpace v1
-- After deploying the application and creating the first user (which will have the email set in SUPER_ADMIN_EMAIL),
-- follow these steps to promote that user to Super Admin:

-- 1. Ensure you have a university record. You can create one via the dashboard after logging in,
--    or insert one manually:
-- INSERT INTO universities (id, name, slug, domain_allowlist, settings, created_at)
-- VALUES (gen_random_uuid(), 'Placeholder University', 'placeholder', '{}', '{}', now());

-- 2. Get the user ID from auth.users for the SUPER_ADMIN_EMAIL:
-- SELECT id FROM auth.users WHERE email = '<SUPER_ADMIN_EMAIL>';

-- 3. Assign the super_admin role:
-- INSERT INTO user_roles (id, user_id, university_id, role, created_at)
-- VALUES (gen_random_uuid(), '<USER_ID_FROM_STEP_2>', '<UNIVERSITY_ID_FROM_STEP_1>', 'super_admin', now());

-- Replace placeholders with actual values.