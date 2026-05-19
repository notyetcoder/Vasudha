-- ============================================================
-- KUTUMB — SUPABASE RPC FIXES
-- Run these in Supabase SQL Editor (Settings → SQL Editor)
-- ============================================================
-- These replace any existing link_spouses / unlink_spouses functions.
-- They are gender-aware: the male always gets the female's ID as spouseId
-- and vice versa, regardless of which order you pass them in.
-- ============================================================


-- 1. DROP old versions if they exist
DROP FUNCTION IF EXISTS public.link_spouses(uuid, uuid);
DROP FUNCTION IF EXISTS public.link_spouses(text, text);
DROP FUNCTION IF EXISTS public.unlink_spouses(uuid, uuid);
DROP FUNCTION IF EXISTS public.unlink_spouses(text, text);


-- 2. link_spouses
--    Accepts two user IDs (TEXT), looks up their genders,
--    and sets spouseId bidirectionally + maritalStatus = 'married'.
CREATE OR REPLACE FUNCTION public.link_spouses(user_id_1 TEXT, user_id_2 TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  gender_1 TEXT;
  gender_2 TEXT;
BEGIN
  -- Fetch genders
  SELECT gender INTO gender_1 FROM public.users WHERE id = user_id_1;
  SELECT gender INTO gender_2 FROM public.users WHERE id = user_id_2;

  -- Guard: both users must exist
  IF gender_1 IS NULL OR gender_2 IS NULL THEN
    RAISE EXCEPTION 'One or both users not found: %, %', user_id_1, user_id_2;
  END IF;

  -- Guard: must be different genders
  IF gender_1 = gender_2 THEN
    RAISE EXCEPTION 'Spouses must have different genders';
  END IF;

  -- Update user 1 → link to user 2
  UPDATE public.users
  SET
    "spouseId"      = user_id_2,
    "spouseName"    = NULL,
    "maritalStatus" = 'married'
  WHERE id = user_id_1;

  -- Update user 2 → link to user 1
  UPDATE public.users
  SET
    "spouseId"      = user_id_1,
    "spouseName"    = NULL,
    "maritalStatus" = 'married'
  WHERE id = user_id_2;
END;
$$;


-- 3. unlink_spouses
--    Accepts the user's ID and their spouse's ID,
--    clears spouseId on BOTH records and resets maritalStatus.
CREATE OR REPLACE FUNCTION public.unlink_spouses(p_user_id TEXT, p_spouse_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET
    "spouseId"      = NULL,
    "spouseName"    = NULL,
    "maritalStatus" = 'single'
  WHERE id = p_user_id OR id = p_spouse_id;
END;
$$;


-- 4. Grant execution rights to authenticated users (admins)
GRANT EXECUTE ON FUNCTION public.link_spouses(TEXT, TEXT)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlink_spouses(TEXT, TEXT) TO authenticated;


-- ============================================================
-- ALSO VERIFY: your users table column names
-- The app uses camelCase column names (spouseId, fatherId etc.)
-- Make sure your table has these exact column names.
-- Run this to check:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'users' ORDER BY column_name;
-- ============================================================
