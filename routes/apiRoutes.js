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

// GET - Get user orders (for syncing with local storage)
// URL: /api/orders
// Headers: Authorization: Bearer <accessToken>
// Response: { success: true, data: [{ order_id, order_no, items: [...] }] }
router.get("/orders", authenticateJWT, ApiController.getUserOrders);

// GET - Get kitchen orders (all PENDING and CONFIRMED orders)
// URL: /api/kitchen/orders
// Headers: Authorization: Bearer <accessToken>
// Response: { success: true, data: [{ order_id, order_no, table_id, table_number, status, items: [...] }] }
router.get("/kitchen/orders", authenticateJWT, ApiController.getKitchenOrders);

// PATCH - Update kitchen order status
// URL: /api/kitchen/orders/:order_id/status
// Body: { status: number } (allowed: 3=PENDING, 2=PREPARING, 1=READY, -1=CANCELLED)
router.patch("/kitchen/orders/:order_id/status", authenticateJWT, ApiController.updateKitchenOrderStatus);

// POST - Create new order
// URL: /api/orders
// Headers: Authorization: Bearer <accessToken>
// Body: {
//   order_no: "string" (required),
//   table_id: number (optional),
//   order_type: string (optional),
//   subtotal: number (optional, default: 0),
//   tax_amount: number (optional, default: 0),
//   service_charge: number (optional, default: 0),
//   discount_amount: number (optional, default: 0),
//   grand_total: number (optional, default: 0),
//   items: [
//     {
//       menu_id: number (required),
//       qty: number (required),
//       unit_price: number (required),
//       status: number (optional, default: 1)
//     }
//   ] (required, at least one item)
// }
// Response: { success: true, data: { order_id, order_no, table_id, status, grand_total, items_count } }
router.post("/orders", authenticateJWT, ApiController.createOrder);

// POST - Add items to existing order (Additional Order)
// URL: /api/orders/:order_id/items
// Headers: Authorization: Bearer <accessToken>
// Body: {
//   items: [
//     {
//       menu_id: number (required),
//       qty: number (required),
//       unit_price: number (required),
//       status: number (optional, default: 1)
//     }
//   ] (required, at least one item)
// }
// Response: { success: true, data: { order_id, order_no, items_added, new_subtotal, new_grand_total } }
router.post("/orders/:order_id/items", authenticateJWT, ApiController.addItemsToOrder);

// ============================================
// EXPORT
// ============================================

module.exports = router;

