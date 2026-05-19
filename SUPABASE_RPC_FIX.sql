-- CRITICAL FIX: Correct Spouse Linking Function
-- This replaces the existing link_spouses function with a gender-aware, bidirectional version

CREATE OR REPLACE FUNCTION link_spouses(
  user_id_1 UUID,
  user_id_2 UUID
)
RETURNS JSON AS $$
DECLARE
  gender_1 TEXT;
  gender_2 TEXT;
  result JSON;
BEGIN
  -- Get genders for validation
  SELECT gender INTO gender_1 FROM users WHERE id = user_id_1;
  SELECT gender INTO gender_2 FROM users WHERE id = user_id_2;

  -- Validation: Cannot link same gender
  IF gender_1 = gender_2 THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'error', 'Cannot link spouses of same gender'
    );
  END IF;

  -- Validation: Both users must exist
  IF gender_1 IS NULL OR gender_2 IS NULL THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'error', 'One or both users not found'
    );
  END IF;

  -- Link bidirectionally (gender-aware, always works both directions)
  UPDATE users SET spouseId = user_id_2 WHERE id = user_id_1;
  UPDATE users SET spouseId = user_id_1 WHERE id = user_id_2;

  -- Return success
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'message', 'Spouses linked successfully',
    'user_id_1', user_id_1,
    'user_id_2', user_id_2
  );
EXCEPTION WHEN OTHERS THEN
  RETURN JSON_BUILD_OBJECT(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- IMPORTANT: How to apply this fix:
-- 1. Go to Supabase > SQL Editor
-- 2. Copy this entire function
-- 3. Execute it
-- 4. This will replace the old function with the corrected version
-- 5. Test with: SELECT link_spouses('user-id-1'::uuid, 'user-id-2'::uuid);
