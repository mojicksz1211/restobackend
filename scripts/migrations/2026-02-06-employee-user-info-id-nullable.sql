-- Migration: Make USER_INFO_ID nullable in employee table
-- Date: 2026-02-06
-- Description: Allow employees to be created without a user account by making USER_INFO_ID nullable
-- 
-- This migration modifies the USER_INFO_ID column to allow NULL values,
-- enabling employees to be created without requiring a user_info account.
--
-- VERIFIED: Column name is USER_INFO_ID (with underscore) based on:
-- - Error message: "Column 'USER_INFO_ID' cannot be null"
-- - Model code uses: USER_INFO_ID
-- - Database column: USER_INFO_ID

ALTER TABLE `employee` 
  MODIFY COLUMN `USER_INFO_ID` int DEFAULT NULL COMMENT 'Link to user_info table';
