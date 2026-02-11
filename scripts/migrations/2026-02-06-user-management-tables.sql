-- ============================================
-- User Management: user_info + user_role extensions
-- For restoadmin User & Access page
-- Run against database: restaurant
-- If columns already exist, ignore duplicate column errors.
-- ============================================

-- Add EMAIL and AVATAR_URL to user_info (for User Management display)
ALTER TABLE `user_info`
  ADD COLUMN `EMAIL` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL AFTER `USERNAME`,
  ADD COLUMN `AVATAR_URL` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL AFTER `EMAIL`;

-- Add DESCRIPTION and PERMISSIONS (JSON) to user_role for Roles & Permissions tab
ALTER TABLE `user_role`
  ADD COLUMN `DESCRIPTION` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL AFTER `ROLE`,
  ADD COLUMN `PERMISSIONS` json DEFAULT NULL COMMENT 'Array of permission keys' AFTER `DESCRIPTION`;
