// ============================================
// BILLING CONTROLLER
// ============================================
// File: controllers/billingController.js
// Description: Handles billing operations and APIs
// ============================================

const BillingModel = require('../models/billingModel');
const OrderModel = require('../models/orderModel');
const TableModel = require('../models/tableModel');

class BillingController {
	static showPage(req, res) {
		const sessions = {
			username: req.session.username,
			firstname: req.session.firstname,
			lastname: req.session.lastname,
			user_id: req.session.user_id,
			currentPage: 'billing'
		};

		res.render('billing/manageBilling', sessions);
	}

	static async getAll(req, res) {
		try {
			const billings = await BillingModel.getAll();
			res.json(billings);
		} catch (error) {
			console.error('Error fetching billing records:', error);
			res.status(500).json({ error: 'Failed to fetch billing records' });
		}
	}

	static async getByOrderId(req, res) {
		try {
			const { orderId } = req.params;
			const billing = await BillingModel.getByOrderId(orderId);
			if (!billing) {
				return res.status(404).json({ error: 'Billing record not found' });
			}
			res.json(billing);
		} catch (error) {
			console.error('Error fetching billing record:', error);
			res.status(500).json({ error: 'Failed to fetch billing record' });
		}
	}

	static async getPaymentHistory(req, res) {
		try {
			const { orderId } = req.params;
			const rows = await BillingModel.getPaymentHistory(orderId);
			res.json(rows);
		} catch (error) {
			console.error('Error fetching payment history:', error);
			res.status(500).json({ error: 'Failed to fetch payment history' });
		}
	}

	static async updateBilling(req, res) {
		try {
			const { id } = req.params; // ORDER_ID
			const {
				payment_method,
				amount_paid, // Ito ang bagong bayad (e.g., 70)
				payment_ref
			} = req.body;

			const billing = await BillingModel.getByOrderId(id);
			if (!billing) {
				return res.status(404).json({ error: 'Billing record not found' });
			}

			const amountPaidNow = parseFloat(amount_paid) || 0;
			const currentTotalPaid = parseFloat(billing.AMOUNT_PAID) || 0;
			const newTotalPaid = currentTotalPaid + amountPaidNow;
			const amountDue = parseFloat(billing.AMOUNT_DUE);

			// Auto-calculate Status base sa balance
			let newStatus = 3; // Unpaid
			if (newTotalPaid >= amountDue) {
				newStatus = 1; // Paid
			} else if (newTotalPaid > 0) {
				newStatus = 2; // Partial
			}

			// 1. I-update ang main billing record (Accumulate Amount Paid)
			await BillingModel.updateForOrder(id, {
				payment_method: payment_method || billing.PAYMENT_METHOD,
				amount_paid: newTotalPaid,
				payment_ref: payment_ref || billing.PAYMENT_REF,
				status: newStatus
			});

			// 2. I-record ang transaction history
			await BillingModel.recordTransaction({
				order_id: id,
				payment_method: payment_method || billing.PAYMENT_METHOD || 'CASH',
				amount_paid: amountPaidNow,
				payment_ref: payment_ref,
				user_id: req.session.user_id
			});

			// 3. CONNECTED TABLES LOGIC:
			const order = await OrderModel.getById(id);
			if (order) {
				if (newStatus === 1) {
					// FULLY PAID: Mark Order as SETTLED (1) and Table as AVAILABLE (1)
					await OrderModel.updateStatus(id, 1, req.session.user_id);
					if (order.TABLE_ID) {
						await TableModel.updateStatus(order.TABLE_ID, 1);
					}
				} else if (newStatus === 2) {
					// PARTIAL PAID: Mark Order as CONFIRMED (2)
					await OrderModel.updateStatus(id, 2, req.session.user_id);
				}
			}

			res.json({ success: true, status: newStatus });
		} catch (error) {
			console.error('Error updating billing record:', error);
			res.status(500).json({ error: 'Failed to update billing record' });
		}
	}
}

module.exports = BillingController;
