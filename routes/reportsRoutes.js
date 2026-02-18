// ============================================
// REPORTS ROUTES
// ============================================
// File: routes/reportsRoutes.js
// Description: Routes for reports and analytics endpoints
// ============================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/unifiedAuth');
const ReportsController = require('../controllers/reportsController');

// ============================================
// GET ROUTES
// ============================================

// GET - Revenue report
// Query: ?period=daily|weekly|monthly&start_date=...&end_date=...&branch_id=...
router.get("/reports/revenue", authenticate, ReportsController.getRevenueReport);

// GET - Order report
// Query: ?start_date=...&end_date=...&branch_id=...&status=...
router.get("/reports/orders", authenticate, ReportsController.getOrderReport);

// GET - Popular menu items
// Query: ?start_date=...&end_date=...&branch_id=...&limit=10
router.get("/reports/menu-items", authenticate, ReportsController.getPopularMenuItems);

// GET - Daily sales by product (for chart)
// Query: ?start_date=...&end_date=...&branch_id=...&limit=5
router.get("/reports/daily-sales-by-product", authenticate, ReportsController.getDailySalesByProduct);

// GET - Table utilization report
// Query: ?start_date=...&end_date=...&branch_id=...
router.get("/reports/tables", authenticate, ReportsController.getTableUtilizationReport);

// GET - Employee performance report
// Query: ?start_date=...&end_date=...&branch_id=...&employee_id=...
router.get("/reports/employees", authenticate, ReportsController.getEmployeePerformanceReport);

// GET - Sales hourly summary (Total Sales Detail modal)
// Query: ?start_date=...&end_date=...&branch_id=...
router.get("/reports/sales-hourly-summary", authenticate, ReportsController.getSalesHourlySummary);

// POST - Import sales hourly summary into sales_hourly_summary table
// Body: { data: [...], branch_id?: string }
router.post("/reports/sales-hourly-summary/import", authenticate, ReportsController.importSalesHourlySummary);

// GET - Receipts (Receipt Storage Box modal)
// Query: ?start_date=...&end_date=...&employee_filter=...&search=...
router.get("/reports/receipts", authenticate, ReportsController.getReceipts);

// POST - Import receipts into receipts table
// Body: { data: [{ receipt_number, receipt_date, employee_name, customer_name, transaction_type, total_amount }, ...] }
router.post("/reports/receipts/import", authenticate, ReportsController.importReceipts);

// GET - Discount report (from discount_report table)
// Query: ?start_date=...&end_date=...&branch_id=...
router.get("/reports/discount", authenticate, ReportsController.getDiscountReport);

// POST - Import discount data into discount_report table
// Body: { data: [{ name, discount_applied, point_discount_amount }, ...] }
router.post("/reports/discount/import", authenticate, ReportsController.importDiscountReport);

// ============================================
// EXPORT
// ============================================

module.exports = router;

