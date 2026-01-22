-- Migration: Add BRANCH_ID, USERINFO_ID, and Emergency Contact columns to employee table
-- Date: 2026-01-20
-- Description: 
--   - Add BRANCH_ID column after IDNo to link employee to branch
--   - Add USERINFO_ID column after BRANCH_ID to link employee to user_info
--   - Add emergency contact columns (EMERGENCY_CONTACT_NAME, EMERGENCY_CONTACT_PHONE)
--
-- NOTE: If the employee table already exists, run only the ALTER TABLE statements.
--       If the table doesn't exist, run the CREATE TABLE statement first.

-- ============================================
-- OPTION 1: If employee table doesn't exist, create it with all columns
-- ============================================
CREATE TABLE IF NOT EXISTS `employee` (
  `IDNo` int NOT NULL AUTO_INCREMENT,
  `BRANCH_ID` int DEFAULT NULL COMMENT 'Link to branches table',
  `USERINFO_ID` int DEFAULT NULL COMMENT 'Link to user_info table',
  `PHOTO` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `FULLNAME` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `CONTACTNo` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `DEPARTMENT` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ADDRESS` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `DATE_STARTED` date DEFAULT NULL,
  `STATUS` tinyint(1) DEFAULT '1' COMMENT '1=ACTIVE, 0=INACTIVE',
  `ENCODED_BY` int DEFAULT NULL,
  `ENCODED_DT` datetime DEFAULT CURRENT_TIMESTAMP,
  `EDITED_BY` int DEFAULT NULL,
  `EDITED_DT` datetime DEFAULT NULL,
  `ACTIVE` tinyint(1) DEFAULT '1',
  `EMERGENCY_CONTACT_NAME` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Emergency contact person name',
  `EMERGENCY_CONTACT_PHONE` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Emergency contact phone number',
  PRIMARY KEY (`IDNo`),
  KEY `idx_employee_branch_id` (`BRANCH_ID`),
  KEY `idx_employee_userinfo_id` (`USERINFO_ID`),
  KEY `idx_employee_active` (`ACTIVE`),
  KEY `idx_employee_status` (`STATUS`),
  CONSTRAINT `fk_employee_branch` FOREIGN KEY (`BRANCH_ID`) REFERENCES `branches` (`IDNo`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_employee_userinfo` FOREIGN KEY (`USERINFO_ID`) REFERENCES `user_info` (`IDNo`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- OPTION 2: If employee table already exists, add the new columns
-- ============================================
-- Uncomment and run these ALTER TABLE statements if the table already exists
-- and you need to add the new columns

-- Add BRANCH_ID after IDNo (if it doesn't exist)
-- ALTER TABLE `employee` ADD COLUMN `BRANCH_ID` int DEFAULT NULL COMMENT 'Link to branches table' AFTER `IDNo`;

-- Add USERINFO_ID after BRANCH_ID (if it doesn't exist)
-- ALTER TABLE `employee` ADD COLUMN `USERINFO_ID` int DEFAULT NULL COMMENT 'Link to user_info table' AFTER `BRANCH_ID`;

-- Add EMERGENCY_CONTACT_NAME after ACTIVE (if it doesn't exist)
-- ALTER TABLE `employee` ADD COLUMN `EMERGENCY_CONTACT_NAME` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Emergency contact person name' AFTER `ACTIVE`;

-- Add EMERGENCY_CONTACT_PHONE after EMERGENCY_CONTACT_NAME (if it doesn't exist)
-- ALTER TABLE `employee` ADD COLUMN `EMERGENCY_CONTACT_PHONE` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Emergency contact phone number' AFTER `EMERGENCY_CONTACT_NAME`;

-- Add indexes (if they don't exist)
-- ALTER TABLE `employee` ADD KEY `idx_employee_branch_id` (`BRANCH_ID`);
-- ALTER TABLE `employee` ADD KEY `idx_employee_userinfo_id` (`USERINFO_ID`);

-- Add foreign key constraints (if they don't exist)
-- ALTER TABLE `employee` ADD CONSTRAINT `fk_employee_branch` FOREIGN KEY (`BRANCH_ID`) REFERENCES `branches` (`IDNo`) ON DELETE SET NULL ON UPDATE CASCADE;
-- ALTER TABLE `employee` ADD CONSTRAINT `fk_employee_userinfo` FOREIGN KEY (`USERINFO_ID`) REFERENCES `user_info` (`IDNo`) ON DELETE SET NULL ON UPDATE CASCADE;

