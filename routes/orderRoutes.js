// ============================================
// ORDER ROUTES
// ============================================
// File: routes/orderRoutes.js
// Description: Routes for orders management
// ============================================

const express = require('express');
const router = express.Router();
const { checkSession } = require('./authRoutes');
const OrderController = require('../controllers/orderController');

router.get('/orders', checkSession, OrderController.showPage);

router.get('/orders/data', checkSession, OrderController.getAll);
router.get('/orders/:id', checkSession, OrderController.getById);
router.get('/orders/:id/items', checkSession, OrderController.getItems);

router.post('/orders', checkSession, OrderController.create);
router.put('/orders/:id', checkSession, OrderController.update);
router.put('/order_items/:id/status', checkSession, OrderController.updateItemStatus);

module.exports = router;
