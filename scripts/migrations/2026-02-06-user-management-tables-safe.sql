-- ============================================
-- User Management: user_info + user_role extensions (SAFE VERSION)
-- For restoadmin User & Access page
-- Run against database: restaurant
-- This version checks if columns exist before adding them
-- ============================================

-- Add EMAIL to user_info if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'user_info';
SET @columnname = 'EMAIL';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL AFTER USERNAME')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add AVATAR_URL to user_info if it doesn't exist
SET @columnname = 'AVATAR_URL';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL AFTER EMAIL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add DESCRIPTION to user_role if it doesn't exist
SET @tablename = 'user_role';
SET @columnname = 'DESCRIPTION';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL AFTER ROLE')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add PERMISSIONS to user_role if it doesn't exist
SET @columnname = 'PERMISSIONS';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' json DEFAULT NULL COMMENT ''Array of permission keys'' AFTER DESCRIPTION')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SELECT 'Migration completed successfully!' AS result;
