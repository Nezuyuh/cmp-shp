-- ============================================================
-- QA Seed Users
-- ============================================================
-- Run this AFTER creating the auth users via Supabase Dashboard
-- or Supabase Admin API.
--
-- Step 1: Go to Supabase Dashboard → Authentication → Users
--         Create these two users manually:
--
--   Email: admin@cmpshp.com  | Password: Admin@123
--   Email: user@cmpshp.com   | Password: User@123
--
-- Step 2: Copy the UUIDs assigned to each user, then run the
--         INSERT statements below, replacing the placeholder UUIDs.
--
-- Alternatively, use the Supabase Admin API:
--   POST /auth/v1/admin/users
--   { "email": "admin@cmpshp.com", "password": "Admin@123", "email_confirm": true }
-- ============================================================

-- Replace '<admin-user-uuid>' and '<user-uuid>' with actual UUIDs from auth.users

insert into user_profiles (id, role, full_name)
values
  ('<admin-user-uuid>', 'admin', 'Admin User'),
  ('<user-uuid>',       'user',  'Test User')
on conflict (id) do update
  set role      = excluded.role,
      full_name = excluded.full_name;

-- To also set role in user_metadata (used by auth middleware fallback):
-- Run via Supabase Admin API:
--   PATCH /auth/v1/admin/users/<admin-user-uuid>
--   { "user_metadata": { "role": "admin" } }
