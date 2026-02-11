// ============================================
// DASHBOARD ROUTES
// ============================================
// File: routes/dashboardRoutes.js
// Description: REST API routes for dashboard endpoints
// ============================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/unifiedAuth');
const DashboardController = require('../controllers/dashboardController');

// ============================================
// GET ROUTES
// ============================================

// GET - Get dashboard statistics (supports both JWT and Session auth)
// URL: /dashboard/stats
// Auth: JWT (Bearer token) or Session
router.get("/dashboard/stats", authenticate, DashboardController.getStats);

// ============================================
// EXPORT
// ============================================

module.exports = router;
