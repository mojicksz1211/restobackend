// ============================================
// EMPLOYEE ROUTES
// ============================================
// File: routes/employeeRoutes.js
// Description: Routes for employee endpoints (calls controllers)
// ============================================

const express = require('express');
const router = express.Router();
const { checkSession } = require('./authRoutes');
const EmployeeController = require('../controllers/employeeController');

// ============================================
// GET ROUTES
// ============================================

// GET - Display employee management page
router.get("/manageEmployee", checkSession, EmployeeController.showPage);

// GET - Fetch all employees (for DataTables)
router.get("/employees_list", checkSession, EmployeeController.getAll);

// GET - Fetch single employee by ID (for edit modal)
router.get("/employee/:id", checkSession, EmployeeController.getById);

// ============================================
// POST ROUTES
// ============================================

// POST - Create new employee
router.post("/employee", checkSession, EmployeeController.create);

// ============================================
// PUT ROUTES
// ============================================

// PUT - Update employee
router.put("/employee/:id", checkSession, EmployeeController.update);

// ============================================
// DELETE ROUTES
// ============================================

// DELETE - Soft delete employee
router.delete("/employee/:id", checkSession, EmployeeController.delete);

// ============================================
// EXPORT
// ============================================

module.exports = router;

