// ============================================
// API ROUTES
// ============================================
// File: routes/apiRoutes.js
// Description: Public API endpoints for Android app
// Note: These endpoints do NOT require authentication
// ============================================

const express = require('express');
const router = express.Router();
const ApiController = require('../controllers/apiController');

// ============================================
// GET ROUTES
// ============================================

// GET - Get all categories (for filter button)
// URL: /api/categories
router.get("/categories", ApiController.getCategories);

// GET - Get all menu items
// URL: /api/menu
// Query params: ?category_id=X (optional - filter by category)
router.get("/menu", ApiController.getMenuItems);

// ============================================
// EXPORT
// ============================================

module.exports = router;

