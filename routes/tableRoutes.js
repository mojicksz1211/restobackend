// ============================================
// TABLE ROUTES
// ============================================
// File: routes/tableRoutes.js
// Description: Routes for restaurant table endpoints (calls controllers)
// ============================================

const express = require('express');
const router = express.Router();
const { checkSession } = require('./authRoutes');
const TableController = require('../controllers/tableController');

// ============================================
// GET ROUTES
// ============================================

// GET - Display restaurant table management page
router.get("/manageTable", checkSession, TableController.showPage);

// GET - Fetch all restaurant tables (for DataTables)
router.get("/restaurant_tables", checkSession, TableController.getAll);

// GET - Get transaction history for a table
router.get("/restaurant_table/:id/transactions", checkSession, TableController.getTransactionHistory);

// ============================================
// POST ROUTES
// ============================================

// POST - Create new restaurant table
router.post("/restaurant_table", checkSession, TableController.create);

// ============================================
// PUT ROUTES
// ============================================

// PUT - Update restaurant table
router.put("/restaurant_table/:id", checkSession, TableController.update);

// ============================================
// DELETE ROUTES
// ============================================

// DELETE - Delete restaurant table
router.delete("/restaurant_table/:id", checkSession, TableController.delete);

// ============================================
// EXPORT
// ============================================

module.exports = router;

