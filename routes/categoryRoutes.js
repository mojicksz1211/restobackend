// ============================================
// CATEGORY ROUTES
// ============================================
// File: routes/categoryRoutes.js
// Description: Routes for category endpoints (calls controllers)
// ============================================

const express = require('express');
const router = express.Router();
const { checkSession } = require('./authRoutes');
const CategoryController = require('../controllers/categoryController');

// ============================================
// GET ROUTES
// ============================================

// GET - Display category management page
router.get("/manageCategory", checkSession, CategoryController.showPage);

// GET - Fetch all categories (for DataTables)
router.get("/categories_list", checkSession, CategoryController.getAll);

// ============================================
// POST ROUTES
// ============================================

// POST - Create new category
router.post("/category", checkSession, CategoryController.create);

// ============================================
// PUT ROUTES
// ============================================

// PUT - Update category
router.put("/category/:id", checkSession, CategoryController.update);

// ============================================
// DELETE ROUTES
// ============================================

// DELETE - Soft delete category
router.delete("/category/:id", checkSession, CategoryController.delete);

// ============================================
// EXPORT
// ============================================

module.exports = router;

