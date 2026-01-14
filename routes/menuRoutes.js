// ============================================
// MENU ROUTES
// ============================================
// File: routes/menuRoutes.js
// Description: Routes for menu endpoints (calls controllers)
// ============================================

const express = require('express');
const router = express.Router();
const { checkSession } = require('./authRoutes');
const MenuController = require('../controllers/menuController');
const upload = require('../middleware/upload');

// ============================================
// GET ROUTES
// ============================================

// GET - Display menu management page
router.get("/manageMenu", checkSession, MenuController.showPage);

// GET - Fetch all menus (for DataTables)
router.get("/menus", checkSession, MenuController.getAll);

// GET - Fetch all categories (for dropdown)
router.get("/categories", checkSession, MenuController.getCategories);

// ============================================
// POST ROUTES
// ============================================

// POST - Create new menu (with file upload)
router.post("/menu", checkSession, upload.single('MENU_IMG'), MenuController.create);

// ============================================
// PUT ROUTES
// ============================================

// PUT - Update menu (with optional file upload)
router.put("/menu/:id", checkSession, upload.single('MENU_IMG'), MenuController.update);

// ============================================
// DELETE ROUTES
// ============================================

// DELETE - Soft delete menu
router.delete("/menu/:id", checkSession, MenuController.delete);

// ============================================
// EXPORT
// ============================================

module.exports = router;

