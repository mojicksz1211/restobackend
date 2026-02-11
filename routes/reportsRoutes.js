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

// GET - Table utilization report
// Query: ?start_date=...&end_date=...&branch_id=...
router.get("/reports/tables", authenticate, ReportsController.getTableUtilizationReport);

// GET - Employee performance report
// Query: ?start_date=...&end_date=...&branch_id=...&employee_id=...
router.get("/reports/employees", authenticate, ReportsController.getEmployeePerformanceReport);

// ============================================
// EXPORT
// ============================================

module.exports = router;

