-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jan 16, 2026 at 05:30 AM
-- Server version: 8.0.40-0ubuntu0.24.04.1
-- PHP Version: 8.3.16

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
-- Table structure for table `billing`
--

CREATE TABLE `billing` (
  `IDNo` int NOT NULL,
  `ORDER_ID` int NOT NULL,
  `PAYMENT_METHOD` enum('CASH','GCASH','MAYA','CARD') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `AMOUNT_DUE` decimal(10,2) NOT NULL,
  `AMOUNT_PAID` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Total amount paid',
  `REMARKS` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `PAYMENT_REF` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'OR number / transaction reference',
  `STATUS` tinyint NOT NULL DEFAULT '3' COMMENT '1=PAID, 2=PARTIAL, 3=UNPAID',
  `ENCODED_DT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ENCODED_BY` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `billing`
--

INSERT INTO `billing` (`IDNo`, `ORDER_ID`, `PAYMENT_METHOD`, `AMOUNT_DUE`, `AMOUNT_PAID`, `REMARKS`, `PAYMENT_REF`, `STATUS`, `ENCODED_DT`, `ENCODED_BY`) VALUES
(23, 23, 'CASH', 850.00, 850.00, NULL, NULL, 1, '2026-01-16 02:46:01', 19),
(24, 24, 'CASH', 3450.00, 0.00, NULL, NULL, 3, '2026-01-16 02:55:12', 9);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `IDNo` int NOT NULL,
  `CAT_NAME` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `CAT_DESC` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ACTIVE` tinyint(1) DEFAULT '1',
  `ENCODED_BY` int DEFAULT NULL,
  `ENCODED_DT` datetime DEFAULT CURRENT_TIMESTAMP,
  `EDITED_BY` int DEFAULT NULL,
  `EDITED_DT` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`IDNo`, `CAT_NAME`, `CAT_DESC`, `ACTIVE`, `ENCODED_BY`, `ENCODED_DT`, `EDITED_BY`, `EDITED_DT`) VALUES
(21, '추천메뉴', 'Featured and recommended menu items', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(22, '추천식사', 'Recommended meal combinations', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(23, '점심특선', 'Special lunch menu items', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(24, '세트메뉴', 'Complete set meals', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(25, '바비큐', 'Barbecue dishes and grilled items', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(26, '해산물', 'Fresh seafood dishes', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(27, '구이전튀김', 'Grilled and fried food items', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(28, '묵은지일품요리', 'Specialty dishes featuring aged kimchi', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(29, '식사류', 'Various meal types and options', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(30, '면류', 'Noodle-based dishes', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(31, '도시락추가메뉴', 'Additional items for lunchbox orders', 1, 0, '2026-01-14 16:41:46', NULL, NULL),
(32, '주류음료', 'Alcoholic drinks and beverages', 1, 0, '2026-01-14 16:41:46', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `menu`
--

CREATE TABLE `menu` (
  `IDNo` int NOT NULL,
  `CATEGORY_ID` int NOT NULL,
  `MENU_NAME` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `MENU_DESCRIPTION` text COLLATE utf8mb4_general_ci,
  `MENU_IMG` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `MENU_PRICE` decimal(10,2) NOT NULL DEFAULT '0.00',
  `IS_AVAILABLE` tinyint(1) DEFAULT '1',
  `ACTIVE` tinyint(1) DEFAULT '1',
  `ENCODED_BY` int DEFAULT NULL,
  `ENCODED_DT` datetime DEFAULT CURRENT_TIMESTAMP,
  `EDITED_BY` int DEFAULT NULL,
  `EDITED_DT` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu`
--

INSERT INTO `menu` (`IDNo`, `CATEGORY_ID`, `MENU_NAME`, `MENU_DESCRIPTION`, `MENU_IMG`, `MENU_PRICE`, `IS_AVAILABLE`, `ACTIVE`, `ENCODED_BY`, `ENCODED_DT`, `EDITED_BY`, `EDITED_DT`) VALUES
(3, 21, '산 새우회', NULL, '/uploads/menu/11. 산 새우회_1800-1768380712665-612918058.webp', 1800.00, 1, 1, NULL, '2026-01-14 16:51:52', NULL, NULL),
(4, 21, '갈비찜', NULL, '/uploads/menu/12. 갈비찜_1900-1768380712680-280977269.webp', 1900.00, 1, 1, NULL, '2026-01-14 16:51:52', NULL, NULL),
(5, 21, '간장게장 500g', NULL, '/uploads/menu/13. 간장게장 500g_2300-1768380712686-149079083.webp', 2300.00, 1, 1, NULL, '2026-01-14 16:51:52', NULL, NULL),
(6, 21, 'LA 갈비', NULL, '/uploads/menu/14. LA 갈비_1100-1768380712696-548159591.webp', 1100.00, 1, 1, NULL, '2026-01-14 16:51:52', NULL, NULL),
(7, 21, '홍어삼합', NULL, '/uploads/menu/15. 홍어삼합_2500-1768380712704-378452038.webp', 2500.00, 1, 1, NULL, '2026-01-14 16:51:52', NULL, NULL),
(8, 22, '백알탕', NULL, '/uploads/menu/21 백알탕_500-1768380881950-700333035.webp', 500.00, 1, 1, NULL, '2026-01-14 16:54:41', NULL, NULL),
(9, 22, '매생이국', NULL, '/uploads/menu/22 매생이국_500-1768380882001-967553682.webp', 500.00, 1, 1, NULL, '2026-01-14 16:54:42', NULL, NULL),
(10, 22, '해물 순두부', NULL, '/uploads/menu/23 해물 순두부_400-1768380882012-338319787.webp', 400.00, 1, 1, NULL, '2026-01-14 16:54:42', NULL, NULL),
(11, 22, '갈비탕', NULL, '/uploads/menu/24 갈비탕_550-1768380882022-865008889.webp', 550.00, 1, 1, NULL, '2026-01-14 16:54:42', NULL, NULL),
(12, 23, '게장정식', NULL, '/uploads/menu/31 게장정식_1100-1768381078268-976753012.webp', 1100.00, 1, 1, NULL, '2026-01-14 16:57:58', NULL, NULL),
(13, 23, '비빔밥', NULL, '/uploads/menu/32 비빔밥_520-1768381078322-420659383.webp', 520.00, 1, 1, NULL, '2026-01-14 16:57:58', NULL, NULL),
(14, 23, '제육까스', NULL, '/uploads/menu/33 제육까스_550-1768381078335-446730005.webp', 550.00, 1, 1, NULL, '2026-01-14 16:57:58', NULL, NULL),
(15, 23, '돼지갈비', NULL, '/uploads/menu/34 돼지갈비_600-1768381078345-873213980.webp', 600.00, 1, 1, NULL, '2026-01-14 16:57:58', NULL, NULL),
(16, 24, '스페샬 한정식 세트', NULL, '/uploads/menu/41 스페샬 한정식 세트_4000-1768381426866-638086401.webp', 4000.00, 1, 1, NULL, '2026-01-14 17:03:46', NULL, NULL),
(17, 24, '다래정세트', NULL, '/uploads/menu/42 다래정세트_3300-1768381426877-836696553.webp', 3300.00, 1, 1, NULL, '2026-01-14 17:03:46', NULL, NULL),
(18, 24, '패밀리세트', NULL, '/uploads/menu/43 패밀리세트_2500-1768381426881-490355734.webp', 2500.00, 1, 1, NULL, '2026-01-14 17:03:46', NULL, NULL),
(19, 25, '양념 소갈비살', NULL, '/uploads/menu/52 양념 소갈비살_800-1768381632043-840116017.webp', 800.00, 1, 1, NULL, '2026-01-14 17:07:12', NULL, NULL),
(20, 25, '생 소갈비', NULL, '/uploads/menu/53 생 소갈비_1300-1768381632060-553565150.webp', 1300.00, 1, 1, NULL, '2026-01-14 17:07:12', NULL, NULL),
(21, 25, '우삼겹', NULL, '/uploads/menu/54 우삼겹_550-1768381632069-898413986.webp', 550.00, 1, 1, NULL, '2026-01-14 17:07:12', NULL, NULL),
(22, 25, '삼겹살', NULL, '/uploads/menu/56 삼겹살_460-1768381632080-487375984.webp', 460.00, 1, 1, NULL, '2026-01-14 17:07:12', NULL, NULL),
(23, 25, '항정살', NULL, '/uploads/menu/57 항정살_550-1768381632087-343823881.webp', 550.00, 1, 1, NULL, '2026-01-14 17:07:12', NULL, NULL),
(24, 25, '대패 삼겹살', NULL, '/uploads/menu/58 대패 삼겹살_450-1768381632096-603810876.webp', 450.00, 1, 1, NULL, '2026-01-14 17:07:12', NULL, NULL),
(25, 25, 'SET 삼겹살+항정살+양념돼지갈비', NULL, '/uploads/menu/B1 SET 삼겹살+항정살+양념돼지갈비_2k-1768381632105-588071028.webp', 2000.00, 1, 1, NULL, '2026-01-14 17:07:12', NULL, NULL),
(26, 25, 'SET 우삼겹+항정살+LA갈비', NULL, '/uploads/menu/B2 SET 우삼겹+항정살+LA갈비_2.5k-1768381632113-727657641.webp', 2500.00, 1, 1, NULL, '2026-01-14 17:07:12', NULL, NULL),
(27, 25, 'SET 생소갈비+LA갈비+양념 소갈비살', NULL, '/uploads/menu/B3 SET 생소갈비+LA갈비+양념 소갈비살_3.2k-1768381632122-921099636.webp', 3200.00, 1, 1, NULL, '2026-01-14 17:07:12', NULL, NULL),
(28, 26, '특대 광어회', NULL, '/uploads/menu/61 특대 광어회_10000-1768381763773-276288799.webp', 10000.00, 1, 1, NULL, '2026-01-14 17:09:23', NULL, NULL),
(29, 26, '도다리회', NULL, '/uploads/menu/62 도다리회_4500-1768381763790-10030237.webp', 4500.00, 1, 1, NULL, '2026-01-14 17:09:23', NULL, NULL),
(30, 26, '간장게장', NULL, '/uploads/menu/63 간장게장_500g 2300-1768381763800-965635264.webp', 2300.00, 1, 1, NULL, '2026-01-14 17:09:23', NULL, NULL),
(31, 26, '새우 소금구이', NULL, '/uploads/menu/65 새우 소금구이_1800-1768381763811-645383038.webp', 1800.00, 1, 1, NULL, '2026-01-14 17:09:23', NULL, NULL),
(32, 26, '코끼리 조개', NULL, '/uploads/menu/66 코끼리 조개_950-1768381763819-769061278.webp', 950.00, 1, 1, NULL, '2026-01-14 17:09:23', NULL, NULL),
(33, 26, '전복 버터구이', NULL, '/uploads/menu/67 전복 버터구이_5pc 1200-1768381763829-885648073.webp', 1200.00, 1, 1, NULL, '2026-01-14 17:09:23', NULL, NULL),
(34, 26, '해물 오뎅탕', NULL, '/uploads/menu/68 해물 오뎅탕_700-1768381763835-848572969.webp', 700.00, 1, 1, NULL, '2026-01-14 17:09:23', NULL, NULL),
(35, 26, '뚝배기 홍합탕', NULL, '/uploads/menu/69 뚝배기 홍합탕_400-1768381763842-360000182.webp', 400.00, 1, 1, NULL, '2026-01-14 17:09:23', NULL, NULL),
(36, 26, '꼬막무침', NULL, '/uploads/menu/70 꼬막무침_1000-1768381763852-778699429.webp', 1000.00, 1, 1, NULL, '2026-01-14 17:09:23', NULL, NULL),
(37, 27, '모둠전', NULL, '/uploads/menu/71 모둠전_1200-1768381949453-241624848.webp', 1200.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(38, 27, '두부전', NULL, '/uploads/menu/72 두부전_400-1768381949465-476846080.webp', 400.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(39, 27, '호박전', NULL, '/uploads/menu/73 호박전_400-1768381949470-651935921.webp', 400.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(40, 27, '고추전', NULL, '/uploads/menu/74 고추전_700-1768381949478-604312929.webp', 700.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(41, 27, '부추전', NULL, '/uploads/menu/75 부추전_400-1768381949485-231978301.webp', 400.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(42, 27, '해물파전', NULL, '/uploads/menu/76 해물파전_450-1768381949493-392901512.webp', 450.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(43, 27, '새우튀김', NULL, '/uploads/menu/77 새우튀김_8pcs 750-1768381949497-883986800.webp', 750.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(44, 27, '큰새우 크림소스', NULL, '/uploads/menu/78 큰새우 크림소스_5pcs 1300-1768381949505-811839734.webp', 1300.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(45, 27, '고등어구이', NULL, '/uploads/menu/79 고등어구이_750-1768381949512-797389255.webp', 750.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(46, 27, '돈까스', NULL, '/uploads/menu/80 돈까스_490-1768381949526-618157341.webp', 490.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(47, 27, '치즈돈까스', NULL, '/uploads/menu/81 치즈돈까스_500-1768381949538-994994959.webp', 500.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(48, 27, '생선까스', NULL, '/uploads/menu/82 생선까스_500-1768381949553-22912311.webp', 500.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(49, 27, '미니 탕수육', NULL, '/uploads/menu/83 미니 탕수육_400-1768381949559-475762428.webp', 400.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(50, 27, '고기만두', NULL, '/uploads/menu/84 고기만두_8pcs 400-1768381949565-161742012.webp', 400.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(51, 27, '군만두', NULL, '/uploads/menu/85 군만두_8pcs 450-1768381949573-190647528.webp', 450.00, 1, 1, NULL, '2026-01-14 17:12:29', NULL, NULL),
(52, 28, '묵은지 김치전골', NULL, '/uploads/menu/81 묵은지 김치전골_1300-1768382108937-173445569.webp', 1300.00, 1, 1, NULL, '2026-01-14 17:15:08', NULL, NULL),
(53, 28, '묵은지 고등어조림', NULL, '/uploads/menu/82 묵은지 고등어조림_1500-1768382108991-299712413.webp', 1500.00, 1, 1, NULL, '2026-01-14 17:15:08', NULL, NULL),
(54, 28, '다래정 불고기', NULL, '/uploads/menu/84 다래정 불고기_850-1768382109005-827467644.webp', 850.00, 1, 1, NULL, '2026-01-14 17:15:09', NULL, NULL),
(55, 28, '콩나물찜', NULL, '/uploads/menu/85 콩나물찜_400-1768382109014-971521188.webp', 400.00, 1, 1, NULL, '2026-01-14 17:15:09', NULL, NULL),
(56, 28, '백알탕 전골', NULL, '/uploads/menu/87 백알탕 전골_1200-1768382109024-409150513.webp', 1200.00, 1, 1, NULL, '2026-01-14 17:15:09', NULL, NULL),
(57, 28, '숯불 쭈꾸미 양념구이', NULL, '/uploads/menu/88 숯불 쭈꾸미 양념구이_1200-1768382109033-623816140.webp', 1200.00, 1, 1, NULL, '2026-01-14 17:15:09', NULL, NULL),
(58, 28, '제육볶음', NULL, '/uploads/menu/89 제육볶음_700-1768382109042-602151445.webp', 700.00, 1, 1, NULL, '2026-01-14 17:15:09', NULL, NULL),
(59, 28, '오징어 볶음', NULL, '/uploads/menu/90 오징어 볶음_750-1768382109053-452199872.webp', 750.00, 1, 1, NULL, '2026-01-14 17:15:09', NULL, NULL),
(60, 29, '김치찌개', NULL, '/uploads/menu/91 김치찌개_380-1768382236201-157990308.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', NULL, NULL),
(61, 29, '미역국', NULL, '/uploads/menu/910 미역국_380-1768382236254-930398756.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', NULL, NULL),
(62, 29, '삼계탕', NULL, '/uploads/menu/911 삼계탕_700-1768382236261-377401549.webp', 700.00, 1, 1, NULL, '2026-01-14 17:17:16', NULL, NULL),
(63, 29, '떡볶이', NULL, '/uploads/menu/912 떡볶이_300-1768382236265-386408439.webp', 300.00, 1, 1, NULL, '2026-01-14 17:17:16', NULL, NULL),
(64, 29, '해물된장찌개', NULL, '/uploads/menu/92 해물된장찌개_380-1768382236275-609551623.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', NULL, NULL),
(65, 29, '청국장', NULL, '/uploads/menu/93 청국장_380-1768382236282-643754167.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', NULL, NULL),
(66, 29, '설렁탕', NULL, '/uploads/menu/94 설렁탕_380-1768382236285-436672251.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', NULL, NULL),
(67, 29, '오징어 덮밥', NULL, '/uploads/menu/95 오징어 덮밥_380-1768382236292-282694162.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', NULL, NULL),
(68, 29, '제육덮밥', NULL, '/uploads/menu/96 제육덮밥_380-1768382236298-607234089.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', NULL, NULL),
(69, 29, '김치 볶음밥', NULL, '/uploads/menu/98 김치 볶음밥_380-1768382236305-23455481.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', NULL, NULL),
(70, 29, '떡국', NULL, '/uploads/menu/99 떡국_380-1768382236311-670489933.webp', 380.00, 1, 1, NULL, '2026-01-14 17:17:16', NULL, NULL),
(71, 30, '초계국수', NULL, '/uploads/menu/101 초계국수_380-1768382364677-460322178.webp', 380.00, 1, 1, NULL, '2026-01-14 17:19:24', NULL, NULL),
(72, 30, '물냉면', NULL, '/uploads/menu/102 물냉면_380-1768382364688-855489826.webp', 380.00, 1, 1, NULL, '2026-01-14 17:19:24', NULL, NULL),
(73, 30, '비빔냉면', NULL, '/uploads/menu/103 비빔냉면_380-1768382364698-756119661.webp', 380.00, 1, 1, NULL, '2026-01-14 17:19:24', NULL, NULL),
(74, 30, '비빔국수', NULL, '/uploads/menu/104 비빔국수_380-1768382364703-474333810.webp', 380.00, 1, 1, NULL, '2026-01-14 17:19:24', NULL, NULL),
(75, 30, '잔치국수', NULL, '/uploads/menu/105 잔치국수_380-1768382364713-595024363.webp', 380.00, 1, 1, NULL, '2026-01-14 17:19:24', NULL, NULL),
(76, 30, '바지락 칼국수', NULL, '/uploads/menu/106 바지락 칼국수_380-1768382364721-175164199.webp', 380.00, 1, 1, NULL, '2026-01-14 17:19:24', NULL, NULL),
(77, 30, '라면', NULL, '/uploads/menu/107 라면_300-1768382364725-222155160.webp', 300.00, 1, 1, NULL, '2026-01-14 17:19:24', NULL, NULL),
(78, 31, '돈까스 도시락', NULL, '/uploads/menu/111 돈까스 도시락_490-1768382493268-24486579.webp', 490.00, 1, 1, NULL, '2026-01-14 17:21:33', NULL, NULL),
(79, 31, '제육불고기 도시락', NULL, '/uploads/menu/112 제육불고기 도시락_490-1768382493325-488434514.webp', 490.00, 1, 1, NULL, '2026-01-14 17:21:33', NULL, NULL),
(80, 31, '소불고기 도시락', NULL, '/uploads/menu/113 소불고기 도시락_490-1768382493335-715789890.webp', 490.00, 1, 1, NULL, '2026-01-14 17:21:33', NULL, NULL),
(81, 31, '오삼불고기 도시락', NULL, '/uploads/menu/114 오삼불고기 도시락_490-1768382493344-710857332.webp', 490.00, 1, 1, NULL, '2026-01-14 17:21:33', NULL, NULL),
(82, 31, '공기밥', NULL, '/uploads/menu/115 공기밥_50-1768382493354-602646183.webp', 50.00, 1, 1, NULL, '2026-01-14 17:21:33', NULL, NULL),
(83, 31, '김', NULL, '/uploads/menu/116 김_30-1768382493366-709192944.webp', 30.00, 1, 1, NULL, '2026-01-14 17:21:33', NULL, NULL),
(84, 31, '계란후라이', NULL, '/uploads/menu/117 계란후라이_50-1768382493374-862510914.webp', 50.00, 1, 1, NULL, '2026-01-14 17:21:33', NULL, NULL),
(85, 31, '계란찜', NULL, '/uploads/menu/118 계란찜_180-1768382493379-293388383.webp', 180.00, 1, 1, NULL, '2026-01-14 17:21:33', NULL, NULL),
(86, 31, '계란말이', NULL, '/uploads/menu/119 계란말이_280-1768382493389-750389617.webp', 280.00, 1, 1, NULL, '2026-01-14 17:21:33', NULL, NULL),
(87, 31, '런천미트', NULL, '/uploads/menu/120 런천미트_4pcs 200-1768382493396-591330899.webp', 200.00, 1, 1, NULL, '2026-01-14 17:21:33', NULL, NULL),
(88, 31, '라면사리', NULL, '/uploads/menu/121 라면사리_60-1768382493401-647972339.webp', 60.00, 1, 1, NULL, '2026-01-14 17:21:33', NULL, NULL),
(89, 31, '두부', NULL, '/uploads/menu/122 두부_100-1768382493408-52633077.webp', 100.00, 1, 1, NULL, '2026-01-14 17:21:33', NULL, NULL),
(90, 31, '쌈야채', NULL, '/uploads/menu/123 쌈야채_150-1768382493412-182322684.webp', 150.00, 1, 1, NULL, '2026-01-14 17:21:33', NULL, NULL),
(91, 31, '당면사리', NULL, '/uploads/menu/124 당면사리_70-1768382493419-42106886.webp', 70.00, 1, 1, NULL, '2026-01-14 17:21:33', NULL, NULL),
(92, 32, '소주', NULL, '/uploads/menu/121 소주_300-1768382591690-798262854.webp', 300.00, 1, 1, NULL, '2026-01-14 17:23:11', NULL, NULL),
(93, 32, '진로이즈백', NULL, '/uploads/menu/122 진로이즈백_300-1768382591707-354451688.webp', 300.00, 1, 1, NULL, '2026-01-14 17:23:11', NULL, NULL),
(94, 32, '새로', NULL, '/uploads/menu/123 새로_300-1768382591716-552401198.webp', 300.00, 1, 1, NULL, '2026-01-14 17:23:11', NULL, NULL),
(95, 32, '막걸리', NULL, '/uploads/menu/124 막걸리_350-1768382591726-540463491.webp', 350.00, 1, 1, NULL, '2026-01-14 17:23:11', NULL, NULL),
(96, 32, '복분자', NULL, '/uploads/menu/125 복분자_850-1768382591736-482212721.webp', 850.00, 1, 1, NULL, '2026-01-14 17:23:11', NULL, NULL),
(97, 32, '카스', NULL, '/uploads/menu/126 카스_300-1768382591747-40987251.webp', 300.00, 1, 1, NULL, '2026-01-14 17:23:11', NULL, NULL),
(98, 32, '맥주', NULL, '/uploads/menu/127 맥주_120-1768382591756-625572540.webp', 120.00, 1, 1, NULL, '2026-01-14 17:23:11', NULL, NULL),
(99, 32, '탄산음료', NULL, '/uploads/menu/128 탄산음료_80-1768382591767-947456520.webp', 80.00, 1, 1, NULL, '2026-01-14 17:23:11', NULL, NULL),
(100, 32, '제주감귤주스', NULL, '/uploads/menu/129 제주감귤주스_200-1768382591771-848793333.webp', 200.00, 1, 1, NULL, '2026-01-14 17:23:11', NULL, NULL),
(101, 32, '탄산수', NULL, '/uploads/menu/130 탄산수_100-1768382591780-387462888.webp', 100.00, 1, 1, NULL, '2026-01-14 17:23:11', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `IDNo` int NOT NULL,
  `ORDER_NO` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  `TABLE_ID` int DEFAULT NULL,
  `ORDER_TYPE` enum('DINE_IN','TAKE_OUT','DELIVERY') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `STATUS` tinyint NOT NULL DEFAULT '3' COMMENT '3=PENDING, 2=CONFIRMED; 1=SETTLED; -1=CANCELLED	',
  `SUBTOTAL` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Sum of all order item totals',
  `TAX_AMOUNT` decimal(10,2) NOT NULL DEFAULT '0.00',
  `SERVICE_CHARGE` decimal(10,2) NOT NULL DEFAULT '0.00',
  `DISCOUNT_AMOUNT` decimal(10,2) NOT NULL DEFAULT '0.00',
  `GRAND_TOTAL` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Final amount to be paid',
  `ENCODED_DT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ENCODED_BY` int NOT NULL,
  `EDITED_DT` datetime DEFAULT NULL,
  `EDITED_BY` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`IDNo`, `ORDER_NO`, `TABLE_ID`, `ORDER_TYPE`, `STATUS`, `SUBTOTAL`, `TAX_AMOUNT`, `SERVICE_CHARGE`, `DISCOUNT_AMOUNT`, `GRAND_TOTAL`, `ENCODED_DT`, `ENCODED_BY`, `EDITED_DT`, `EDITED_BY`) VALUES
(24, 'ORD-20260116-025512', NULL, 'DINE_IN', 2, 3450.00, 0.00, 0.00, 0.00, 3450.00, '2026-01-16 02:55:12', 9, '2026-01-16 02:55:58', 9);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `IDNo` int NOT NULL,
  `ORDER_ID` int NOT NULL,
  `MENU_ID` int NOT NULL,
  `QTY` int NOT NULL,
  `UNIT_PRICE` decimal(10,2) NOT NULL,
  `LINE_TOTAL` decimal(10,2) NOT NULL COMMENT 'QTY * UNIT_PRICE',
  `STATUS` tinyint NOT NULL DEFAULT '3' COMMENT '	3=PENDING; 2=PREPARING; 1=READY	',
  `REMARKS` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ENCODED_DT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ENCODED_BY` int NOT NULL,
  `EDITED_DT` datetime DEFAULT NULL,
  `EDITED_BY` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`IDNo`, `ORDER_ID`, `MENU_ID`, `QTY`, `UNIT_PRICE`, `LINE_TOTAL`, `STATUS`, `REMARKS`, `ENCODED_DT`, `ENCODED_BY`, `EDITED_DT`, `EDITED_BY`) VALUES
(87, 24, 51, 1, 450.00, 450.00, 2, NULL, '2026-01-16 02:55:58', 9, '2026-01-16 02:57:00', 9),
(88, 24, 47, 1, 500.00, 500.00, 2, NULL, '2026-01-16 02:55:58', 9, '2026-01-16 02:57:04', 9),
(89, 24, 18, 1, 2500.00, 2500.00, 2, NULL, '2026-01-16 02:55:58', 9, '2026-01-16 02:57:10', 9);

-- --------------------------------------------------------

--
-- Table structure for table `payment_transactions`
--

CREATE TABLE `payment_transactions` (
  `IDNo` int NOT NULL,
  `ORDER_ID` int NOT NULL,
  `PAYMENT_METHOD` enum('CASH','GCASH','MAYA','CARD') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `AMOUNT_PAID` decimal(10,2) NOT NULL,
  `PAYMENT_REF` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ENCODED_DT` datetime DEFAULT CURRENT_TIMESTAMP,
  `ENCODED_BY` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_transactions`
--

INSERT INTO `payment_transactions` (`IDNo`, `ORDER_ID`, `PAYMENT_METHOD`, `AMOUNT_PAID`, `PAYMENT_REF`, `ENCODED_DT`, `ENCODED_BY`) VALUES
(8, 23, 'CASH', 850.00, '', '2026-01-16 02:48:16', 9);

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_tables`
--

CREATE TABLE `restaurant_tables` (
  `IDNo` int NOT NULL,
  `TABLE_NUMBER` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `CAPACITY` int DEFAULT NULL,
  `STATUS` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=AVAILABLE; 2=OCCUPIED;  3=NOT AVAILABLE 4=RESERVED;',
  `ENCODED_BY` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `ENCODED_DT` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurant_tables`
--

INSERT INTO `restaurant_tables` (`IDNo`, `TABLE_NUMBER`, `CAPACITY`, `STATUS`, `ENCODED_BY`, `ENCODED_DT`) VALUES
(1, '1', 4, 1, '9', '2026-01-14 06:46:14'),
(2, '2', 4, 2, '9', '2026-01-14 06:46:39'),
(3, '3', 5, 1, '9', '2026-01-14 06:46:57'),
(4, '4', 7, 2, '9', '2026-01-14 06:47:14');

-- --------------------------------------------------------

--
-- Table structure for table `user_info`
--

CREATE TABLE `user_info` (
  `IDNo` int NOT NULL,
  `TABLE_ID` int DEFAULT NULL,
  `FIRSTNAME` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `LASTNAME` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `USERNAME` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `PASSWORD` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `SALT` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `PERMISSIONS` int NOT NULL,
  `LAST_LOGIN` datetime NOT NULL,
  `ENCODED_BY` int DEFAULT NULL,
  `ENCODED_DT` datetime DEFAULT NULL,
  `EDITED_BY` int DEFAULT NULL,
  `EDITED_DT` datetime DEFAULT NULL,
  `ACTIVE` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_info`
--

INSERT INTO `user_info` (`IDNo`, `TABLE_ID`, `FIRSTNAME`, `LASTNAME`, `USERNAME`, `PASSWORD`, `SALT`, `PERMISSIONS`, `LAST_LOGIN`, `ENCODED_BY`, `ENCODED_DT`, `EDITED_BY`, `EDITED_DT`, `ACTIVE`) VALUES
(4, NULL, 'admin', '', 'admin', 'cd6c3dadda51b7ff63855c1f538b6701', 'cD1GRUb3PRYmyeJfQlJNcUFXWxPhAAHeG3jhbZcHgXwK17FZNa', 1, '2024-04-12 21:02:35', 1, '2024-04-12 21:02:35', 9, '2024-10-07 11:29:45', 1),
(9, NULL, 'Manager', '', 'manager', '$argon2id$v=19$m=65536,t=3,p=4$vK+fD3zlwuM8LwMzXHiU0Q$Gh2Vs2/HXH/p84NKNrN0llMGRmf3dz16nm+OgVf3rUc', '', 1, '2026-01-16 13:19:12', 4, '2024-09-05 02:20:40', NULL, NULL, 1),
(19, 1, 'table001', 'table001', 'table001', '$argon2id$v=19$m=65536,t=3,p=4$BS3NBnm3kV1mCS7+RwNjlg$J7er6tuEWBayqkfrZbxNiaH2MEN5uYbNYuYOG8CxUeI', 'PAl5ZTGaHg4FT5leH9tLahBhJJ8zzIMk02P7XJ7CVUEdiPGScY', 2, '2026-01-16 13:29:29', 9, '2026-01-15 01:54:49', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_role`
--

CREATE TABLE `user_role` (
  `IDNo` int NOT NULL,
  `ROLE` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `ENCODED_BY` int NOT NULL,
  `ENCODED_DT` datetime NOT NULL,
  `EDITED_BY` int DEFAULT NULL,
  `EDITED_DT` datetime DEFAULT NULL,
  `ACTIVE` bit(1) NOT NULL DEFAULT b'1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_role`
--

INSERT INTO `user_role` (`IDNo`, `ROLE`, `ENCODED_BY`, `ENCODED_DT`, `EDITED_BY`, `EDITED_DT`, `ACTIVE`) VALUES
(1, 'Administrator', 1, '2024-04-06 01:01:07', NULL, NULL, b'1'),
(2, 'Table-TabletMenu', 9, '2026-01-15 01:52:03', NULL, NULL, b'1'),
(14, 'Waiter/Waitress', 9, '2026-01-15 03:44:34', NULL, NULL, b'1'),
(15, 'Cashier', 9, '2026-01-15 03:44:43', NULL, NULL, b'1'),
(16, 'Kitchen', 9, '2026-01-15 03:44:53', NULL, NULL, b'1');

--
-- Indexes for dumped tables
--

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
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`IDNo`),
  ADD KEY `idx_categories_active` (`ACTIVE`),
  ADD KEY `idx_categories_cat_name` (`CAT_NAME`);

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
-- Indexes for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  ADD PRIMARY KEY (`IDNo`),
  ADD KEY `idx_restaurant_tables_table_number` (`TABLE_NUMBER`),
  ADD KEY `idx_restaurant_tables_status` (`STATUS`);

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
-- AUTO_INCREMENT for table `billing`
--
ALTER TABLE `billing`
  MODIFY `IDNo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `IDNo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `menu`
--
ALTER TABLE `menu`
  MODIFY `IDNo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `IDNo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `IDNo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;

--
-- AUTO_INCREMENT for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  MODIFY `IDNo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  MODIFY `IDNo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_info`
--
ALTER TABLE `user_info`
  MODIFY `IDNo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `user_role`
--
ALTER TABLE `user_role`
  MODIFY `IDNo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

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
