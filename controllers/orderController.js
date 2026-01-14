// ============================================
// ORDER CONTROLLER
// ============================================
// File: controllers/orderController.js
// Description: Handles order-related pages and APIs
// ============================================

const OrderModel = require('../models/orderModel');
const OrderItemsModel = require('../models/orderItemsModel');
const BillingModel = require('../models/billingModel');
const TableModel = require('../models/tableModel');

class OrderController {
	static showPage(req, res) {
		const sessions = {
			username: req.session.username,
			firstname: req.session.firstname,
			lastname: req.session.lastname,
			user_id: req.session.user_id,
			currentPage: 'orders'
		};

		res.render('orders/manageOrders', sessions);
	}

	static async getAll(req, res) {
		try {
			const orders = await OrderModel.getAll();
			res.json(orders);
		} catch (error) {
			console.error('Error fetching orders:', error);
			res.status(500).json({ error: 'Failed to fetch orders' });
		}
	}

	static async getById(req, res) {
		try {
			const { id } = req.params;
			const order = await OrderModel.getById(id);
			if (!order) {
				return res.status(404).json({ error: 'Order not found' });
			}
			res.json(order);
		} catch (error) {
			console.error('Error fetching order:', error);
			res.status(500).json({ error: 'Failed to fetch order' });
		}
	}

	static async create(req, res) {
		try {
			const payload = {
				ORDER_NO: req.body.ORDER_NO,
				TABLE_ID: req.body.TABLE_ID,
				ORDER_TYPE: req.body.ORDER_TYPE,
				STATUS: parseInt(req.body.STATUS) || 1,
				SUBTOTAL: parseFloat(req.body.SUBTOTAL) || 0,
				TAX_AMOUNT: parseFloat(req.body.TAX_AMOUNT) || 0,
				SERVICE_CHARGE: parseFloat(req.body.SERVICE_CHARGE) || 0,
				DISCOUNT_AMOUNT: parseFloat(req.body.DISCOUNT_AMOUNT) || 0,
				GRAND_TOTAL: parseFloat(req.body.GRAND_TOTAL) || 0,
				user_id: req.session.user_id
			};

			const orderId = await OrderModel.create(payload);
			const items = Array.isArray(req.body.ORDER_ITEMS) ? req.body.ORDER_ITEMS : [];
			if (items.length) {
				await OrderItemsModel.createForOrder(orderId, items, req.session.user_id);
			}
			await BillingModel.createForOrder({
				order_id: orderId,
				amount_due: payload.GRAND_TOTAL,
				amount_paid: 0,
				status: 3,
				user_id: req.session.user_id
			});

			// Update table status to Occupied (2) if a table is assigned
			if (payload.TABLE_ID) {
				await TableModel.updateStatus(payload.TABLE_ID, 2);
			}

			res.json({ success: true, id: orderId });
		} catch (error) {
			console.error('Error creating order:', error);
			res.status(500).json({ error: 'Failed to create order' });
		}
	}

	static async update(req, res) {
		try {
			const { id } = req.params;
			const oldOrder = await OrderModel.getById(id);
			if (!oldOrder) {
				return res.status(404).json({ error: 'Order not found' });
			}

			const payload = {
				TABLE_ID: req.body.TABLE_ID,
				ORDER_TYPE: req.body.ORDER_TYPE,
				STATUS: parseInt(req.body.STATUS) || 1,
				SUBTOTAL: parseFloat(req.body.SUBTOTAL) || 0,
				TAX_AMOUNT: parseFloat(req.body.TAX_AMOUNT) || 0,
				SERVICE_CHARGE: parseFloat(req.body.SERVICE_CHARGE) || 0,
				DISCOUNT_AMOUNT: parseFloat(req.body.DISCOUNT_AMOUNT) || 0,
				GRAND_TOTAL: parseFloat(req.body.GRAND_TOTAL) || 0,
				user_id: req.session.user_id
			};

			const updated = await OrderModel.update(id, payload);
			const items = Array.isArray(req.body.ORDER_ITEMS) ? req.body.ORDER_ITEMS : [];
			await OrderItemsModel.replaceForOrder(id, items, req.session.user_id);
			
			const existingBilling = await BillingModel.getByOrderId(id);
			if (existingBilling) {
				await BillingModel.updateForOrder(id, {
					amount_due: payload.GRAND_TOTAL
				});
			} else {
				await BillingModel.createForOrder({
					order_id: id,
					amount_due: payload.GRAND_TOTAL,
					status: 3,
					user_id: req.session.user_id
				});
			}

			// Handle Table Status Changes
			if (payload.STATUS === 4 || payload.STATUS === 5) {
				// Order is CLOSED (4) or CANCELLED (5) -> Set table to AVAILABLE (1)
				if (payload.TABLE_ID) {
					await TableModel.updateStatus(payload.TABLE_ID, 1);
				}
			} else {
				// Order is still active
				if (oldOrder.TABLE_ID != payload.TABLE_ID) {
					// Table changed
					if (oldOrder.TABLE_ID) {
						await TableModel.updateStatus(oldOrder.TABLE_ID, 1); // Set old table to AVAILABLE
					}
					if (payload.TABLE_ID) {
						await TableModel.updateStatus(payload.TABLE_ID, 2); // Set new table to OCCUPIED
					}
				} else if (payload.TABLE_ID) {
					// Same table, ensure it's OCCUPIED
					await TableModel.updateStatus(payload.TABLE_ID, 2);
				}
			}

			res.json({ success: true });
		} catch (error) {
			console.error('Error updating order:', error);
			res.status(500).json({ error: 'Failed to update order' });
		}
	}

	static async getItems(req, res) {
		try {
			const { id } = req.params;
			const items = await OrderItemsModel.getByOrderId(id);
			res.json(items);
		} catch (error) {
			console.error('Error fetching line items:', error);
			res.status(500).json({ error: 'Failed to fetch order items' });
		}
	}

	static async updateItemStatus(req, res) {
		try {
			const { id } = req.params;
			const { status } = req.body;
			const user_id = req.session.user_id;

			const updated = await OrderItemsModel.updateStatus(id, status, user_id);
			if (!updated) {
				return res.status(404).json({ error: 'Item not found' });
			}

			res.json({ success: true });
		} catch (error) {
			console.error('Error updating item status:', error);
			res.status(500).json({ error: 'Failed to update item status' });
		}
	}
}

module.exports = OrderController;
