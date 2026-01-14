// ============================================
// BILLING ROUTES
// ============================================
// File: routes/billingRoutes.js
// Description: Routes for billing records
// ============================================

const express = require('express');
const router = express.Router();
const { checkSession } = require('./authRoutes');
const BillingController = require('../controllers/billingController');

router.get('/billing', checkSession, BillingController.showPage);
router.get('/billing/data', checkSession, BillingController.getAll);
router.get('/billing/:orderId/payments', checkSession, BillingController.getPaymentHistory);
router.get('/billing/:orderId', checkSession, BillingController.getByOrderId);
router.put('/billing/:id', checkSession, BillingController.updateBilling);

module.exports = router;
