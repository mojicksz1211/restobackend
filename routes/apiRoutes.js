// ============================================
// API ROUTES
// ============================================
// File: routes/apiRoutes.js
// Description: API endpoints for mobile/tablet apps
// Authentication: JWT tokens required for protected endpoints
// ============================================

const express = require('express');
const router = express.Router();
const ApiController = require('../controllers/apiController');
const { authenticateJWT, optionalJWT } = require('../middleware/jwtAuth');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// POST - Login for mobile/tablet app
// URL: /api/login
// Body: { username: "string", password: "string" }
// Response: { success: true, data: {...}, tokens: { accessToken, refreshToken, expiresIn } }
router.post("/login", ApiController.login);

// POST - Refresh access token
// URL: /api/refresh
// Body: { refreshToken: "string" }
// Response: { success: true, tokens: { accessToken, refreshToken, expiresIn } }
router.post("/refresh", ApiController.refreshToken);

// ============================================
// PROTECTED ROUTES (JWT authentication required)
// ============================================

// GET - Get all categories (for filter button)
// URL: /api/categories
// Headers: Authorization: Bearer <accessToken>
// Note: Categories are public, but keeping protected for consistency
router.get("/categories", authenticateJWT, ApiController.getCategories);

// GET - Get all menu items
// URL: /api/menu
// Headers: Authorization: Bearer <accessToken>
// Query params: ?category_id=X (optional - filter by category)
router.get("/menu", authenticateJWT, ApiController.getMenuItems);

// ============================================
// EXPORT
// ============================================

module.exports = router;

