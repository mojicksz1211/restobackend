-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 20, 2026 at 03:45 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `restaurant`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `IDNo` int(11) NOT NULL,
  `USER_ID` int(11) DEFAULT NULL,
  `BRANCH_ID` int(11) DEFAULT NULL,
  `ACTION` varchar(100) DEFAULT NULL,
  `TABLE_NAME` varchar(50) DEFAULT NULL,
  `RECORD_ID` int(11) DEFAULT NULL,
  `CREATED_DT` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`IDNo`, `USER_ID`, `BRANCH_ID`, `ACTION`, `TABLE_NAME`, `RECORD_ID`, `CREATED_DT`) VALUES
(1, 4, 1, 'UPDATE', 'branches', 1, '2026-01-20 16:11:11'),
(2, 4, NULL, 'SET_USER_BRANCHES', 'user_branches', 21, '2026-01-20 16:33:04'),
(3, 4, NULL, 'SET_USER_BRANCHES', 'user_branches', 20, '2026-01-20 16:33:10'),
(4, 4, NULL, 'SET_USER_BRANCHES', 'user_branches', 19, '2026-01-20 16:33:16'),
(5, 4, NULL, 'SET_ADMIN_BRANCH_MODE_ALL', 'user_branches', 4, '2026-01-20 16:34:15'),
(6, 4, NULL, 'SET_ADMIN_BRANCH_MODE_ALL', 'user_branches', 4, '2026-01-20 16:35:52'),
(7, 4, NULL, 'SET_ADMIN_BRANCH_MODE_ALL', 'user_branches', 4, '2026-01-20 16:37:50'),
(8, 4, NULL, 'SET_USER_BRANCHES', 'user_branches', 22, '2026-01-20 16:56:44'),
(9, 4, NULL, 'SET_USER_BRANCHES', 'user_branches', 19, '2026-01-20 16:57:45'),
(10, 4, NULL, 'SET_USER_BRANCHES', 'user_branches', 20, '2026-01-20 16:57:50'),
(11, 4, NULL, 'SET_USER_BRANCHES', 'user_branches', 21, '2026-01-20 16:57:53'),
(12, 4, NULL, 'SET_USER_BRANCHES', 'user_branches', 25, '2026-01-20 16:57:57'),
(13, 4, 4, 'CREATE', 'branches', 4, '2026-01-20 17:23:32');

-- --------------------------------------------------------

--
-- Table structure for table `billing`
--

CREATE TABLE `billing` (
  `IDNo` int(11) NOT NULL,
  `BRANCH_ID` int(11) NOT NULL,
  `ORDER_ID` int(11) NOT NULL,
  `PAYMENT_METHOD` enum('CASH','GCASH','MAYA','CARD') DEFAULT NULL,
  `AMOUNT_DUE` decimal(10,2) NOT NULL,
  `AMOUNT_PAID` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Total amount paid',
  `REFUND` decimal(10,2) NOT NULL DEFAULT 0.00,
  `REFUND_DT` datetime DEFAULT NULL,
  `REFUND_REASON` varchar(255) DEFAULT NULL,
  `REMARKS` varchar(255) DEFAULT NULL,
  `PAYMENT_REF` varchar(100) DEFAULT NULL COMMENT 'OR number / transaction reference',
  `STATUS` tinyint(4) NOT NULL DEFAULT 3 COMMENT '1=PAID, 2=PARTIAL, 3=UNPAID',
  `ENCODED_DT` datetime NOT NULL DEFAULT current_timestamp(),
  `ENCODED_BY` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `IDNo` int(11) NOT NULL,
  `BRANCH_CODE` varchar(20) DEFAULT NULL,
  `BRANCH_NAME` varchar(100) DEFAULT NULL,
  `ADDRESS` varchar(255) DEFAULT NULL,
  `PHONE` varchar(30) DEFAULT NULL,
  `ACTIVE` tinyint(4) DEFAULT 1,
  `CREATED_DT` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`IDNo`, `BRANCH_CODE`, `BRANCH_NAME`, `ADDRESS`, `PHONE`, `ACTIVE`, `CREATED_DT`) VALUES
(1, 'BR001', 'Daraejung', 'friendship, Angeles City', '09123456789', 1, '2026-01-20 14:29:00'),
(2, 'BR002', 'Kim\'s Brothers', 'friendship, Angeles City', '09123456790', 1, '2026-01-20 14:29:00'),
(3, 'BR003', 'Blue Moon', 'friendship, Angeles City', '123', 1, '2026-01-20 17:23:32');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `IDNo` int(11) NOT NULL,
  `BRANCH_ID` int(11) NOT NULL,
  `CAT_NAME` varchar(100) NOT NULL,
  `CAT_DESC` varchar(255) DEFAULT NULL,
  `ACTIVE` tinyint(1) DEFAULT 1,
  `ENCODED_BY` int(11) DEFAULT NULL,
  `ENCODED_DT` datetime DEFAULT current_timestamp(),
  `EDITED_BY` int(11) DEFAULT NULL,
  `EDITED_DT` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`IDNo`, `BRANCH_ID`, `CAT_NAME`, `CAT_DESC`, `ACTIVE`, `ENCODED_BY`, `ENCODED_DT`, `EDITED_BY`, `EDITED_DT`) VALUES
(21, 1, '추천메뉴', 'Featured and recommended menu items', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(22, 1, '추천식사', 'Recommended meal combinations', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(23, 1, '점심특선', 'Special lunch menu items', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(24, 1, '세트메뉴', 'Complete set meals', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(25, 1, '바비큐', 'Barbecue dishes and grilled items', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(26, 1, '해산물', 'Fresh seafood dishes', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(27, 1, '구이전튀김', 'Grilled and fried food items', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(28, 1, '묵은지일품요리', 'Specialty dishes featuring aged kimchi', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(29, 1, '식사류', 'Various meal types and options', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(30, 1, '면류', 'Noodle-based dishes', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(31, 1, '도시락추가메뉴', 'Additional items for lunchbox orders', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(32, 1, '주류음료', 'Alcoholic drinks and beverages', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(34, 2, 'A-ADDITIONAL', NULL, 1, 35, '2026-01-27 19:01:38', NULL, NULL),
(35, 2, 'B-BEEF', NULL, 1, 35, '2026-01-27 19:02:03', NULL, NULL),
(36, 2, 'Basic Meat Set', NULL, 1, 35, '2026-01-27 19:02:12', NULL, NULL),
(37, 2, 'D-BAR SNACKS', NULL, 1, 35, '2026-01-27 19:02:18', NULL, NULL),
(38, 2, 'DRINKS', NULL, 1, 35, '2026-01-27 19:02:25', NULL, NULL),
(39, 2, 'H-HOT POT', NULL, 1, 35, '2026-01-27 19:02:32', NULL, NULL),
(40, 2, 'I-Iberico PORK', NULL, 1, 35, '2026-01-27 19:02:39', NULL, NULL),
(41, 2, 'K-Aged Premium Pork', NULL, 1, 35, '2026-01-27 19:02:46', NULL, NULL),
(42, 2, 'K-KIDS MENU', NULL, 1, 35, '2026-01-27 19:02:55', NULL, NULL),
(43, 2, 'M-MEAL', NULL, 1, 35, '2026-01-27 19:03:06', NULL, NULL),
(44, 2, 'N-NOODLE', NULL, 1, 35, '2026-01-27 19:03:13', NULL, NULL),
(45, 2, 'Nalchial Jumeokbab Set', NULL, 1, 35, '2026-01-27 19:03:20', NULL, NULL),
(46, 2, 'P-Aged Pork', NULL, 1, 35, '2026-01-27 19:03:26', NULL, NULL),
(47, 2, 'Pakimchi Radish', NULL, 1, 35, '2026-01-27 19:03:33', NULL, NULL),
(48, 2, 'Service', NULL, 1, 35, '2026-01-27 19:03:40', NULL, NULL),
(49, 2, 'SET Meat', NULL, 1, 35, '2026-01-27 19:03:46', NULL, NULL),
(50, 2, 'N/A', NULL, 1, 35, '2026-01-27 19:25:09', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `discount_report`
--

CREATE TABLE `discount_report` (
  `id` int(11) NOT NULL,
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `discount_applied` int(11) DEFAULT NULL,
  `point_discount_amount` decimal(18,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee`
--

CREATE TABLE `employee` (
  `IDNo` int(11) NOT NULL,
  `BRANCH_ID` int(11) NOT NULL COMMENT 'Link to branches table',
  `USER_INFO_ID` int(11) NOT NULL COMMENT 'Link to user_info table',
  `PHOTO` varchar(255) DEFAULT NULL,
  `FIRSTNAME` varchar(100) DEFAULT NULL,
  `LASTNAME` varchar(100) DEFAULT NULL,
  `CONTACTNo` varchar(20) DEFAULT NULL,
  `DEPARTMENT` varchar(50) DEFAULT NULL,
  `ADDRESS` varchar(255) DEFAULT NULL,
  `DATE_STARTED` datetime DEFAULT NULL,
  `SALARY` varchar(255) DEFAULT NULL,
  `EMERGENCY_CONTACT_NAME` varchar(100) DEFAULT NULL,
  `EMERGENCY_CONTACT_PHONE` varchar(20) DEFAULT NULL,
  `STATUS` tinyint(1) DEFAULT 1 COMMENT '1=ACTIVE, 0=INACTIVE',
  `ENCODED_BY` int(11) DEFAULT NULL,
  `ENCODED_DT` datetime DEFAULT current_timestamp(),
  `EDITED_BY` int(11) DEFAULT NULL,
  `EDITED_DT` datetime DEFAULT NULL,
  `ACTIVE` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee`
--

INSERT INTO `employee` (`IDNo`, `BRANCH_ID`, `USER_INFO_ID`, `PHOTO`, `FIRSTNAME`, `LASTNAME`, `CONTACTNo`, `DEPARTMENT`, `ADDRESS`, `DATE_STARTED`, `SALARY`, `EMERGENCY_CONTACT_NAME`, `EMERGENCY_CONTACT_PHONE`, `STATUS`, `ENCODED_BY`, `ENCODED_DT`, `EDITED_BY`, `EDITED_DT`, `ACTIVE`) VALUES
(1, 1, 0, NULL, 'justine', 'sdsds', '044168134', 'Kitchen', 'sdsdsdsds', '2026-03-17 00:00:00', '800000', 'justine villanueva', '044168134', 1, 9, '2026-01-22 22:54:55', 9, '2026-01-22 23:22:24', 1);

-- --------------------------------------------------------

--
-- Table structure for table `menu`
--

CREATE TABLE `menu` (
  `IDNo` int(11) NOT NULL,
  `BRANCH_ID` int(11) NOT NULL,
  `CATEGORY_ID` int(11) NOT NULL,
  `MENU_NAME` varchar(150) NOT NULL,
  `MENU_DESCRIPTION` text DEFAULT NULL,
  `MENU_IMG` varchar(255) DEFAULT NULL,
  `MENU_PRICE` decimal(10,2) NOT NULL DEFAULT 0.00,
  `IS_AVAILABLE` tinyint(1) DEFAULT 1,
  `ACTIVE` tinyint(1) DEFAULT 1 COMMENT '0=DELETED',
  `ENCODED_BY` int(11) DEFAULT NULL,
  `ENCODED_DT` datetime DEFAULT current_timestamp(),
  `EDITED_BY` int(11) DEFAULT NULL,
  `EDITED_DT` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu`
--

INSERT INTO `menu` (`IDNo`, `BRANCH_ID`, `CATEGORY_ID`, `MENU_NAME`, `MENU_DESCRIPTION`, `MENU_IMG`, `MENU_PRICE`, `IS_AVAILABLE`, `ACTIVE`, `ENCODED_BY`, `ENCODED_DT`, `EDITED_BY`, `EDITED_DT`) VALUES
(3, 1, 21, '산 새우회', NULL, '/uploads/menu/64_180-1769069028186-482790734.webp', 1800.00, 1, 1, NULL, '2026-01-14 16:51:52', 9, '2026-01-22 16:03:48'),
(4, 1, 21, '갈비찜', NULL, '/uploads/menu/12._190-1769061689469-52699377.webp', 1900.00, 1, 1, NULL, '2026-01-14 16:51:52', 9, '2026-01-22 14:01:30'),
(5, 1, 21, '간장게장 500g', NULL, '/uploads/menu/63_500g230-1769069013715-124992846.webp', 2300.00, 1, 1, NULL, '2026-01-14 16:51:52', 9, '2026-01-22 16:03:34'),
(6, 1, 21, 'LA 갈비', NULL, '/uploads/menu/14.LA_110-1769061678278-991376678.webp', 1100.00, 1, 1, NULL, '2026-01-14 16:51:52', 9, '2026-01-22 14:01:19'),
(7, 1, 21, '홍어삼합', NULL, '/uploads/menu/15._250-1769061721534-700728240.webp', 2500.00, 1, 1, NULL, '2026-01-14 16:51:52', 9, '2026-01-22 14:02:02'),
(8, 1, 22, '백알탕', NULL, '/uploads/menu/21_50-1769067798949-31561213.webp', 500.00, 1, 1, NULL, '2026-01-14 16:54:41', 9, '2026-01-22 15:43:19'),
(9, 1, 22, '매생이국', NULL, '/uploads/menu/22_50-1769067822363-852135222.webp', 500.00, 1, 1, NULL, '2026-01-14 16:54:42', 9, '2026-01-22 15:43:43'),
(10, 1, 22, '해물 순두부', NULL, '/uploads/menu/23_40-1769067846941-565508195.webp', 400.00, 1, 1, NULL, '2026-01-14 16:54:42', 9, '2026-01-22 15:44:07'),
(11, 1, 22, '갈비탕', NULL, '/uploads/menu/24_550-1769067862105-671839608.webp', 550.00, 1, 1, NULL, '2026-01-14 16:54:42', 9, '2026-01-22 15:44:22'),
(12, 1, 23, '게장정식', NULL, '/uploads/menu/31_110-1769067986595-626714930.webp', 1100.00, 1, 1, NULL, '2026-01-14 16:57:58', 9, '2026-01-22 15:46:27'),
(13, 1, 23, '비빔밥', NULL, '/uploads/menu/32_52-1769067995446-986433892.webp', 520.00, 1, 1, NULL, '2026-01-14 16:57:58', 9, '2026-01-22 15:46:36'),
(14, 1, 23, '제육까스', NULL, '/uploads/menu/33_55-1769068001981-167086203.webp', 550.00, 1, 1, NULL, '2026-01-14 16:57:58', 9, '2026-01-22 15:46:42'),
(15, 1, 23, '돼지갈비', NULL, '/uploads/menu/34_60-1769068015404-21282669.webp', 600.00, 1, 1, NULL, '2026-01-14 16:57:58', 9, '2026-01-22 15:46:56'),
(16, 1, 24, '스페샬 한정식 세트', NULL, '/uploads/menu/41_400-1769068074227-120120131.webp', 4000.00, 1, 1, NULL, '2026-01-14 17:03:46', 9, '2026-01-22 15:47:54'),
(17, 1, 24, '다래정세트', NULL, '/uploads/menu/42_330-1769068086967-368256438.webp', 3300.00, 1, 1, NULL, '2026-01-14 17:03:46', 9, '2026-01-22 15:48:07'),
(18, 1, 24, '패밀리세트', NULL, '/uploads/menu/43_250-1769068092487-512632539.webp', 2500.00, 1, 1, NULL, '2026-01-14 17:03:46', 9, '2026-01-22 15:48:13'),
(19, 1, 25, '양념 소갈비살', NULL, '/uploads/menu/52_80-1769068218842-34373107.webp', 800.00, 1, 1, NULL, '2026-01-14 17:07:12', 9, '2026-01-22 15:50:19'),
(20, 1, 25, '생 소갈비', NULL, '/uploads/menu/53_130-1769068242544-439088586.webp', 1300.00, 1, 1, NULL, '2026-01-14 17:07:12', 9, '2026-01-22 15:50:43'),
(21, 1, 25, '우삼겹', NULL, '/uploads/menu/54_55-1769068476776-977159503.webp', 550.00, 1, 1, NULL, '2026-01-14 17:07:12', 9, '2026-01-22 15:54:37'),
(22, 1, 25, '삼겹살', NULL, '/uploads/menu/56_46-1769068667190-821204911.webp', 460.00, 1, 1, NULL, '2026-01-14 17:07:12', 9, '2026-01-22 15:57:47'),
(23, 1, 25, '항정살', NULL, '/uploads/menu/57_55-1769068649199-788988842.webp', 550.00, 1, 1, NULL, '2026-01-14 17:07:12', 9, '2026-01-22 15:57:29'),
(24, 1, 25, '대패 삼겹살', NULL, '/uploads/menu/58_45-1769068628980-262331914.webp', 450.00, 1, 1, NULL, '2026-01-14 17:07:12', 9, '2026-01-22 15:57:09'),
(25, 1, 25, 'SET 삼겹살+항정살+양념돼지갈비', NULL, '/uploads/menu/B1SET_2-1769068613191-884062078.webp', 2000.00, 1, 1, NULL, '2026-01-14 17:07:12', 9, '2026-01-22 15:56:53'),
(26, 1, 25, 'SET 우삼겹+항정살+LA갈비', NULL, '/uploads/menu/B2SETLA_2.5-1769068596559-810479956.webp', 2500.00, 1, 1, NULL, '2026-01-14 17:07:12', 9, '2026-01-22 15:56:37'),
(27, 1, 25, 'SET 생소갈비+LA갈비+양념 소갈비살', NULL, '/uploads/menu/B3SETLA_3.2-1769068581586-784266083.webp', 3200.00, 1, 1, NULL, '2026-01-14 17:07:12', 9, '2026-01-22 15:56:22'),
(28, 1, 26, '특대 광어회', NULL, '/uploads/menu/61_1000-1769068981374-330491861.webp', 10000.00, 1, 1, NULL, '2026-01-14 17:09:23', 9, '2026-01-22 16:03:02'),
(29, 1, 26, '도다리회', NULL, '/uploads/menu/62_450-1769068995383-682864218.webp', 4500.00, 1, 1, NULL, '2026-01-14 17:09:23', 9, '2026-01-22 16:03:16'),
(30, 1, 26, '간장게장', '500g', '/uploads/menu/63_500g230-1769073820282-341449465.webp', 2300.00, 1, 1, NULL, '2026-01-14 17:09:23', 9, '2026-01-22 17:23:40'),
(31, 1, 26, '새우 소금구이', NULL, '/uploads/menu/65_180-1769069042037-340197426.webp', 1800.00, 1, 1, NULL, '2026-01-14 17:09:23', 9, '2026-01-22 16:04:02'),
(32, 1, 26, '코끼리 조개', NULL, '/uploads/menu/66_95-1769069062148-417293951.webp', 950.00, 1, 1, NULL, '2026-01-14 17:09:23', 9, '2026-01-22 16:04:22'),
(33, 1, 26, '전복 버터구이', NULL, '/uploads/menu/67_5pc120-1769069079019-463750036.webp', 1200.00, 1, 1, NULL, '2026-01-14 17:09:23', 9, '2026-01-22 16:04:39'),
(34, 1, 26, '해물 오뎅탕', NULL, '/uploads/menu/68_70-1769069094992-119720367.webp', 700.00, 1, 1, NULL, '2026-01-14 17:09:23', 9, '2026-01-22 16:04:55'),
(35, 1, 26, '뚝배기 홍합탕', NULL, '/uploads/menu/69_40-1769069106739-366487683.webp', 400.00, 1, 1, NULL, '2026-01-14 17:09:23', 9, '2026-01-22 16:05:07'),
(36, 1, 26, '꼬막무침', NULL, '/uploads/menu/70_100-1769069123717-800308962.webp', 1000.00, 1, 1, NULL, '2026-01-14 17:09:23', 9, '2026-01-22 16:05:24'),
(37, 1, 27, '모둠전', NULL, '/uploads/menu/71_120-1769069201912-306652064.webp', 1200.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 16:06:42'),
(38, 1, 27, '두부전', NULL, '/uploads/menu/72_40-1769069217948-602037953.webp', 400.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 16:06:58'),
(39, 1, 27, '호박전', NULL, '/uploads/menu/73_40-1769069238452-878168492.webp', 400.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 16:07:19'),
(40, 1, 27, '고추전', NULL, '/uploads/menu/74_70-1769069251218-944811055.webp', 700.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 16:07:31'),
(41, 1, 27, '부추전', NULL, '/uploads/menu/75_40-1769069263426-546026432.webp', 400.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 16:07:44'),
(42, 1, 27, '해물파전', NULL, '/uploads/menu/76_45-1769069283535-243786269.webp', 450.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 16:08:04'),
(43, 1, 27, '새우튀김 (8pcs)', NULL, '/uploads/menu/77_8pcs75-1769069303799-379731878.webp', 750.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 16:08:41'),
(44, 1, 27, '큰새우 크림소스 (5pcs)', NULL, '/uploads/menu/78_5pcs130-1769069354785-733458184.webp', 1300.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 16:09:15'),
(45, 1, 27, '고등어구이', NULL, '/uploads/menu/79_75-1769069375482-866983050.webp', 750.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 16:09:36'),
(46, 1, 27, '돈까스', NULL, '/uploads/menu/80_49-1769069395702-890703557.webp', 490.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 16:09:56'),
(47, 1, 27, '치즈돈까스', NULL, '/uploads/menu/81_50-1769069415679-344718640.webp', 500.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 16:10:16'),
(48, 1, 27, '생선까스', NULL, '/uploads/menu/82_50-1769069438351-64263952.webp', 500.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 16:10:38'),
(49, 1, 27, '미니 탕수육', NULL, '/uploads/menu/83_40-1769073943639-428755495.webp', 400.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 17:25:44'),
(50, 1, 27, '고기만두 (8pcs)', NULL, '/uploads/menu/84_8pcs40-1769069459479-236363049.webp', 400.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 16:11:18'),
(51, 1, 27, '군만두 (8pcs)', NULL, '/uploads/menu/85_8pcs45-1769069494930-506869802.webp', 450.00, 1, 1, NULL, '2026-01-14 17:12:29', 9, '2026-01-22 16:11:35'),
(52, 1, 28, '묵은지 김치전골', NULL, '/uploads/menu/81_130-1769065109278-871408103.webp', 1300.00, 1, 1, NULL, '2026-01-14 17:15:08', 9, '2026-01-22 14:58:29'),
(53, 1, 28, '묵은지 고등어조림', NULL, '/uploads/menu/82_150-1769065136167-927355705.webp', 1500.00, 1, 1, NULL, '2026-01-14 17:15:08', 9, '2026-01-22 14:58:56'),
(54, 1, 28, '다래정 불고기', NULL, '/uploads/menu/84_85-1769065461362-98251232.webp', 850.00, 1, 1, NULL, '2026-01-14 17:15:09', 9, '2026-01-22 15:04:22'),
(55, 1, 28, '콩나물찜', NULL, '/uploads/menu/85_40-1769065500222-216258172.webp', 400.00, 1, 1, NULL, '2026-01-14 17:15:09', 9, '2026-01-22 15:05:00'),
(56, 1, 28, '백알탕 전골', NULL, '/uploads/menu/87_120-1769065909093-366200960.webp', 1200.00, 1, 1, NULL, '2026-01-14 17:15:09', 9, '2026-01-22 15:11:49'),
(57, 1, 28, '숯불 쭈꾸미 양념구이', NULL, '/uploads/menu/88_120-1769065929974-931307474.webp', 1200.00, 1, 1, NULL, '2026-01-14 17:15:09', 9, '2026-01-22 15:12:10'),
(58, 1, 28, '제육볶음', NULL, '/uploads/menu/89_70-1769065953583-40666241.webp', 700.00, 1, 1, NULL, '2026-01-14 17:15:09', 9, '2026-01-22 15:12:34'),
(59, 1, 28, '오징어 볶음', NULL, '/uploads/menu/90_75-1769065975131-532021908.webp', 750.00, 1, 1, NULL, '2026-01-14 17:15:09', 9, '2026-01-22 15:12:55'),
(60, 1, 29, '김치찌개', NULL, '/uploads/menu/91_38-1769066185326-508764459.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', 9, '2026-01-22 15:16:26'),
(61, 1, 29, '미역국', NULL, '/uploads/menu/910_38-1769066375164-896081831.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', 9, '2026-01-22 15:19:35'),
(62, 1, 29, '삼계탕', NULL, '/uploads/menu/911_70-1769066397642-223129000.webp', 700.00, 1, 1, NULL, '2026-01-14 17:17:16', 9, '2026-01-22 15:19:58'),
(63, 1, 29, '떡볶이', NULL, '/uploads/menu/912_30-1769066416753-328304502.webp', 300.00, 1, 1, NULL, '2026-01-14 17:17:16', 9, '2026-01-22 15:20:17'),
(64, 1, 29, '해물된장찌개', NULL, '/uploads/menu/92_38-1769066203731-188215791.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', 9, '2026-01-22 15:16:44'),
(65, 1, 29, '청국장', NULL, '/uploads/menu/93_38-1769066220529-679261862.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', 9, '2026-01-22 15:17:01'),
(66, 1, 29, '설렁탕', NULL, '/uploads/menu/94_38-1769066247745-761997625.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', 9, '2026-01-22 15:17:28'),
(67, 1, 29, '오징어 덮밥', NULL, '/uploads/menu/95_38-1769066270146-156842653.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', 9, '2026-01-22 15:17:50'),
(68, 1, 29, '제육덮밥', NULL, '/uploads/menu/96_38-1769066286694-607236373.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', 9, '2026-01-22 15:18:07'),
(69, 1, 29, '김치 볶음밥', NULL, '/uploads/menu/98_38-1769066337790-24236862.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', 9, '2026-01-22 15:18:58'),
(70, 1, 29, '떡국', NULL, '/uploads/menu/99_38-1769066353045-775802231.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', 9, '2026-01-22 15:19:13'),
(71, 1, 30, '초계국수', NULL, '/uploads/menu/101_38-1769066571553-931826893.webp', 380.00, 1, 1, NULL, '2026-01-14 17:19:24', 9, '2026-01-22 15:22:52'),
(72, 1, 30, '물냉면', NULL, '/uploads/menu/102_38-1769066588567-300164218.webp', 380.00, 1, 1, NULL, '2026-01-14 17:19:24', 9, '2026-01-22 15:23:09'),
(73, 1, 30, '비빔냉면', NULL, '/uploads/menu/103_38-1769066607980-191927243.webp', 380.00, 1, 1, NULL, '2026-01-14 17:19:24', 9, '2026-01-22 15:23:28'),
(74, 1, 30, '비빔국수', NULL, '/uploads/menu/104_38-1769066620991-898246211.webp', 380.00, 1, 1, NULL, '2026-01-14 17:19:24', 9, '2026-01-22 15:23:41'),
(75, 1, 30, '잔치국수', NULL, '/uploads/menu/105_38-1769066636470-86030552.webp', 380.00, 1, 1, NULL, '2026-01-14 17:19:24', 9, '2026-01-22 15:23:57'),
(76, 1, 30, '바지락 칼국수', NULL, '/uploads/menu/106_38-1769066664539-979241722.webp', 380.00, 1, 1, NULL, '2026-01-14 17:19:24', 9, '2026-01-22 15:24:25'),
(77, 1, 30, '라면', NULL, '/uploads/menu/107_30-1769066677475-62958797.webp', 300.00, 1, 1, NULL, '2026-01-14 17:19:24', 9, '2026-01-22 15:24:38'),
(78, 1, 31, '돈까스 도시락', NULL, '/uploads/menu/111_49-1769066745914-804383960.webp', 490.00, 1, 1, NULL, '2026-01-14 17:21:33', 9, '2026-01-22 15:25:46'),
(79, 1, 31, '제육불고기 도시락', NULL, '/uploads/menu/112_49-1769066764358-703609236.webp', 490.00, 1, 1, NULL, '2026-01-14 17:21:33', 9, '2026-01-22 15:26:05'),
(80, 1, 31, '소불고기 도시락', NULL, '/uploads/menu/113_49-1769066777543-57286027.webp', 490.00, 1, 1, NULL, '2026-01-14 17:21:33', 9, '2026-01-22 15:26:18'),
(81, 1, 31, '오삼불고기 도시락', NULL, '/uploads/menu/114_49-1769066789616-448969973.webp', 490.00, 1, 1, NULL, '2026-01-14 17:21:33', 9, '2026-01-22 15:26:30'),
(82, 1, 31, '공기밥', NULL, '/uploads/menu/115_5-1769066803554-512900123.webp', 50.00, 1, 1, NULL, '2026-01-14 17:21:33', 9, '2026-01-22 15:26:44'),
(83, 1, 31, '김', NULL, '/uploads/menu/116_3-1769066822275-77608362.webp', 30.00, 1, 1, NULL, '2026-01-14 17:21:33', 9, '2026-01-22 15:27:02'),
(84, 1, 31, '계란후라이', NULL, '/uploads/menu/117_5-1769066840127-96762647.webp', 50.00, 1, 1, NULL, '2026-01-14 17:21:33', 9, '2026-01-22 15:27:20'),
(85, 1, 31, '계란찜', NULL, '/uploads/menu/118_18-1769066855721-383131057.webp', 180.00, 1, 1, NULL, '2026-01-14 17:21:33', 9, '2026-01-22 15:27:36'),
(86, 1, 31, '계란말이', NULL, '/uploads/menu/119_28-1769066870018-256488012.webp', 280.00, 1, 1, NULL, '2026-01-14 17:21:33', 9, '2026-01-22 15:27:50'),
(87, 1, 31, '런천미트', NULL, '/uploads/menu/120_4pcs20-1769066887388-113654555.webp', 200.00, 1, 1, NULL, '2026-01-14 17:21:33', 9, '2026-01-22 15:28:08'),
(88, 1, 31, '라면사리', NULL, '/uploads/menu/121_6-1769066900671-448848520.webp', 60.00, 1, 1, NULL, '2026-01-14 17:21:33', 9, '2026-01-22 15:28:21'),
(89, 1, 31, '두부', NULL, '/uploads/menu/122_10-1769066919517-535304763.webp', 100.00, 1, 1, NULL, '2026-01-14 17:21:33', 9, '2026-01-22 15:28:40'),
(90, 1, 31, '쌈야채', NULL, '/uploads/menu/123_15-1769066940578-622398243.webp', 150.00, 1, 1, NULL, '2026-01-14 17:21:33', 9, '2026-01-22 15:29:01'),
(91, 1, 31, '당면사리', NULL, '/uploads/menu/124_7-1769066957756-760430208.webp', 70.00, 1, 1, NULL, '2026-01-14 17:21:33', 9, '2026-01-22 15:29:18'),
(92, 1, 32, '소주', NULL, '/uploads/menu/121_30-1769067053768-492350033.webp', 300.00, 1, 1, NULL, '2026-01-14 17:23:11', 9, '2026-01-22 15:30:54'),
(93, 1, 32, '진로이즈백', NULL, '/uploads/menu/122_30-1769067070307-594793802.webp', 300.00, 1, 1, NULL, '2026-01-14 17:23:11', 9, '2026-01-22 15:31:10'),
(94, 1, 32, '새로', NULL, '/uploads/menu/123_30-1769067088321-868855574.webp', 300.00, 1, 1, NULL, '2026-01-14 17:23:11', 9, '2026-01-22 15:31:28'),
(95, 1, 32, '막걸리', NULL, '/uploads/menu/124_35-1769067103070-617279027.webp', 350.00, 1, 1, NULL, '2026-01-14 17:23:11', 9, '2026-01-22 15:31:43'),
(96, 1, 32, '복분자', NULL, '/uploads/menu/125_85-1769067117027-698822433.webp', 850.00, 1, 1, NULL, '2026-01-14 17:23:11', 9, '2026-01-22 15:31:57'),
(97, 1, 32, '카스', NULL, '/uploads/menu/126_30-1769067136797-881116278.webp', 300.00, 1, 1, NULL, '2026-01-14 17:23:11', 9, '2026-01-22 15:32:17'),
(98, 1, 32, '맥주', NULL, '/uploads/menu/127_12-1769067152733-771351648.webp', 120.00, 1, 1, NULL, '2026-01-14 17:23:11', 9, '2026-01-22 15:32:33'),
(99, 1, 32, '탄산음료', NULL, '/uploads/menu/128_8-1769067166984-970670074.webp', 80.00, 1, 1, NULL, '2026-01-14 17:23:11', 9, '2026-01-22 15:32:47'),
(100, 1, 32, '제주감귤주스', NULL, '/uploads/menu/129_20-1769067183640-153244495.webp', 200.00, 1, 1, NULL, '2026-01-14 17:23:11', 9, '2026-01-22 15:33:04'),
(101, 1, 32, '탄산수', NULL, '/uploads/menu/130_10-1769067204165-431860820.webp', 100.00, 1, 1, NULL, '2026-01-14 17:23:11', 9, '2026-01-22 15:33:24'),
(102, 1, 29, '비빔밥', NULL, '/uploads/menu/97_45-1769066319610-786914326.webp', 450.00, 1, 1, 9, '2026-01-17 23:28:52', 9, '2026-01-22 15:18:40'),
(103, 1, 28, '홍어삼합', NULL, '/uploads/menu/86_250-1769065729361-779792135.webp', 2500.00, 1, 1, 9, '2026-01-17 23:35:51', 9, '2026-01-22 15:08:50'),
(104, 1, 28, '갈비찜', NULL, '/uploads/menu/83._190-1769065187061-918868793.webp', 1900.00, 1, 1, 9, '2026-01-17 23:38:07', 9, '2026-01-22 14:59:47'),
(105, 1, 31, 'VIP GIRLS', NULL, '/uploads/menu/download (1)-1768897370960-918264304.webp', 200.00, 1, 0, 9, '2026-01-20 16:22:50', 9, '2026-01-20 16:23:13'),
(106, 1, 31, 'VIP GIRLS', NULL, '/uploads/menu/download (2)-1768897778100-521029708.webp', 0.00, 1, 0, 9, '2026-01-20 16:29:38', 9, '2026-01-20 17:29:14'),
(107, 1, 31, 'VIP GIRLS', NULL, '/uploads/menu/download (1)-1768903187777-121697897.webp', 0.00, 1, 0, 9, '2026-01-20 17:59:48', 9, '2026-01-20 18:00:30'),
(108, 1, 25, 'LA 갈비', NULL, '/uploads/menu/51LA_110-1769069630584-605259879.webp', 1100.00, 1, 1, 9, '2026-01-22 16:13:51', NULL, NULL),
(109, 1, 25, '돼지갈비', NULL, '/uploads/menu/55_60-1769069735637-412695464.webp', 600.00, 1, 1, 9, '2026-01-22 16:15:36', NULL, NULL),
(110, 2, 34, 'A1 Nalchial Sagak Jumeokbab', 'Flying Fish and Nori Flakes Rice Squareball', NULL, 280.00, 1, 1, 35, '2026-01-27 19:12:16', NULL, NULL),
(111, 2, 34, 'A2 Gyeran Jjim(steam egg)', NULL, NULL, 150.00, 1, 1, 35, '2026-01-27 19:12:50', NULL, NULL),
(112, 2, 34, 'A3- Leave Mul Naengmyun', 'Additional Cold Noodle Mild/ Spicy', NULL, 200.00, 1, 1, 35, '2026-01-27 19:13:06', 35, '2026-01-27 19:13:46'),
(113, 2, 34, 'A4- Husik Bibim Naengmyun', NULL, NULL, 200.00, 1, 1, 35, '2026-01-27 19:25:49', NULL, NULL),
(114, 2, 34, 'A5 Kimchi Sulbab', NULL, NULL, 300.00, 1, 1, 35, '2026-01-27 19:26:24', NULL, NULL),
(115, 2, 34, 'A6 Dwanjang Sulbab', NULL, NULL, 300.00, 1, 1, 35, '2026-01-27 19:26:38', NULL, NULL),
(116, 2, 34, 'A7 Nurungji', 'Scorched Rice', NULL, 100.00, 1, 1, 35, '2026-01-27 19:27:06', NULL, NULL),
(117, 2, 34, 'A8 Gonggibab (Rice)', 'Rice', NULL, 50.00, 1, 1, 35, '2026-01-27 19:27:25', NULL, NULL),
(118, 2, 34, 'Add Cheese', NULL, NULL, 50.00, 1, 1, 35, '2026-01-27 19:27:42', NULL, NULL),
(119, 2, 35, 'B1 Galbisal', 'Beef Rib Finger 180g', NULL, 800.00, 1, 1, 35, '2026-01-27 19:28:07', NULL, NULL),
(120, 2, 35, 'B2 L.A Galbi', 'Grilled Sliced Short Rib 200g', NULL, 950.00, 1, 1, 35, '2026-01-27 19:28:30', NULL, NULL),
(121, 2, 35, 'B3 Yuke', NULL, NULL, 990.00, 1, 1, 35, '2026-01-27 19:28:47', NULL, NULL),
(122, 2, 50, 'Basic Meal Set 1', NULL, NULL, 0.00, 1, 1, 35, '2026-01-27 19:31:30', NULL, NULL),
(123, 2, 50, 'Basic Meal Set 2', NULL, NULL, 0.00, 1, 1, 35, '2026-01-27 19:31:42', NULL, NULL),
(124, 2, 36, 'Basic Meat Setting 1', NULL, NULL, 0.00, 1, 1, 35, '2026-01-27 19:32:50', NULL, NULL),
(125, 2, 36, 'Basic Meat Setting 2', NULL, NULL, 0.00, 1, 1, 35, '2026-01-27 19:33:08', NULL, NULL),
(126, 2, 38, 'Bokbunja(black wine)', NULL, NULL, 750.00, 1, 1, 35, '2026-01-27 19:34:01', NULL, NULL),
(127, 2, 38, 'Chamisul', NULL, NULL, 280.00, 1, 1, 35, '2026-01-27 19:34:38', NULL, NULL),
(128, 2, 38, 'Cheong Ha(original)', NULL, NULL, 350.00, 1, 1, 35, '2026-01-27 19:34:49', NULL, NULL),
(129, 2, 38, 'Chum Churum', NULL, NULL, 280.00, 1, 1, 35, '2026-01-27 19:35:11', NULL, NULL),
(130, 2, 38, 'Coke', NULL, NULL, 80.00, 1, 1, 35, '2026-01-27 19:35:26', NULL, NULL),
(131, 2, 38, 'Coke Zero', NULL, NULL, 80.00, 1, 1, 35, '2026-01-27 19:35:41', NULL, NULL),
(132, 2, 37, 'D1 Dolpan Bulgogi', 'Stone-Stir Beef Bulgogi', NULL, 850.00, 1, 1, 35, '2026-01-27 19:36:28', NULL, NULL),
(133, 2, 37, 'D2 Dolpan Osambulgogi', 'Squid and Pork Spicy Bulgogi', NULL, 800.00, 1, 1, 35, '2026-01-27 19:36:48', NULL, NULL),
(134, 2, 37, 'D3 Tteokbokki', 'Tahong and Fishcake Soup', NULL, 500.00, 1, 1, 35, '2026-01-27 19:37:09', NULL, NULL),
(135, 2, 37, 'D4 CheesePoktan Gyeranmari', 'Spicy Stir-Fried Pork', NULL, 500.00, 1, 1, 35, '2026-01-27 19:37:30', NULL, NULL),
(136, 2, 37, 'D5 Tofu with Stir-Kimchi', 'Acorn Jelly Salad', NULL, 600.00, 1, 1, 35, '2026-01-27 19:37:48', NULL, NULL),
(137, 2, 37, 'D6 Meoktae', 'Rolled Omelet Covered Cheese', NULL, 600.00, 1, 1, 35, '2026-01-27 19:38:11', NULL, NULL),
(138, 2, 34, 'Fried Egg', NULL, NULL, 30.00, 1, 1, 35, '2026-01-27 19:38:31', NULL, NULL),
(139, 2, 48, 'Gyeranzzim free', 'free', NULL, 0.00, 1, 1, 35, '2026-01-27 19:38:47', NULL, NULL),
(140, 2, 39, 'H1 Bulgogi Beoseot Jeongol', 'Bulgogi and Mushroom Hot Pot', NULL, 1180.00, 1, 1, 35, '2026-01-27 19:39:22', NULL, NULL),
(141, 2, 39, 'H2 Iberico Kimchi Jengeol', 'Iberico Pork and Kimchi Hot Pot', NULL, 980.00, 1, 1, 35, '2026-01-27 19:39:41', NULL, NULL),
(142, 2, 39, 'H3 Beef Brisket and Soybean Paste Hot Pot', 'Aged Grilled Premium Pork Sparerib', NULL, 980.00, 1, 1, 35, '2026-01-27 19:40:01', NULL, NULL),
(143, 2, 39, 'H4 Haemul Sundubu Jeongol', 'Seafood and Soft Tofu Hot Pot', NULL, 980.00, 1, 1, 35, '2026-01-27 19:40:26', NULL, NULL),
(144, 2, 39, 'H5 Budaejjigae Jeongol', 'Sausage and Ham Hot Pot', NULL, 980.00, 1, 1, 35, '2026-01-27 19:40:49', NULL, NULL),
(145, 2, 50, 'Haemul sundubujjigae', NULL, NULL, 380.00, 1, 1, 35, '2026-01-27 19:42:47', NULL, NULL),
(146, 2, 40, 'I1 Iberico Kkot Moksal', 'Grilled Iberico Pork Neck 180g', NULL, 680.00, 1, 1, 35, '2026-01-27 19:43:26', NULL, NULL),
(147, 2, 40, 'I2 Iberico Galbisal', 'Grilled Iberico Pork Finger 180g', NULL, 680.00, 1, 1, 35, '2026-01-27 19:43:53', NULL, NULL),
(148, 2, 38, 'Jinro', NULL, NULL, 300.00, 1, 1, 35, '2026-01-27 19:44:14', NULL, NULL),
(149, 2, 41, 'K1 Handon KKotsamgyeopsal', 'Aged Grilled Premium Pork Belly 180g', NULL, 600.00, 1, 1, 35, '2026-01-27 19:44:45', NULL, NULL),
(150, 2, 42, 'K1 Jumeokbab + Steam Egg', 'Nori Rice + Steamed Eggs', NULL, 300.00, 1, 1, 35, '2026-01-27 19:45:13', NULL, NULL),
(151, 2, 41, 'K2 Handon yangnyeom galbi', 'Aged Grilled Premium Jowl 180g', NULL, 600.00, 1, 1, 35, '2026-01-27 19:45:35', NULL, NULL),
(152, 2, 50, 'Kkomag bibimbab', NULL, NULL, 380.00, 1, 1, 35, '2026-01-27 19:45:58', NULL, NULL),
(153, 2, 50, 'Konamul haejanggug', NULL, NULL, 380.00, 1, 1, 35, '2026-01-27 19:46:17', NULL, NULL),
(154, 2, 43, 'M1 Galbitang', NULL, NULL, 500.00, 1, 1, 35, '2026-01-27 19:46:44', NULL, NULL),
(155, 2, 43, 'M2 Ttukbaegi Bulgogi', 'Bulgogi in a Stone Pot', NULL, 400.00, 1, 1, 35, '2026-01-27 19:47:09', NULL, NULL),
(156, 2, 43, 'M3 Dolsot Bibimbap', 'Hot Stone Bibimbap', NULL, 380.00, 1, 1, 35, '2026-01-27 19:47:33', NULL, NULL),
(157, 2, 43, 'M4 Moksal Kimchi Jjigae', 'Tuna Kimchi Stew', NULL, 380.00, 1, 1, 35, '2026-01-27 19:47:51', NULL, NULL),
(158, 2, 43, 'M5 Haemul Dwaenjang Jjigae', 'Seafood Soybean Paste Stew', NULL, 380.00, 1, 1, 35, '2026-01-27 19:48:09', NULL, NULL),
(159, 2, 43, 'M6 Kimchi Bokeumbap', NULL, NULL, 350.00, 1, 1, 35, '2026-01-27 19:49:19', NULL, NULL),
(160, 2, 43, 'M7 Muksabal', NULL, NULL, 400.00, 1, 1, 35, '2026-01-27 19:49:29', NULL, NULL),
(161, 2, 43, 'M8 Haemul sundubu Jjigae', NULL, NULL, 380.00, 1, 1, 35, '2026-01-27 19:49:50', NULL, NULL),
(162, 2, 38, 'Makgeoli(rice wine)', NULL, NULL, 350.00, 1, 1, 35, '2026-01-27 19:50:07', NULL, NULL),
(163, 2, 38, 'Mango Juice', NULL, NULL, 80.00, 1, 1, 35, '2026-01-27 19:50:19', NULL, NULL),
(164, 2, 48, 'Muksabal', 'free', NULL, 0.00, 1, 1, 35, '2026-01-27 19:50:31', NULL, NULL),
(165, 2, 44, 'N1-1Mulnaengmyeon', 'Mild Cold Noodle', NULL, 380.00, 1, 1, 35, '2026-01-27 19:51:01', NULL, NULL),
(166, 2, 44, 'N2 Bibimnaengmyeon', 'Spicy Cold Noodle', NULL, 380.00, 1, 1, 35, '2026-01-27 19:51:23', NULL, NULL),
(167, 2, 44, 'N3 Golbaengi Bibimguksu', 'Spicy Noodles with Sea Snails', NULL, 400.00, 1, 1, 35, '2026-01-27 19:51:41', NULL, NULL),
(168, 2, 44, 'N4-1 Shin Ramyun Mild', NULL, NULL, 180.00, 1, 1, 35, '2026-01-27 19:52:06', NULL, NULL),
(169, 2, 44, 'N4-1 Shin Ramyun Spicy', NULL, NULL, 180.00, 1, 1, 35, '2026-01-27 19:52:20', NULL, NULL),
(170, 2, 44, 'N4-2 Jjapageti', NULL, NULL, 180.00, 1, 1, 35, '2026-01-27 19:52:35', NULL, NULL),
(171, 2, 50, 'Nagji bibimbab', NULL, NULL, 380.00, 1, 1, 35, '2026-01-27 19:52:56', NULL, NULL),
(172, 2, 45, 'Nalchial Jumeokbab 1', NULL, NULL, 0.00, 1, 1, 35, '2026-01-27 19:53:17', NULL, NULL),
(173, 2, 45, 'Nalchial Jumeokbab 2', NULL, NULL, 0.00, 1, 1, 35, '2026-01-27 19:53:27', NULL, NULL),
(174, 2, 37, 'Nogari', NULL, NULL, 700.00, 1, 1, 35, '2026-01-27 19:53:45', NULL, NULL),
(175, 2, 38, 'Orange Juice', NULL, NULL, 80.00, 1, 1, 35, '2026-01-27 19:53:55', NULL, NULL),
(176, 2, 46, 'P1 Samgyeopsal', 'Grilled Pork Belly 200g', NULL, 400.00, 1, 1, 35, '2026-01-27 19:54:25', NULL, NULL),
(177, 2, 46, 'P2 Hangjeongsal', 'Grilled Marinated Pork Galbi 200g', NULL, 400.00, 1, 1, 35, '2026-01-27 19:54:43', NULL, NULL),
(178, 2, 38, 'Pineapple', NULL, NULL, 80.00, 1, 1, 35, '2026-01-27 19:54:57', NULL, NULL),
(179, 2, 34, 'Ramyeon Sari', NULL, NULL, 100.00, 1, 1, 35, '2026-01-27 19:55:09', NULL, NULL),
(180, 2, 38, 'Royal', NULL, NULL, 80.00, 1, 1, 35, '2026-01-27 19:55:21', NULL, NULL),
(181, 2, 49, 'S1 Premium Set A (2Pax)', 'Iberico Pork Neck + Premium Pork Jowl + Premium Pork Belly + Beef Chuck Flap Tail + Fruit Punch', NULL, 1480.00, 1, 1, 35, '2026-01-27 19:55:59', NULL, NULL),
(182, 2, 49, 'S2 Premium Set B (4Pax)', 'Iberico Pork Neck + Premium Pork Jowl + Premium Pork Belly + Beef Chuck Flap Tail + Fruit Punch', NULL, 2880.00, 1, 1, 35, '2026-01-27 19:56:19', NULL, NULL),
(183, 2, 50, 'SA-1 Bean sprout Special Meal A Set', 'Spicy Stir-Fried Pork and Bulgogi + Bean Sprout Rice or Hot Stone Pot Rice Choice One + Soybean Paste Stew + Cast Iron Pan Fried Eggs in Perilla Oil', NULL, 650.00, 1, 1, 35, '2026-01-27 19:59:32', NULL, NULL),
(184, 2, 50, 'SA-2 Pot rice Special Meal A Set', NULL, NULL, 650.00, 1, 1, 35, '2026-01-27 19:59:44', NULL, NULL),
(185, 2, 38, 'Saero', NULL, NULL, 300.00, 1, 1, 35, '2026-01-27 20:00:05', NULL, NULL),
(186, 2, 38, 'San Miguel Apple', NULL, NULL, 120.00, 1, 1, 35, '2026-01-27 20:00:17', NULL, NULL),
(187, 2, 38, 'San Miguel Light', NULL, NULL, 120.00, 1, 1, 35, '2026-01-27 20:00:28', NULL, NULL),
(188, 2, 38, 'San Miguel Pilsen', NULL, NULL, 120.00, 1, 1, 35, '2026-01-27 20:00:38', NULL, NULL),
(189, 2, 50, 'SB-1 Bean sprout Special Meal B Set', 'Stone-Grilled L.A Galbi + Bean Sprout Rice or Hot Stone Pot Rice Choice One + Soybean Paste Stew + Cast Iron Pan Fried Eggs in Perilla Oil', NULL, 780.00, 1, 1, 35, '2026-01-27 20:01:05', NULL, NULL),
(190, 2, 50, 'SB-2 Pot rice Bean sprout Special Meal B Set', NULL, NULL, 780.00, 1, 1, 35, '2026-01-27 20:01:34', NULL, NULL),
(191, 2, 50, 'SB-2 Special Meal B Set', NULL, NULL, 780.00, 1, 1, 35, '2026-01-27 20:01:46', NULL, NULL),
(192, 2, 48, 'Small steam egg(service)', NULL, NULL, 0.00, 1, 1, 35, '2026-01-27 20:02:04', NULL, NULL),
(193, 2, 38, 'Sprite', NULL, NULL, 80.00, 1, 1, 35, '2026-01-27 20:02:14', NULL, NULL),
(194, 2, 48, 'Svc Dwanjangjjigae', NULL, NULL, 0.00, 1, 1, 35, '2026-01-27 20:02:37', NULL, NULL),
(195, 2, 48, 'Svc moksal kimchijjigae', NULL, NULL, 0.00, 1, 1, 35, '2026-01-27 20:02:43', NULL, NULL),
(196, 2, 48, 'Svc muktae', NULL, NULL, 0.00, 1, 1, 35, '2026-01-27 20:02:50', NULL, NULL),
(197, 2, 48, 'Svc PotatoJeon', NULL, NULL, 0.00, 1, 1, 35, '2026-01-27 20:03:06', NULL, NULL),
(198, 2, 48, 'Svc, Dwanjang Sulbab', NULL, NULL, 0.00, 1, 1, 35, '2026-01-27 20:03:14', NULL, NULL),
(199, 2, 48, 'Svc1 kimchisulbab', NULL, NULL, 0.00, 1, 1, 35, '2026-01-27 20:03:28', NULL, NULL),
(200, 2, 37, 'Tteokbokki', NULL, NULL, 500.00, 1, 1, 35, '2026-01-27 20:03:46', NULL, NULL),
(201, 2, 50, 'Woodeugalbitang', NULL, NULL, 500.00, 1, 1, 35, '2026-01-27 20:04:08', NULL, NULL),
(202, 2, 50, 'I will be happy.', 'Yuksam bibim', NULL, 450.00, 1, 1, 35, '2026-01-27 20:04:22', 35, '2026-01-27 20:10:06'),
(203, 2, 50, 'Yuksam muksabal', NULL, NULL, 450.00, 1, 1, 35, '2026-01-27 20:04:53', NULL, NULL),
(204, 2, 50, 'Yuksam mulnaeng', NULL, NULL, 450.00, 1, 1, 35, '2026-01-27 20:05:11', NULL, NULL),
(205, 2, 49, 'Prepayment 5000p', NULL, NULL, 0.00, 1, 1, 35, '2026-01-27 20:07:07', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `IDNo` int(10) UNSIGNED NOT NULL,
  `USER_ID` int(10) UNSIGNED NOT NULL,
  `BRANCH_ID` int(10) UNSIGNED NOT NULL,
  `TITLE` varchar(255) NOT NULL DEFAULT '',
  `MESSAGE` text DEFAULT NULL,
  `TYPE` varchar(50) NOT NULL DEFAULT 'info',
  `LINK` varchar(500) DEFAULT NULL,
  `IS_READ` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `CREATED_DT` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`IDNo`, `USER_ID`, `BRANCH_ID`, `TITLE`, `MESSAGE`, `TYPE`, `LINK`, `IS_READ`, `CREATED_DT`) VALUES
(25, 35, 2, 'New Order', 'Order #ORD-20260219-160359 created. Total: ₱3,750', 'order', NULL, 0, '2026-02-19 16:04:08'),
(26, 35, 2, 'New Order', 'Order #ORD-20260219-160508 created. Total: ₱8,400', 'order', NULL, 0, '2026-02-19 16:05:23'),
(27, 35, 2, 'New Order', 'Order #ORD-20260219-180001 created. Total: ₱18,000', 'order', NULL, 0, '2026-02-19 18:00:23');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `IDNo` int(11) NOT NULL,
  `BRANCH_ID` int(11) NOT NULL,
  `ORDER_NO` varchar(30) NOT NULL,
  `TABLE_ID` int(11) DEFAULT NULL,
  `ORDER_TYPE` enum('DINE_IN','TAKE_OUT','DELIVERY') DEFAULT NULL,
  `STATUS` tinyint(4) NOT NULL DEFAULT 3 COMMENT '3=PENDING, 2=CONFIRMED; 1=SETTLED; -1=CANCELLED	',
  `SUBTOTAL` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Sum of all order item totals',
  `TAX_AMOUNT` decimal(10,2) NOT NULL DEFAULT 0.00,
  `SERVICE_CHARGE` decimal(10,2) NOT NULL DEFAULT 0.00,
  `DISCOUNT_AMOUNT` decimal(10,2) NOT NULL DEFAULT 0.00,
  `GRAND_TOTAL` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Final amount to be paid',
  `ENCODED_DT` datetime NOT NULL DEFAULT current_timestamp(),
  `ENCODED_BY` int(11) NOT NULL,
  `EDITED_DT` datetime DEFAULT NULL,
  `EDITED_BY` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `IDNo` int(11) NOT NULL,
  `ORDER_ID` int(11) NOT NULL,
  `MENU_ID` int(11) NOT NULL,
  `QTY` int(11) NOT NULL,
  `UNIT_PRICE` decimal(10,2) NOT NULL,
  `LINE_TOTAL` decimal(10,2) NOT NULL COMMENT 'QTY * UNIT_PRICE',
  `STATUS` tinyint(4) NOT NULL DEFAULT 3 COMMENT '	3=PENDING; 2=PREPARING; 1=READY	',
  `REMARKS` varchar(255) DEFAULT NULL,
  `ENCODED_DT` datetime NOT NULL DEFAULT current_timestamp(),
  `ENCODED_BY` int(11) NOT NULL,
  `EDITED_DT` datetime DEFAULT NULL,
  `EDITED_BY` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`IDNo`, `ORDER_ID`, `MENU_ID`, `QTY`, `UNIT_PRICE`, `LINE_TOTAL`, `STATUS`, `REMARKS`, `ENCODED_DT`, `ENCODED_BY`, `EDITED_DT`, `EDITED_BY`) VALUES
(211, 79, 20, 1, 1300.00, 1300.00, 1, NULL, '2026-01-21 15:48:06', 28, '2026-01-22 16:13:48', 28),
(216, 80, 18, 1, 2500.00, 2500.00, 1, NULL, '2026-01-21 16:11:15', 29, '2026-01-21 16:41:56', 28),
(217, 80, 17, 1, 3300.00, 3300.00, 1, NULL, '2026-01-21 16:11:15', 29, '2026-01-21 16:41:56', 28),
(219, 80, 40, 1, 700.00, 700.00, 1, NULL, '2026-01-21 16:19:51', 21, '2026-01-21 16:41:56', 28),
(221, 81, 16, 1, 4000.00, 4000.00, 1, NULL, '2026-01-21 16:21:50', 28, '2026-01-21 16:24:57', 28),
(222, 81, 41, 2, 400.00, 800.00, 1, NULL, '2026-01-21 16:21:50', 28, '2026-01-21 16:24:57', 28),
(223, 81, 15, 1, 600.00, 600.00, 1, NULL, '2026-01-21 16:22:20', 20, '2026-01-21 16:24:57', 28),
(224, 80, 9, 1, 500.00, 500.00, 1, NULL, '2026-01-21 16:24:09', 21, '2026-01-21 16:41:56', 28),
(225, 82, 3, 1, 1800.00, 1800.00, 1, NULL, '2026-01-21 16:26:04', 21, '2026-01-22 16:13:50', 28),
(228, 84, 7, 1, 2500.00, 2500.00, 1, NULL, '2026-01-21 19:23:12', 30, '2026-01-22 09:42:07', 28),
(229, 85, 3, 1, 1800.00, 1800.00, 1, NULL, '2026-01-22 01:03:22', 29, '2026-01-22 01:06:19', 9),
(230, 86, 4, 1, 1900.00, 1900.00, 1, NULL, '2026-01-22 01:06:48', 29, '2026-01-22 01:09:32', 9),
(233, 88, 12, 1, 1100.00, 1100.00, 1, NULL, '2026-01-22 01:19:42', 9, '2026-01-22 16:13:51', 28),
(234, 89, 10, 1, 400.00, 400.00, 1, NULL, '2026-01-22 01:20:22', 29, '2026-01-22 01:21:59', 9),
(235, 90, 9, 1, 500.00, 500.00, 1, NULL, '2026-01-22 01:29:14', 29, '2026-01-22 02:01:01', 9),
(236, 91, 23, 1, 550.00, 550.00, 1, NULL, '2026-01-22 14:08:08', 21, '2026-01-22 14:09:23', 28),
(237, 91, 26, 1, 2500.00, 2500.00, 1, NULL, '2026-01-22 14:08:08', 21, '2026-01-22 14:09:23', 28),
(238, 91, 25, 1, 2000.00, 2000.00, 1, NULL, '2026-01-22 14:08:08', 21, '2026-01-22 14:09:23', 28),
(239, 91, 19, 1, 800.00, 800.00, 1, NULL, '2026-01-22 14:08:08', 21, '2026-01-22 14:09:23', 28),
(240, 91, 20, 1, 1300.00, 1300.00, 1, NULL, '2026-01-22 14:08:08', 21, '2026-01-22 14:09:23', 28),
(241, 91, 21, 1, 550.00, 550.00, 1, NULL, '2026-01-22 14:08:08', 21, '2026-01-22 14:09:23', 28),
(242, 87, 7, 1, 2500.00, 2500.00, 1, NULL, '2026-01-22 14:48:31', 9, '2026-01-22 14:56:54', 9),
(243, 83, 4, 1, 1900.00, 1900.00, 1, NULL, '2026-01-22 14:48:34', 9, '2026-01-22 14:48:43', 9),
(244, 83, 7, 1, 2500.00, 2500.00, 1, NULL, '2026-01-22 14:48:34', 9, '2026-01-22 14:48:44', 9),
(245, 92, 3, 1, 1800.00, 1800.00, 1, NULL, '2026-01-22 14:56:40', 30, '2026-01-22 16:13:36', 28),
(246, 93, 3, 1, 1800.00, 1800.00, 1, NULL, '2026-01-22 15:18:23', 29, '2026-01-22 16:13:45', 28),
(247, 93, 4, 1, 1900.00, 1900.00, 1, NULL, '2026-01-22 15:26:08', 29, '2026-01-22 16:13:45', 28),
(248, 94, 67, 1, 380.00, 380.00, 1, NULL, '2026-01-22 15:39:10', 20, '2026-01-22 16:13:46', 28),
(249, 94, 65, 1, 380.00, 380.00, 1, NULL, '2026-01-22 15:39:10', 20, '2026-01-22 16:13:46', 28),
(250, 94, 63, 1, 300.00, 300.00, 1, NULL, '2026-01-22 15:39:10', 20, '2026-01-22 16:13:46', 28),
(251, 94, 61, 1, 380.00, 380.00, 1, NULL, '2026-01-22 15:39:10', 20, '2026-01-22 16:13:46', 28),
(252, 95, 76, 1, 380.00, 380.00, 1, NULL, '2026-01-22 15:47:36', 20, '2026-01-22 16:13:32', 28),
(253, 95, 73, 1, 380.00, 380.00, 1, NULL, '2026-01-22 15:47:36', 20, '2026-01-22 16:13:32', 28),
(254, 95, 72, 1, 380.00, 380.00, 1, NULL, '2026-01-22 15:47:36', 20, '2026-01-22 16:13:32', 28),
(255, 95, 75, 1, 380.00, 380.00, 1, NULL, '2026-01-22 15:47:36', 20, '2026-01-22 16:13:32', 28),
(256, 95, 74, 1, 380.00, 380.00, 1, NULL, '2026-01-22 15:47:36', 20, '2026-01-22 16:13:32', 28),
(257, 96, 3, 1, 1800.00, 1800.00, 1, NULL, '2026-01-22 15:57:24', 32, '2026-01-22 15:58:18', 28),
(258, 97, 22, 1, 460.00, 460.00, 1, NULL, '2026-01-22 16:14:26', 20, '2026-01-22 16:16:13', 28),
(259, 97, 23, 1, 550.00, 550.00, 1, NULL, '2026-01-22 16:14:26', 20, '2026-01-22 16:16:13', 28),
(260, 97, 20, 1, 1300.00, 1300.00, 1, NULL, '2026-01-22 16:14:26', 20, '2026-01-22 16:16:13', 28),
(266, 99, 20, 1, 1300.00, 1300.00, 3, NULL, '2026-01-22 16:22:18', 20, NULL, NULL),
(267, 99, 19, 1, 800.00, 800.00, 3, NULL, '2026-01-22 16:22:18', 20, NULL, NULL),
(268, 98, 64, 1, 380.00, 380.00, 1, NULL, '2026-01-22 17:03:04', 9, '2026-01-22 17:03:12', 9),
(269, 98, 66, 1, 380.00, 380.00, 1, NULL, '2026-01-22 17:03:04', 9, '2026-01-22 17:03:13', 9),
(270, 98, 8, 1, 500.00, 500.00, 1, NULL, '2026-01-22 17:03:04', 9, '2026-01-22 17:03:15', 9),
(271, 98, 9, 1, 500.00, 500.00, 1, NULL, '2026-01-22 17:03:04', 9, '2026-01-22 17:03:17', 9),
(272, 98, 10, 1, 400.00, 400.00, 1, NULL, '2026-01-22 17:03:04', 9, '2026-01-22 17:03:19', 9),
(273, 100, 3, 1, 1800.00, 1800.00, 1, NULL, '2026-01-22 17:03:37', 21, '2026-01-22 17:05:15', 28),
(287, 101, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-22 19:08:10', 9, NULL, NULL),
(288, 102, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-22 19:08:14', 9, NULL, NULL),
(289, 103, 19, 1, 800.00, 800.00, 1, NULL, '2026-01-22 19:08:16', 9, NULL, NULL),
(290, 103, 20, 1, 1300.00, 1300.00, 1, NULL, '2026-01-22 19:08:16', 9, NULL, NULL),
(291, 103, 21, 1, 550.00, 550.00, 1, NULL, '2026-01-22 19:08:16', 9, NULL, NULL),
(292, 103, 23, 1, 550.00, 550.00, 1, NULL, '2026-01-22 19:08:16', 9, NULL, NULL),
(293, 103, 24, 1, 450.00, 450.00, 1, NULL, '2026-01-22 19:08:16', 9, NULL, NULL),
(294, 104, 3, 1, 1800.00, 1800.00, 1, NULL, '2026-01-22 19:08:19', 9, '2026-01-22 19:08:33', 9),
(295, 104, 7, 1, 2500.00, 2500.00, 1, NULL, '2026-01-22 19:08:19', 9, '2026-01-22 19:08:35', 9),
(296, 104, 4, 1, 1900.00, 1900.00, 1, NULL, '2026-01-22 19:08:19', 9, '2026-01-22 19:08:36', 9),
(297, 104, 10, 1, 400.00, 400.00, 1, NULL, '2026-01-22 19:08:19', 9, '2026-01-22 19:08:38', 9),
(298, 104, 9, 1, 500.00, 500.00, 1, NULL, '2026-01-22 19:08:19', 9, '2026-01-22 19:08:40', 9),
(299, 105, 13, 1, 520.00, 520.00, 1, NULL, '2026-01-22 19:08:21', 9, '2026-01-22 19:08:26', 9),
(301, 106, 41, 1, 400.00, 400.00, 1, NULL, '2026-01-22 21:04:32', 9, '2026-01-22 21:04:36', 9),
(302, 107, 19, 1, 800.00, 800.00, 3, NULL, '2026-01-22 21:05:03', 21, NULL, NULL),
(303, 108, 19, 1, 800.00, 800.00, 3, NULL, '2026-01-22 21:06:39', 21, NULL, NULL),
(304, 109, 41, 1, 400.00, 400.00, 3, NULL, '2026-01-22 21:34:04', 21, NULL, NULL),
(309, 110, 23, 1, 550.00, 550.00, 1, NULL, '2026-01-22 23:02:58', 9, '2026-01-22 23:03:06', 9),
(310, 110, 45, 1, 750.00, 750.00, 1, NULL, '2026-01-22 23:02:58', 9, '2026-01-22 23:03:08', 9),
(311, 110, 42, 2, 450.00, 900.00, 1, NULL, '2026-01-22 23:02:58', 9, '2026-01-22 23:03:13', 9),
(312, 110, 5, 1, 2300.00, 2300.00, 1, NULL, '2026-01-22 23:02:58', 9, '2026-01-22 23:03:16', 9),
(315, 111, 23, 1, 550.00, 550.00, 1, NULL, '2026-01-22 23:27:13', 9, '2026-01-22 23:27:25', 9),
(316, 111, 24, 1, 450.00, 450.00, 1, NULL, '2026-01-22 23:27:13', 9, '2026-01-22 23:27:27', 9),
(318, 112, 23, 1, 550.00, 550.00, 1, NULL, '2026-01-22 23:41:08', 9, '2026-01-22 23:41:19', 9),
(322, 113, 12, 1, 1100.00, 1100.00, 1, NULL, '2026-01-22 23:44:03', 9, '2026-01-22 23:46:45', 9),
(323, 113, 13, 1, 520.00, 520.00, 1, NULL, '2026-01-22 23:44:03', 9, '2026-01-22 23:46:49', 9),
(324, 113, 14, 1, 550.00, 550.00, 1, NULL, '2026-01-22 23:44:03', 9, '2026-01-22 23:46:52', 9),
(325, 113, 20, 1, 1300.00, 1300.00, 1, NULL, '2026-01-22 23:44:20', 21, '2026-01-22 23:46:57', 9),
(326, 113, 24, 1, 450.00, 450.00, 1, NULL, '2026-01-22 23:44:43', 21, '2026-01-22 23:46:59', 9),
(327, 113, 26, 1, 2500.00, 2500.00, 1, NULL, '2026-01-22 23:46:27', 21, '2026-01-22 23:47:01', 9),
(329, 114, 12, 1, 1100.00, 1100.00, 1, NULL, '2026-01-22 23:54:04', 9, '2026-01-22 23:54:37', 9),
(331, 115, 12, 1, 1100.00, 1100.00, 1, NULL, '2026-01-22 23:57:14', 9, '2026-01-23 00:03:33', 9),
(334, 116, 19, 1, 800.00, 800.00, 1, NULL, '2026-01-23 00:13:28', 9, '2026-01-23 00:13:40', 9),
(335, 116, 22, 1, 460.00, 460.00, 1, NULL, '2026-01-23 00:13:28', 9, '2026-01-23 00:13:42', 9),
(337, 117, 19, 1, 800.00, 800.00, 1, NULL, '2026-01-23 00:18:33', 9, '2026-01-23 00:28:24', 9),
(339, 118, 19, 1, 800.00, 800.00, 1, NULL, '2026-01-23 00:29:05', 9, '2026-01-23 00:29:43', 9),
(341, 119, 23, 1, 550.00, 550.00, 1, NULL, '2026-01-23 00:45:00', 9, '2026-01-23 00:50:15', 9),
(342, 120, 4, 1, 1900.00, 1900.00, 1, NULL, '2026-01-23 00:50:36', 21, '2026-01-23 12:18:00', 9),
(343, 121, 19, 1, 800.00, 800.00, 3, NULL, '2026-01-23 00:51:32', 21, NULL, NULL),
(345, 122, 19, 1, 800.00, 800.00, 1, NULL, '2026-01-23 00:53:35', 9, '2026-01-23 00:53:47', 9),
(346, 123, 13, 1, 520.00, 520.00, 1, NULL, '2026-01-23 00:55:18', 21, '2026-01-23 12:18:20', 9),
(347, 124, 4, 1, 1900.00, 1900.00, 1, NULL, '2026-01-23 00:57:08', 21, '2026-01-23 12:18:27', 9),
(349, 125, 7, 1, 2500.00, 2500.00, 1, NULL, '2026-01-23 00:57:34', 9, '2026-01-23 00:57:42', 9),
(350, 126, 12, 1, 1100.00, 1100.00, 1, NULL, '2026-01-23 00:59:30', 21, '2026-01-23 12:18:12', 9),
(351, 127, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-23 01:02:58', 21, NULL, NULL),
(352, 128, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 01:03:39', 21, NULL, NULL),
(353, 129, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-23 01:07:58', 21, NULL, NULL),
(354, 130, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-23 01:11:06', 21, NULL, NULL),
(355, 131, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-23 01:11:28', 21, NULL, NULL),
(358, 132, 37, 1, 1200.00, 1200.00, 1, NULL, '2026-01-23 01:15:15', 9, '2026-01-23 01:15:26', 9),
(359, 132, 41, 1, 400.00, 400.00, 1, NULL, '2026-01-23 01:15:15', 9, '2026-01-23 01:15:29', 9),
(361, 133, 22, 1, 460.00, 460.00, 1, NULL, '2026-01-23 01:17:40', 9, '2026-01-23 01:25:28', 9),
(363, 134, 20, 1, 1300.00, 1300.00, 1, NULL, '2026-01-23 12:04:21', 9, '2026-01-23 12:11:05', 9),
(367, 135, 15, 1, 600.00, 600.00, 1, NULL, '2026-01-23 12:17:16', 9, '2026-01-23 12:22:39', 9),
(368, 135, 12, 1, 1100.00, 1100.00, 1, NULL, '2026-01-23 12:17:16', 9, '2026-01-23 12:22:41', 9),
(369, 135, 13, 1, 520.00, 520.00, 1, NULL, '2026-01-23 12:17:16', 9, '2026-01-23 12:22:45', 9),
(371, 136, 12, 1, 1100.00, 1100.00, 1, NULL, '2026-01-23 12:25:10', 9, '2026-01-23 12:28:28', 9),
(373, 137, 23, 1, 550.00, 550.00, 1, NULL, '2026-01-23 12:31:59', 9, '2026-01-23 12:35:12', 9),
(375, 138, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 12:35:42', 9, NULL, NULL),
(376, 139, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 12:41:48', 32, NULL, NULL),
(377, 140, 3, 1, 1800.00, 1800.00, 1, NULL, '2026-01-23 12:42:42', 32, '2026-01-23 12:44:10', 9),
(379, 141, 13, 1, 520.00, 520.00, 3, NULL, '2026-01-23 12:47:38', 9, NULL, NULL),
(381, 142, 20, 1, 1300.00, 1300.00, 1, NULL, '2026-01-23 12:53:40', 9, '2026-01-23 13:00:09', 9),
(383, 143, 4, 1, 1900.00, 1900.00, 1, NULL, '2026-01-23 13:01:56', 9, '2026-01-23 13:02:34', 9),
(385, 144, 19, 1, 800.00, 800.00, 1, NULL, '2026-01-23 13:05:33', 9, '2026-01-23 13:17:29', 9),
(386, 145, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 13:18:01', 21, NULL, NULL),
(388, 146, 12, 1, 1100.00, 1100.00, 1, NULL, '2026-01-23 13:19:41', 9, '2026-01-23 13:19:51', 9),
(390, 147, 12, 1, 1100.00, 1100.00, 1, NULL, '2026-01-23 13:23:39', 9, '2026-01-23 13:24:04', 9),
(391, 148, 32, 1, 950.00, 950.00, 3, NULL, '2026-01-23 13:26:19', 21, NULL, NULL),
(393, 149, 3, 1, 1800.00, 1800.00, 1, NULL, '2026-01-23 13:39:33', 9, '2026-01-23 13:39:51', 9),
(394, 150, 6, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 13:40:08', 21, NULL, NULL),
(396, 151, 3, 1, 1800.00, 1800.00, 1, NULL, '2026-01-23 13:44:55', 9, '2026-01-23 13:45:06', 9),
(397, 152, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 13:50:49', 21, NULL, NULL),
(398, 153, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 13:54:48', 21, NULL, NULL),
(399, 154, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 13:56:41', 21, NULL, NULL),
(400, 155, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 13:58:49', 21, NULL, NULL),
(401, 156, 7, 1, 2500.00, 2500.00, 3, NULL, '2026-01-23 13:59:16', 21, NULL, NULL),
(402, 157, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 14:03:18', 21, NULL, NULL),
(403, 157, 13, 1, 520.00, 520.00, 3, NULL, '2026-01-23 14:03:51', 21, NULL, NULL),
(404, 157, 13, 1, 520.00, 520.00, 3, NULL, '2026-01-23 14:04:08', 21, NULL, NULL),
(405, 157, 14, 1, 550.00, 550.00, 3, NULL, '2026-01-23 14:04:23', 21, NULL, NULL),
(406, 158, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 14:04:45', 21, NULL, NULL),
(407, 159, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 14:09:02', 21, NULL, NULL),
(408, 159, 7, 1, 2500.00, 2500.00, 3, NULL, '2026-01-23 14:09:22', 21, NULL, NULL),
(409, 159, 15, 1, 600.00, 600.00, 3, NULL, '2026-01-23 14:13:42', 21, NULL, NULL),
(410, 159, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 14:14:00', 21, NULL, NULL),
(411, 159, 13, 1, 520.00, 520.00, 3, NULL, '2026-01-23 14:14:08', 21, NULL, NULL),
(412, 160, 13, 1, 520.00, 520.00, 3, NULL, '2026-01-23 14:15:33', 21, NULL, NULL),
(413, 160, 13, 1, 520.00, 520.00, 3, NULL, '2026-01-23 14:15:40', 21, NULL, NULL),
(414, 160, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 14:16:45', 21, NULL, NULL),
(415, 160, 38, 1, 400.00, 400.00, 3, NULL, '2026-01-23 14:19:16', 21, NULL, NULL),
(416, 160, 41, 1, 400.00, 400.00, 3, NULL, '2026-01-23 14:19:41', 21, NULL, NULL),
(417, 160, 41, 1, 400.00, 400.00, 3, NULL, '2026-01-23 14:20:02', 21, NULL, NULL),
(418, 160, 41, 1, 400.00, 400.00, 3, NULL, '2026-01-23 14:20:22', 21, NULL, NULL),
(419, 160, 38, 1, 400.00, 400.00, 3, NULL, '2026-01-23 14:20:39', 21, NULL, NULL),
(420, 160, 37, 1, 1200.00, 1200.00, 3, NULL, '2026-01-23 14:20:56', 21, NULL, NULL),
(421, 161, 37, 1, 1200.00, 1200.00, 3, NULL, '2026-01-23 14:21:20', 21, NULL, NULL),
(422, 161, 38, 1, 400.00, 400.00, 3, NULL, '2026-01-23 14:21:33', 21, NULL, NULL),
(423, 161, 38, 1, 400.00, 400.00, 3, NULL, '2026-01-23 14:21:41', 21, NULL, NULL),
(424, 161, 39, 1, 400.00, 400.00, 3, NULL, '2026-01-23 14:22:01', 21, NULL, NULL),
(425, 161, 39, 1, 400.00, 400.00, 3, NULL, '2026-01-23 14:22:09', 21, NULL, NULL),
(426, 161, 38, 1, 400.00, 400.00, 3, NULL, '2026-01-23 14:23:53', 21, NULL, NULL),
(433, 162, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 14:27:45', 9, NULL, NULL),
(434, 162, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-23 14:27:45', 9, NULL, NULL),
(435, 162, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-23 14:27:45', 9, NULL, NULL),
(436, 162, 6, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 14:27:45', 9, NULL, NULL),
(437, 162, 7, 1, 2500.00, 2500.00, 3, NULL, '2026-01-23 14:27:45', 9, NULL, NULL),
(438, 162, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 14:27:45', 9, NULL, NULL),
(439, 163, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 14:33:48', 21, NULL, NULL),
(440, 164, 13, 1, 520.00, 520.00, 3, NULL, '2026-01-23 14:33:57', 21, NULL, NULL),
(441, 164, 7, 1, 2500.00, 2500.00, 3, NULL, '2026-01-23 14:36:40', 21, NULL, NULL),
(444, 165, 16, 1, 4000.00, 4000.00, 1, NULL, '2026-01-23 14:39:20', 9, '2026-01-23 14:39:32', 9),
(445, 165, 12, 1, 1100.00, 1100.00, 1, NULL, '2026-01-23 14:39:20', 9, '2026-01-23 14:39:33', 9),
(449, 166, 19, 1, 800.00, 800.00, 1, NULL, '2026-01-23 14:41:31', 9, '2026-01-23 14:41:38', 9),
(450, 166, 20, 1, 1300.00, 1300.00, 1, NULL, '2026-01-23 14:41:31', 9, '2026-01-23 14:41:40', 9),
(451, 166, 20, 1, 1300.00, 1300.00, 1, NULL, '2026-01-23 14:41:31', 9, '2026-01-23 14:41:41', 9),
(452, 167, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 14:47:28', 21, NULL, NULL),
(453, 167, 13, 1, 520.00, 520.00, 3, NULL, '2026-01-23 14:47:36', 21, NULL, NULL),
(454, 167, 14, 1, 550.00, 550.00, 3, NULL, '2026-01-23 14:47:44', 21, NULL, NULL),
(455, 167, 15, 1, 600.00, 600.00, 3, NULL, '2026-01-23 14:47:52', 21, NULL, NULL),
(456, 167, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 14:47:58', 21, NULL, NULL),
(457, 167, 13, 1, 520.00, 520.00, 3, NULL, '2026-01-23 14:48:07', 21, NULL, NULL),
(458, 167, 14, 1, 550.00, 550.00, 3, NULL, '2026-01-23 14:48:34', 21, NULL, NULL),
(459, 167, 15, 1, 600.00, 600.00, 3, NULL, '2026-01-23 14:48:56', 21, NULL, NULL),
(460, 167, 7, 1, 2500.00, 2500.00, 3, NULL, '2026-01-23 14:52:07', 21, NULL, NULL),
(461, 167, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-23 14:55:58', 21, NULL, NULL),
(462, 167, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 14:56:40', 21, NULL, NULL),
(463, 167, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 14:58:23', 21, NULL, NULL),
(464, 168, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 14:58:55', 21, NULL, NULL),
(465, 168, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-23 14:58:55', 21, NULL, NULL),
(466, 168, 7, 1, 2500.00, 2500.00, 3, NULL, '2026-01-23 14:58:55', 21, NULL, NULL),
(467, 168, 7, 1, 2500.00, 2500.00, 3, NULL, '2026-01-23 14:59:49', 21, NULL, NULL),
(468, 168, 7, 1, 2500.00, 2500.00, 3, NULL, '2026-01-23 15:00:12', 21, NULL, NULL),
(473, 169, 3, 1, 1800.00, 1800.00, 1, NULL, '2026-01-23 15:06:00', 9, '2026-01-23 15:06:05', 9),
(474, 169, 7, 1, 2500.00, 2500.00, 1, NULL, '2026-01-23 15:06:00', 9, '2026-01-23 15:06:06', 9),
(475, 169, 7, 1, 2500.00, 2500.00, 1, NULL, '2026-01-23 15:06:00', 9, '2026-01-23 15:06:08', 9),
(476, 169, 4, 1, 1900.00, 1900.00, 1, NULL, '2026-01-23 15:06:00', 9, '2026-01-23 15:06:09', 9),
(477, 169, 7, 1, 2500.00, 2500.00, 1, NULL, '2026-01-23 15:07:10', 21, '2026-01-23 15:07:21', 9),
(478, 170, 19, 1, 800.00, 800.00, 3, NULL, '2026-01-23 15:12:37', 21, NULL, NULL),
(479, 170, 20, 1, 1300.00, 1300.00, 3, NULL, '2026-01-23 15:12:52', 21, NULL, NULL),
(480, 170, 19, 1, 800.00, 800.00, 3, NULL, '2026-01-23 15:13:05', 21, NULL, NULL),
(481, 170, 20, 1, 1300.00, 1300.00, 3, NULL, '2026-01-23 15:13:05', 21, NULL, NULL),
(482, 170, 17, 1, 3300.00, 3300.00, 3, NULL, '2026-01-23 15:23:46', 21, NULL, NULL),
(483, 170, 18, 1, 2500.00, 2500.00, 3, NULL, '2026-01-23 15:23:46', 21, NULL, NULL),
(484, 170, 16, 1, 4000.00, 4000.00, 3, NULL, '2026-01-23 15:23:46', 21, NULL, NULL),
(485, 171, 8, 1, 500.00, 500.00, 3, NULL, '2026-01-23 16:05:50', 21, NULL, NULL),
(486, 172, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 16:08:08', 9, NULL, NULL),
(487, 173, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-23 16:10:00', 21, NULL, NULL),
(488, 173, 6, 1, 1100.00, 1100.00, 3, NULL, '2026-01-23 16:10:00', 21, NULL, NULL),
(489, 173, 11, 1, 550.00, 550.00, 3, NULL, '2026-01-23 16:10:00', 21, NULL, NULL),
(490, 173, 96, 1, 850.00, 850.00, 3, NULL, '2026-01-23 16:11:58', 21, NULL, NULL),
(491, 173, 97, 1, 300.00, 300.00, 3, NULL, '2026-01-23 16:11:58', 21, NULL, NULL),
(492, 173, 99, 1, 80.00, 80.00, 3, NULL, '2026-01-23 16:11:58', 21, NULL, NULL),
(493, 173, 99, 1, 80.00, 80.00, 3, NULL, '2026-01-23 16:12:24', 21, NULL, NULL),
(494, 173, 100, 1, 200.00, 200.00, 3, NULL, '2026-01-23 16:12:24', 21, NULL, NULL),
(495, 174, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 16:19:52', 32, NULL, NULL),
(496, 174, 5, 1, 2300.00, 2300.00, 3, NULL, '2026-01-23 16:19:52', 32, NULL, NULL),
(497, 174, 5, 1, 2300.00, 2300.00, 3, NULL, '2026-01-23 16:20:02', 32, NULL, NULL),
(498, 174, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 16:53:58', 32, NULL, NULL),
(499, 174, 7, 1, 2500.00, 2500.00, 3, NULL, '2026-01-23 16:57:21', 32, NULL, NULL),
(500, 175, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 16:57:48', 32, NULL, NULL),
(501, 175, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 16:59:08', 32, NULL, NULL),
(502, 175, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-23 16:59:08', 32, NULL, NULL),
(503, 175, 7, 1, 2500.00, 2500.00, 3, NULL, '2026-01-23 16:59:08', 32, NULL, NULL),
(504, 176, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 17:05:44', 21, NULL, NULL),
(505, 176, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-23 17:05:44', 21, NULL, NULL),
(506, 176, 7, 1, 2500.00, 2500.00, 3, NULL, '2026-01-23 17:05:52', 21, NULL, NULL),
(507, 177, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-23 17:10:34', 32, NULL, NULL),
(508, 177, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-23 17:10:41', 32, NULL, NULL),
(509, 176, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-26 10:28:31', 21, NULL, NULL),
(510, 176, 6, 1, 1100.00, 1100.00, 3, NULL, '2026-01-26 10:28:31', 21, NULL, NULL),
(511, 176, 7, 1, 2500.00, 2500.00, 3, NULL, '2026-01-26 10:28:31', 21, NULL, NULL),
(512, 178, 7, 1, 2500.00, 2500.00, 3, NULL, '2026-01-26 10:39:40', 20, NULL, NULL),
(514, 179, 9, 1, 500.00, 500.00, 1, NULL, '2026-01-26 10:41:00', 9, '2026-01-26 10:41:09', 9),
(515, 178, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-26 10:46:26', 31, NULL, NULL),
(516, 178, 9, 1, 500.00, 500.00, 3, NULL, '2026-01-26 10:46:36', 31, NULL, NULL),
(517, 180, 6, 1, 1100.00, 1100.00, 3, NULL, '2026-01-26 10:50:18', 31, NULL, NULL),
(518, 180, 15, 1, 600.00, 600.00, 3, NULL, '2026-01-26 11:04:34', 31, NULL, NULL),
(519, 180, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-26 11:05:07', 31, NULL, NULL),
(520, 180, 9, 1, 500.00, 500.00, 3, NULL, '2026-01-26 11:10:53', 31, NULL, NULL),
(521, 180, 9, 1, 500.00, 500.00, 3, NULL, '2026-01-26 11:12:45', 31, NULL, NULL),
(522, 180, 18, 1, 2500.00, 2500.00, 3, NULL, '2026-01-26 11:18:34', 31, NULL, NULL),
(523, 180, 9, 1, 500.00, 500.00, 3, NULL, '2026-01-26 11:18:48', 31, NULL, NULL),
(524, 180, 15, 1, 600.00, 600.00, 3, NULL, '2026-01-26 11:23:01', 31, NULL, NULL),
(525, 178, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-26 11:24:09', 31, NULL, NULL),
(526, 180, 9, 1, 500.00, 500.00, 3, NULL, '2026-01-26 11:37:19', 31, NULL, NULL),
(527, 180, 15, 1, 600.00, 600.00, 3, NULL, '2026-01-26 11:40:37', 31, NULL, NULL),
(528, 181, 9, 1, 500.00, 500.00, 3, NULL, '2026-01-26 11:44:52', 31, NULL, NULL),
(529, 181, 6, 1, 1100.00, 1100.00, 3, NULL, '2026-01-26 12:05:37', 31, NULL, NULL),
(530, 182, 67, 1, 380.00, 380.00, 3, NULL, '2026-01-26 12:10:17', 20, NULL, NULL),
(531, 182, 12, 1, 1100.00, 1100.00, 3, NULL, '2026-01-26 12:11:07', 31, NULL, NULL),
(534, 184, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-26 19:08:15', 9, NULL, NULL),
(535, 183, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-26 19:08:18', 9, NULL, NULL),
(538, 186, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-26 19:12:04', 9, NULL, NULL),
(539, 185, 3, 1, 1800.00, 1800.00, 3, NULL, '2026-01-26 19:12:07', 9, NULL, NULL),
(541, 187, 3, 1, 1800.00, 1800.00, 1, NULL, '2026-01-26 19:12:41', 9, '2026-01-26 19:12:51', 9),
(542, 188, 23, 1, 550.00, 550.00, 3, NULL, '2026-01-27 10:54:32', 20, NULL, NULL),
(543, 189, 14, 2, 550.00, 1100.00, 3, NULL, '2026-01-27 10:56:15', 21, NULL, NULL),
(548, 190, 4, 1, 1900.00, 1900.00, 3, NULL, '2026-01-27 14:42:49', 9, NULL, NULL),
(549, 190, 7, 1, 2500.00, 2500.00, 3, NULL, '2026-01-27 14:42:49', 9, NULL, NULL),
(550, 190, 21, 1, 550.00, 550.00, 3, NULL, '2026-01-27 14:42:49', 9, NULL, NULL),
(551, 190, 23, 1, 550.00, 550.00, 3, NULL, '2026-01-27 14:42:49', 9, NULL, NULL),
(552, 191, 115, 1, 300.00, 300.00, 3, NULL, '2026-02-11 19:22:07', 35, NULL, NULL),
(553, 192, 126, 1, 750.00, 750.00, 3, NULL, '2026-02-12 12:32:17', 35, NULL, NULL),
(554, 192, 127, 3, 280.00, 840.00, 3, NULL, '2026-02-12 12:32:17', 35, NULL, NULL),
(555, 193, 160, 13, 400.00, 5200.00, 3, NULL, '2026-02-12 12:33:11', 35, NULL, NULL),
(556, 193, 128, 5, 350.00, 1750.00, 3, NULL, '2026-02-12 12:33:11', 35, NULL, NULL),
(557, 194, 126, 1, 750.00, 750.00, 3, NULL, '2026-02-12 15:52:38', 35, NULL, NULL),
(558, 195, 127, 4, 280.00, 1120.00, 3, NULL, '2026-02-12 15:53:07', 4, NULL, NULL),
(559, 196, 127, 1, 280.00, 280.00, 3, NULL, '2026-02-12 15:56:27', 35, NULL, NULL),
(560, 197, 127, 1, 280.00, 280.00, 3, NULL, '2026-02-12 15:56:43', 35, NULL, NULL),
(561, 198, 128, 40, 350.00, 14000.00, 3, NULL, '2026-02-12 16:16:31', 35, NULL, NULL),
(562, 199, 110, 100, 280.00, 28000.00, 3, NULL, '2026-02-12 16:20:23', 35, NULL, NULL),
(563, 200, 128, 5, 350.00, 1750.00, 3, NULL, '2026-02-13 18:22:23', 35, NULL, NULL),
(564, 201, 120, 11, 950.00, 10450.00, 3, NULL, '2026-02-13 18:22:41', 35, NULL, NULL),
(565, 202, 117, 19, 50.00, 950.00, 3, NULL, '2026-02-14 06:24:01', 35, NULL, NULL),
(566, 203, 127, 4, 280.00, 1120.00, 3, NULL, '2026-02-14 06:24:38', 35, NULL, NULL),
(567, 204, 114, 101, 300.00, 30300.00, 3, NULL, '2026-02-12 18:37:25', 35, NULL, NULL),
(568, 205, 126, 32, 750.00, 24000.00, 3, NULL, '2026-02-13 06:38:12', 35, NULL, NULL),
(569, 206, 110, 33, 280.00, 9240.00, 3, NULL, '2026-02-13 06:38:51', 35, NULL, NULL),
(570, 207, 113, 34, 200.00, 6800.00, 3, NULL, '2026-02-13 10:48:04', 35, NULL, NULL),
(571, 208, 128, 1, 350.00, 350.00, 3, NULL, '2026-02-13 11:50:25', 35, NULL, NULL),
(572, 209, 115, 103, 300.00, 30900.00, 3, NULL, '2026-02-13 16:51:45', 35, NULL, NULL),
(573, 210, 119, 150, 800.00, 120000.00, 3, NULL, '2026-02-13 16:54:25', 35, NULL, NULL),
(574, 211, 128, 200, 350.00, 70000.00, 3, NULL, '2026-02-13 16:58:40', 35, NULL, NULL),
(575, 212, 112, 500, 200.00, 100000.00, 3, NULL, '2026-02-13 17:00:34', 35, NULL, NULL),
(576, 213, 128, 1, 350.00, 350.00, 3, NULL, '2026-02-17 17:11:28', 35, NULL, NULL),
(577, 214, 110, 1, 280.00, 280.00, 3, NULL, '2026-02-18 14:20:40', 35, NULL, NULL),
(578, 215, 110, 1, 280.00, 280.00, 3, NULL, '2026-02-18 14:46:25', 35, NULL, NULL),
(579, 216, 110, 1, 280.00, 280.00, 3, NULL, '2026-02-18 15:00:49', 35, NULL, NULL),
(580, 217, 110, 1, 280.00, 280.00, 3, NULL, '2026-02-18 15:31:39', 35, NULL, NULL),
(581, 218, 110, 1, 280.00, 280.00, 3, NULL, '2026-02-18 15:34:38', 35, NULL, NULL),
(582, 219, 127, 30, 280.00, 8400.00, 3, NULL, '2026-02-19 15:53:56', 35, NULL, NULL),
(583, 220, 126, 5, 750.00, 3750.00, 3, NULL, '2026-02-19 16:04:08', 35, NULL, NULL),
(584, 221, 127, 30, 280.00, 8400.00, 3, NULL, '2026-02-19 16:05:22', 35, NULL, NULL),
(585, 222, 149, 30, 600.00, 18000.00, 3, NULL, '2026-02-19 18:00:23', 35, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `payment_transactions`
--

CREATE TABLE `payment_transactions` (
  `IDNo` int(11) NOT NULL,
  `ORDER_ID` int(11) NOT NULL,
  `PAYMENT_METHOD` enum('CASH','GCASH','MAYA','CARD') DEFAULT NULL,
  `AMOUNT_PAID` decimal(10,2) NOT NULL,
  `PAYMENT_REF` varchar(100) DEFAULT NULL,
  `ENCODED_DT` datetime DEFAULT current_timestamp(),
  `ENCODED_BY` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_transactions`
--

INSERT INTO `payment_transactions` (`IDNo`, `ORDER_ID`, `PAYMENT_METHOD`, `AMOUNT_PAID`, `PAYMENT_REF`, `ENCODED_DT`, `ENCODED_BY`) VALUES
(158, 220, 'CASH', 3750.00, NULL, '2026-02-19 16:04:15', 35),
(159, 221, 'CASH', 8400.00, NULL, '2026-02-19 16:10:55', 35),
(160, 222, 'CASH', 18000.00, NULL, '2026-02-19 18:00:33', 35);

-- --------------------------------------------------------

--
-- Table structure for table `product_sales_summary`
--

CREATE TABLE `product_sales_summary` (
  `id` int(11) NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `category` varchar(100) NOT NULL,
  `sales_quantity` int(11) DEFAULT 0,
  `total_sales` decimal(15,2) DEFAULT 0.00,
  `refund_quantity` int(11) DEFAULT 0,
  `refund_amount` decimal(15,2) DEFAULT 0.00,
  `discounts` decimal(15,2) DEFAULT 0.00,
  `net_sales` decimal(15,2) DEFAULT 0.00,
  `unit_cost` decimal(15,2) DEFAULT 0.00,
  `total_revenue` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `receipts`
--

CREATE TABLE `receipts` (
  `id` int(11) NOT NULL,
  `receipt_number` varchar(50) NOT NULL,
  `receipt_date` datetime NOT NULL,
  `employee_name` varchar(150) NOT NULL,
  `customer_name` varchar(150) DEFAULT NULL,
  `transaction_type` varchar(50) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_tables`
--

CREATE TABLE `restaurant_tables` (
  `IDNo` int(11) NOT NULL,
  `BRANCH_ID` int(11) NOT NULL,
  `TABLE_NUMBER` varchar(10) NOT NULL,
  `CAPACITY` int(11) DEFAULT NULL,
  `STATUS` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=AVAILABLE; 2=OCCUPIED;  3=NOT AVAILABLE 4=RESERVED;',
  `ENCODED_BY` varchar(100) NOT NULL,
  `ENCODED_DT` timestamp NOT NULL DEFAULT current_timestamp(),
  `ACTIVE` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurant_tables`
--

INSERT INTO `restaurant_tables` (`IDNo`, `BRANCH_ID`, `TABLE_NUMBER`, `CAPACITY`, `STATUS`, `ENCODED_BY`, `ENCODED_DT`, `ACTIVE`) VALUES
(1, 1, '1', 4, 1, '9', '2026-01-14 06:46:14', 1),
(2, 1, '2', 4, 1, '9', '2026-01-14 06:46:39', 1),
(5, 1, '3', 5, 1, '9', '2026-01-16 05:59:56', 1),
(6, 1, '4', 4, 1, '9', '2026-01-16 11:59:43', 1),
(7, 2, '5', 4, 1, '9', '2026-01-16 11:59:50', 0),
(8, 1, '5', 2, 1, '9', '2026-01-21 11:37:46', 1),
(9, 1, '6', 2, 1, '9', '2026-01-21 12:02:47', 1),
(10, 1, '7', 2, 1, '9', '2026-01-21 12:03:03', 1),
(11, 1, '8', 2, 1, '9', '2026-01-21 12:03:14', 1),
(12, 1, '9', 4, 1, '9', '2026-01-21 12:03:25', 1),
(13, 1, '10', 4, 1, '9', '2026-01-21 12:03:39', 1),
(14, 1, '20', 1, 1, '9', '2026-01-22 09:53:03', 1),
(15, 2, '1', 16, 1, '35', '2026-02-12 07:52:16', 0),
(16, 2, '1', 5, 1, '35', '2026-02-17 07:05:36', 1),
(17, 2, '2', 5, 1, '35', '2026-02-17 07:05:42', 1),
(18, 2, '3', 5, 1, '35', '2026-02-17 07:05:48', 1),
(19, 2, '4', 6, 1, '35', '2026-02-17 07:05:55', 1),
(20, 2, '5', 6, 1, '35', '2026-02-17 07:06:04', 1);

-- --------------------------------------------------------

--
-- Table structure for table `sales_category_report`
--

CREATE TABLE `sales_category_report` (
  `id` int(11) NOT NULL,
  `category` varchar(255) NOT NULL,
  `sales_quantity` int(11) DEFAULT 0,
  `total_sales` decimal(15,2) DEFAULT 0.00,
  `refund_quantity` int(11) DEFAULT 0,
  `refund_amount` decimal(15,2) DEFAULT 0.00,
  `discounts` decimal(15,2) DEFAULT 0.00,
  `net_sales` decimal(15,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_hourly_summary`
--

CREATE TABLE `sales_hourly_summary` (
  `id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `sale_datetime` datetime NOT NULL,
  `total_sales` decimal(15,2) DEFAULT 0.00,
  `refund` decimal(15,2) DEFAULT 0.00,
  `discount` decimal(15,2) DEFAULT 0.00,
  `net_sales` decimal(15,2) DEFAULT 0.00,
  `product_unit_price` decimal(15,2) DEFAULT 0.00,
  `gross_profit` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaction_log`
--

CREATE TABLE `transaction_log` (
  `receipt_number` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `employee` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `customer` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `type` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `total` decimal(18,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_branches`
--

CREATE TABLE `user_branches` (
  `USER_ID` int(11) NOT NULL,
  `BRANCH_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_branches`
--

INSERT INTO `user_branches` (`USER_ID`, `BRANCH_ID`) VALUES
(4, 1),
(4, 2),
(4, 4),
(9, 1),
(19, 1),
(20, 1),
(21, 1),
(22, 1),
(25, 1),
(26, 1),
(27, 1),
(28, 1),
(29, 1),
(30, 1),
(31, 1),
(32, 1),
(33, 1),
(34, 1),
(34, 2),
(34, 3),
(35, 2),
(36, 3);

-- --------------------------------------------------------

--
-- Table structure for table `user_info`
--

CREATE TABLE `user_info` (
  `IDNo` int(11) NOT NULL,
  `TABLE_ID` int(11) DEFAULT NULL,
  `FIRSTNAME` varchar(50) NOT NULL,
  `LASTNAME` varchar(50) NOT NULL,
  `USERNAME` varchar(50) NOT NULL,
  `PASSWORD` varchar(255) NOT NULL,
  `SALT` varchar(255) NOT NULL,
  `PERMISSIONS` int(11) NOT NULL COMMENT '1 is for admin only',
  `LAST_LOGIN` datetime NOT NULL,
  `ENCODED_BY` int(11) DEFAULT NULL,
  `ENCODED_DT` datetime DEFAULT NULL,
  `EDITED_BY` int(11) DEFAULT NULL,
  `EDITED_DT` datetime DEFAULT NULL,
  `ACTIVE` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_info`
--

INSERT INTO `user_info` (`IDNo`, `TABLE_ID`, `FIRSTNAME`, `LASTNAME`, `USERNAME`, `PASSWORD`, `SALT`, `PERMISSIONS`, `LAST_LOGIN`, `ENCODED_BY`, `ENCODED_DT`, `EDITED_BY`, `EDITED_DT`, `ACTIVE`) VALUES
(4, NULL, 'admin', '', 'admin', '$argon2id$v=19$m=65536,t=3,p=4$vK+fD3zlwuM8LwMzXHiU0Q$Gh2Vs2/HXH/p84NKNrN0llMGRmf3dz16nm+OgVf3rUc', 'cD1GRUb3PRYmyeJfQlJNcUFXWxPhAAHeG3jhbZcHgXwK17FZNa', 1, '2024-04-12 21:02:35', 1, '2024-04-12 21:02:35', 9, '2024-10-07 11:29:45', 1),
(9, NULL, 'Daraejung', 'Back Office', 'djung', '$argon2id$v=19$m=65536,t=3,p=4$vK+fD3zlwuM8LwMzXHiU0Q$Gh2Vs2/HXH/p84NKNrN0llMGRmf3dz16nm+OgVf3rUc', '', 3, '2026-01-16 14:32:53', 4, '2024-09-05 02:20:40', 4, '2026-01-27 17:42:31', 1),
(19, 1, 'table001', 'table001', 'table001', '$argon2id$v=19$m=65536,t=3,p=4$BS3NBnm3kV1mCS7+RwNjlg$J7er6tuEWBayqkfrZbxNiaH2MEN5uYbNYuYOG8CxUeI', 'PAl5ZTGaHg4FT5leH9tLahBhJJ8zzIMk02P7XJ7CVUEdiPGScY', 2, '2026-01-22 14:26:57', 9, '2026-01-15 01:54:49', NULL, NULL, 1),
(20, 2, 'table002', 'table002', 'table002', '$argon2id$v=19$m=65536,t=3,p=4$9fnFVurZmYBXTp/fwat4Ng$zQTHdd+Vph6O3k8L10uGLM2C73CgK2lMGb7CIX1jHq4', '1vT4UbMRggzfb0g496u3RICQlGsaEcyoWELsenFzUQgDjs0280', 2, '2026-01-27 10:54:20', 9, '2026-01-16 14:57:45', 9, '2026-01-16 19:45:52', 1),
(21, 5, 'table003', 'table003', 'table003', '$argon2id$v=19$m=65536,t=3,p=4$vK+fD3zlwuM8LwMzXHiU0Q$Gh2Vs2/HXH/p84NKNrN0llMGRmf3dz16nm+OgVf3rUc', 'xyHMd0iCsESI3rUztl9IHAz6hdvrnQWmgBEtkaCD1JXL4Kl6NF', 2, '2026-01-27 12:26:40', 9, '2026-01-16 19:45:30', NULL, NULL, 1),
(22, NULL, 'romar', 'maniago', 'romar', '$argon2id$v=19$m=65536,t=3,p=4$B5veEawT38PndWO6vPtQ5A$Xa6UmBUAQbGWJEIO4yRswhJkNhrId7KQBThh5kxsTQo', 'nzvenlVFV6hAJlssagY4yFVcALxyYmXBwM4lOp536QEq8CaJN2', 15, '2026-01-20 15:00:13', 9, '2026-01-20 15:00:13', NULL, NULL, 1),
(25, NULL, 'z', 'z', 'z', '$argon2id$v=19$m=65536,t=3,p=4$/zFnYoR7tm5V6p8F0ab5yw$xNwheX8fWJ+ZIXpds5SfyvCzdobagM8f7nMFJw4cYj8', 'UaZEAWKTLXEgrNv9AHWURLLkatQpCN7QpP1Mai9ivbohyssCAR', 15, '2026-01-20 16:29:14', 22, '2026-01-20 16:29:14', NULL, NULL, 1),
(26, NULL, 'dada', 'dada', 'dada', '$argon2id$v=19$m=65536,t=3,p=4$NB0MfLdVICkXDxK3iXg0aw$c3N/GWhEiyZFV5MBqAQ8ML24pe4uWjtkrQCRnaDId8Q', 'OcE2W2mOBi7U4IYlJ7VK6st5CHEa67rbAdRQATYemIy5vCYAn1', 16, '2026-01-20 17:18:42', 9, '2026-01-20 17:18:42', 4, '2026-01-21 12:06:20', 0),
(27, NULL, 'wawa', 'wawa', '123', '$argon2id$v=19$m=65536,t=3,p=4$X32nGiw05pZ80V5WoA521w$bIYubyKVlOZVmnjDn4V+afbB42zJtd9VlzMybOKn6HY', 'hcteU8pnc6vhhSJvl3mKyZOiPDCwTb9h5QdyHcpZiy8rssDH7k', 14, '2026-01-20 17:22:00', 4, '2026-01-20 17:22:00', NULL, NULL, 1),
(28, NULL, 'Kitchen', 'Kitchen', 'kitchen', '$argon2id$v=19$m=65536,t=3,p=4$myA/oTVdfGNN6ghcPlPgvg$y0l+Wex1eqQwftP1lvAFMjqwmwb9rNMoYeddGwM2DBM', 'DUZ0KuoTQ5tLsiqd79p5AQ75NBeISBSdE5FqKhPyxcjlyMKw7W', 16, '2026-01-27 14:41:28', 9, '2026-01-21 15:38:24', 9, '2026-01-22 22:54:40', 1),
(29, NULL, 'waiter001', 'waiter001', 'waiter001', '$argon2id$v=19$m=65536,t=3,p=4$M/U4bBuSKmD4Ep9XupJfzw$s5l9b2ze4y3UafCsaHDQgH2ZrCHeZHXDL15vIpbRwi4', '0wDpR5vEZpKpMjZp7TcVEIAmw084S3pOY9R0f2NJ7c6yviMocs', 14, '2026-01-27 14:43:02', 9, '2026-01-21 15:45:21', NULL, NULL, 1),
(30, 6, 'table004', 'table004', 'table004', '$argon2id$v=19$m=65536,t=3,p=4$ZCvYZiFWevOxaO4dDPPRXw$YWupql61ZuTF21BwFFW4RBAhPjJx+VGxYpEk12WB744', 'oR6XHA5PXa07mxIjpb5eYMeHTDADIMxjkF2vY6ZGJ3dVK17QCf', 2, '2026-01-27 12:23:22', 9, '2026-01-21 17:49:53', NULL, NULL, 1),
(31, NULL, 'Cashier', 'Cashier', 'cashier', '$argon2id$v=19$m=65536,t=3,p=4$RoYZIpXqtYfnSxCBLjGcnA$onEsTCfgVwCbBWP4XU31Zx2R0vv8AAimoJrmPljCc1Y', 'T2g74HeXEp29Vekx3lRLTKQMDJbRJz3Rg3qo4Y0WFJSCNolMqd', 15, '2026-01-27 17:00:29', 9, '2026-01-22 11:00:55', 9, '2026-01-22 22:55:07', 1),
(32, 8, 'table005', 'table005', 'table005', '$argon2id$v=19$m=65536,t=3,p=4$QNFU1UQwSF5cKRyvbJNy0A$w94V8c+TtUsXjWMlItwF8gwXCuLjMQZR6BygPAjqclw', '3GAiYSlSmVxKWT6aXmDLLIJeRe4Bd4N01XTxHePOteue9YzfIa', 2, '2026-01-23 17:10:20', 9, '2026-01-22 15:56:51', NULL, NULL, 1),
(33, NULL, 'betrnk', 'betrnk', 'betrnk', '$argon2id$v=19$m=65536,t=3,p=4$9TvhQnU7+LflN7BknkVtPg$o2EetKVI/8WCJdG4XLCwPZrUiPebqTjOrawyibYo8To', 'ouShh6Oj0b2FyaFBmvjH1ejQ8lk69xrJDWDystaZ3kUNskAoQP', 3, '2026-01-27 14:41:51', 9, '2026-01-27 14:41:51', NULL, NULL, 1),
(35, NULL, 'Kim\'s Brothers', 'Back Office', 'kimsb', '$argon2id$v=19$m=65536,t=3,p=4$NfxooYX2Q5fRke7PMXPuEw$z2XyxI+ocB/SY0mFJ1HPvYm5PjzaEsYPpy4DX0/bXfA', 'JKYG0FhRYSDgjwIkLgbO4g0Crr9zP6C8Pwi9EzJO4UsN2eXUaZ', 3, '2026-01-27 17:41:04', 4, '2026-01-27 17:41:04', NULL, NULL, 1),
(36, NULL, 'Blue Moon', 'Back Office', 'bmoon', '$argon2id$v=19$m=65536,t=3,p=4$Pxa5hh1i3PInmsOzJWfvCw$WkkN84ynv6DDhcxjafZti+KQBpQjgLUSXOmNM/L1VKY', 'Q0SFmlUDuQOKmOXGIeO5GZ16xGq1BXNlwZssNrRfPXpZVTqvZ7', 3, '2026-01-27 17:42:12', 4, '2026-01-27 17:42:12', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_role`
--

CREATE TABLE `user_role` (
  `IDNo` int(11) NOT NULL,
  `ROLE` varchar(50) NOT NULL,
  `ENCODED_BY` int(11) NOT NULL,
  `ENCODED_DT` datetime NOT NULL,
  `EDITED_BY` int(11) DEFAULT NULL,
  `EDITED_DT` datetime DEFAULT NULL,
  `ACTIVE` bit(1) NOT NULL DEFAULT b'1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_role`
--

INSERT INTO `user_role` (`IDNo`, `ROLE`, `ENCODED_BY`, `ENCODED_DT`, `EDITED_BY`, `EDITED_DT`, `ACTIVE`) VALUES
(1, 'Administrator', 1, '2024-04-06 01:01:07', NULL, NULL, b'1'),
(2, 'Table-TabletMenu', 9, '2026-01-15 01:52:03', NULL, NULL, b'1'),
(3, 'Manager', 1, '2026-01-21 04:55:27', NULL, NULL, b'1'),
(14, 'Waiter/Waitress', 9, '2026-01-15 03:44:34', NULL, NULL, b'1'),
(15, 'Cashier', 9, '2026-01-15 03:44:43', NULL, NULL, b'1'),
(16, 'Kitchen', 9, '2026-01-15 03:44:53', NULL, NULL, b'1');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`IDNo`);

--
-- Indexes for table `billing`
--
ALTER TABLE `billing`
  ADD PRIMARY KEY (`IDNo`),
  ADD KEY `idx_billing_order_id` (`ORDER_ID`),
  ADD KEY `idx_billing_status` (`STATUS`),
  ADD KEY `idx_billing_encoded_dt` (`ENCODED_DT`),
  ADD KEY `idx_billing_order_status` (`ORDER_ID`,`STATUS`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`IDNo`),
  ADD UNIQUE KEY `BRANCH_CODE` (`BRANCH_CODE`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`IDNo`),
  ADD KEY `idx_categories_active` (`ACTIVE`),
  ADD KEY `idx_categories_cat_name` (`CAT_NAME`);

--
-- Indexes for table `discount_report`
--
ALTER TABLE `discount_report`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `employee`
--
ALTER TABLE `employee`
  ADD PRIMARY KEY (`IDNo`);

--
-- Indexes for table `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`IDNo`),
  ADD KEY `CATEGORY_ID` (`CATEGORY_ID`),
  ADD KEY `idx_menu_category_id` (`CATEGORY_ID`),
  ADD KEY `idx_menu_active` (`ACTIVE`),
  ADD KEY `idx_menu_is_available` (`IS_AVAILABLE`),
  ADD KEY `idx_menu_active_available` (`ACTIVE`,`IS_AVAILABLE`),
  ADD KEY `idx_menu_category_available` (`CATEGORY_ID`,`ACTIVE`,`IS_AVAILABLE`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`IDNo`),
  ADD KEY `idx_notifications_user_id` (`USER_ID`),
  ADD KEY `idx_notifications_user_branch` (`USER_ID`,`BRANCH_ID`),
  ADD KEY `idx_notifications_user_read` (`USER_ID`,`IS_READ`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`IDNo`),
  ADD KEY `idx_orders_order_no` (`ORDER_NO`),
  ADD KEY `idx_orders_table_id` (`TABLE_ID`),
  ADD KEY `idx_orders_status` (`STATUS`),
  ADD KEY `idx_orders_encoded_dt` (`ENCODED_DT`),
  ADD KEY `idx_orders_table_status` (`TABLE_ID`,`STATUS`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`IDNo`),
  ADD KEY `idx_order_items_order_id` (`ORDER_ID`),
  ADD KEY `idx_order_items_menu_id` (`MENU_ID`),
  ADD KEY `idx_order_items_status` (`STATUS`),
  ADD KEY `idx_order_items_encoded_dt` (`ENCODED_DT`),
  ADD KEY `idx_order_items_order_status` (`ORDER_ID`,`STATUS`);

--
-- Indexes for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD PRIMARY KEY (`IDNo`),
  ADD KEY `idx_payment_transactions_order_id` (`ORDER_ID`),
  ADD KEY `idx_payment_transactions_encoded_dt` (`ENCODED_DT`);

--
-- Indexes for table `product_sales_summary`
--
ALTER TABLE `product_sales_summary`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product` (`product_name`),
  ADD KEY `idx_category` (`category`);

--
-- Indexes for table `receipts`
--
ALTER TABLE `receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`),
  ADD KEY `idx_receipt_date` (`receipt_date`),
  ADD KEY `idx_receipt_number` (`receipt_number`);

--
-- Indexes for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  ADD PRIMARY KEY (`IDNo`),
  ADD KEY `idx_restaurant_tables_table_number` (`TABLE_NUMBER`),
  ADD KEY `idx_restaurant_tables_status` (`STATUS`);

--
-- Indexes for table `sales_category_report`
--
ALTER TABLE `sales_category_report`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_category` (`category`);

--
-- Indexes for table `sales_hourly_summary`
--
ALTER TABLE `sales_hourly_summary`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_branch` (`branch_id`),
  ADD KEY `idx_datetime` (`sale_datetime`);

--
-- Indexes for table `user_branches`
--
ALTER TABLE `user_branches`
  ADD PRIMARY KEY (`USER_ID`,`BRANCH_ID`);

--
-- Indexes for table `user_info`
--
ALTER TABLE `user_info`
  ADD PRIMARY KEY (`IDNo`),
  ADD KEY `idx_user_info_username` (`USERNAME`),
  ADD KEY `idx_user_info_active` (`ACTIVE`),
  ADD KEY `idx_user_info_table_id` (`TABLE_ID`),
  ADD KEY `idx_user_info_active_table` (`ACTIVE`,`TABLE_ID`);

--
-- Indexes for table `user_role`
--
ALTER TABLE `user_role`
  ADD PRIMARY KEY (`IDNo`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `billing`
--
ALTER TABLE `billing`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=223;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `discount_report`
--
ALTER TABLE `discount_report`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `employee`
--
ALTER TABLE `employee`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `menu`
--
ALTER TABLE `menu`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=206;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `IDNo` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=223;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=586;

--
-- AUTO_INCREMENT for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=161;

--
-- AUTO_INCREMENT for table `product_sales_summary`
--
ALTER TABLE `product_sales_summary`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=515;

--
-- AUTO_INCREMENT for table `receipts`
--
ALTER TABLE `receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1516;

--
-- AUTO_INCREMENT for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `sales_category_report`
--
ALTER TABLE `sales_category_report`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `sales_hourly_summary`
--
ALTER TABLE `sales_hourly_summary`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=471;

--
-- AUTO_INCREMENT for table `user_info`
--
ALTER TABLE `user_info`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `user_role`
--
ALTER TABLE `user_role`
  MODIFY `IDNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `menu`
--
ALTER TABLE `menu`
  ADD CONSTRAINT `menu_ibfk_1` FOREIGN KEY (`CATEGORY_ID`) REFERENCES `categories` (`IDNo`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
