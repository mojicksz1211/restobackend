-- Enforce: ONE branch per USER for non-admin accounts
-- This prevents multiple rows per USER_ID in user_branches.
--
-- NOTE: Run this only AFTER you clean up duplicates (if any).
-- Example cleanup to keep the lowest BRANCH_ID per user:
--   DELETE ub1 FROM user_branches ub1
--   JOIN user_branches ub2
--     ON ub1.USER_ID = ub2.USER_ID
--    AND ub1.BRANCH_ID > ub2.BRANCH_ID;

ALTER TABLE user_branches
  ADD UNIQUE KEY uniq_user_single_branch (USER_ID);


