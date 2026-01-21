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
const socketService = require('../utils/socketService');

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
			// Get branch_id from query, body, or session (prioritize session)
			const branchId = req.session?.branch_id || req.query.branch_id || req.body.branch_id || req.user?.branch_id || null;
			const orders = await OrderModel.getAll(branchId);
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
			// Prioritize session branch_id
			const branchId = req.session?.branch_id || req.body.BRANCH_ID || req.query.branch_id || req.user?.branch_id;
			if (!branchId) {
				return res.status(400).json({ error: 'Branch ID is required. Please select a branch first.' });
			}
			
			const payload = {
				BRANCH_ID: branchId,
				ORDER_NO: req.body.ORDER_NO,
				TABLE_ID: req.body.TABLE_ID,
				ORDER_TYPE: req.body.ORDER_TYPE,
				STATUS: parseInt(req.body.STATUS) || 3,
				SUBTOTAL: parseFloat(req.body.SUBTOTAL) || 0,
				TAX_AMOUNT: parseFloat(req.body.TAX_AMOUNT) || 0,
				SERVICE_CHARGE: parseFloat(req.body.SERVICE_CHARGE) || 0,
				DISCOUNT_AMOUNT: parseFloat(req.body.DISCOUNT_AMOUNT) || 0,
				GRAND_TOTAL: parseFloat(req.body.GRAND_TOTAL) || 0,
				user_id: req.session.user_id || req.user?.user_id
			};

			const orderId = await OrderModel.create(payload);
			const items = Array.isArray(req.body.ORDER_ITEMS) ? req.body.ORDER_ITEMS : [];
			if (items.length) {
				await OrderItemsModel.createForOrder(orderId, items, req.session.user_id);
			}
			await BillingModel.createForOrder({
				branch_id: payload.BRANCH_ID,
				order_id: orderId,
				amount_due: payload.GRAND_TOTAL,
				amount_paid: 0,
				status: 3,
				user_id: req.session.user_id || req.user?.user_id
			});

			// Update table status to Occupied (2) if a table is assigned
			if (payload.TABLE_ID) {
				await TableModel.updateStatus(payload.TABLE_ID, 2);
			}

			// Get full order data with items for socket emission
			const fullOrder = await OrderModel.getById(orderId);
			const orderItems = await OrderItemsModel.getByOrderId(orderId);

			// Emit socket event for order creation
			socketService.emitOrderCreated(orderId, {
				order_id: orderId,
				order_no: payload.ORDER_NO,
				table_id: payload.TABLE_ID,
				status: payload.STATUS,
				grand_total: payload.GRAND_TOTAL,
				items: orderItems,
				items_count: items.length
			});

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
				STATUS: parseInt(req.body.STATUS) || 3,
				SUBTOTAL: parseFloat(req.body.SUBTOTAL) || 0,
				TAX_AMOUNT: parseFloat(req.body.TAX_AMOUNT) || 0,
				SERVICE_CHARGE: parseFloat(req.body.SERVICE_CHARGE) || 0,
				DISCOUNT_AMOUNT: parseFloat(req.body.DISCOUNT_AMOUNT) || 0,
				GRAND_TOTAL: parseFloat(req.body.GRAND_TOTAL) || 0,
				user_id: req.session.user_id
			};

			const updated = await OrderModel.update(id, payload);
			// Only replace order items if ORDER_ITEMS is explicitly provided in the request
			if (req.body.ORDER_ITEMS !== undefined) {
				const items = Array.isArray(req.body.ORDER_ITEMS) ? req.body.ORDER_ITEMS : [];
				await OrderItemsModel.replaceForOrder(id, items, req.session.user_id);
			}
			
			const existingBilling = await BillingModel.getByOrderId(id);
			if (existingBilling) {
				await BillingModel.updateForOrder(id, {
					amount_due: payload.GRAND_TOTAL
				});
			} else {
				const order = await OrderModel.getById(id);
				await BillingModel.createForOrder({
					branch_id: order?.BRANCH_ID,
					order_id: id,
					amount_due: payload.GRAND_TOTAL,
					status: 3,
					user_id: req.session.user_id || req.user?.user_id
				});
			}

			// Handle Table Status Changes
			if (payload.STATUS === 1 || payload.STATUS === -1) {
				// Order is SETTLED (1) or CANCELLED (-1) -> Set table to AVAILABLE (1)
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

			// Get updated order data with items for socket emission
			const updatedOrder = await OrderModel.getById(id);
			const orderItems = await OrderItemsModel.getByOrderId(id);

			// Emit socket event for order update
			socketService.emitOrderUpdate(id, {
				order_id: id,
				order_no: updatedOrder.ORDER_NO,
				table_id: updatedOrder.TABLE_ID,
				order_type: updatedOrder.ORDER_TYPE,
				status: updatedOrder.STATUS,
				grand_total: updatedOrder.GRAND_TOTAL,
				items: orderItems
			});

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

			// Get order_id before updating
			const pool = require('../config/db');
			const [itemRows] = await pool.execute('SELECT ORDER_ID FROM order_items WHERE IDNo = ?', [id]);
			
			const updated = await OrderItemsModel.updateStatus(id, status, user_id);
			if (!updated) {
				return res.status(404).json({ error: 'Item not found' });
			}

			// Get order_id from the item to emit socket event
			if (itemRows.length > 0 && itemRows[0].ORDER_ID) {
				const orderId = itemRows[0].ORDER_ID;
				const order = await OrderModel.getById(orderId);
				const orderItems = await OrderItemsModel.getByOrderId(orderId);

				// Emit socket event for order update (item status changed)
				socketService.emitOrderUpdate(orderId, {
					order_id: orderId,
					order_no: order.ORDER_NO,
					table_id: order.TABLE_ID,
					status: order.STATUS,
					grand_total: order.GRAND_TOTAL,
					items: orderItems
				});
			}

			res.json({ success: true });
		} catch (error) {
			console.error('Error updating item status:', error);
			res.status(500).json({ error: 'Failed to update item status' });
		}
	}
}

module.exports = OrderController;
