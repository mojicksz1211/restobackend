// ============================================
// ORDER MODEL
// ============================================
// File: models/orderModel.js
// Description: Database queries for orders
// ============================================

const pool = require('../config/db');

class OrderModel {
	static async getAll() {
		const query = `
			SELECT 
				o.IDNo,
				o.ORDER_NO,
				o.TABLE_ID,
				t.TABLE_NUMBER,
				o.ORDER_TYPE,
				o.STATUS,
				o.SUBTOTAL,
				o.TAX_AMOUNT,
				o.SERVICE_CHARGE,
				o.DISCOUNT_AMOUNT,
				o.GRAND_TOTAL,
				o.ENCODED_DT,
				o.ENCODED_BY
			FROM orders o
			LEFT JOIN restaurant_tables t ON t.IDNo = o.TABLE_ID
			ORDER BY o.ENCODED_DT DESC
		`;

		const [rows] = await pool.execute(query);
		return rows;
	}

	static async getById(id) {
		const query = `
			SELECT 
				IDNo,
				ORDER_NO,
				TABLE_ID,
				ORDER_TYPE,
				STATUS,
				SUBTOTAL,
				TAX_AMOUNT,
				SERVICE_CHARGE,
				DISCOUNT_AMOUNT,
				GRAND_TOTAL
			FROM orders
			WHERE IDNo = ?
			LIMIT 1
		`;
		const [rows] = await pool.execute(query, [id]);
		return rows[0] || null;
	}

	static async create(data) {
		const {
			ORDER_NO,
			TABLE_ID,
			ORDER_TYPE,
			STATUS,
			SUBTOTAL,
			TAX_AMOUNT,
			SERVICE_CHARGE,
			DISCOUNT_AMOUNT,
			GRAND_TOTAL,
			user_id
		} = data;

		const query = `
			INSERT INTO orders (
				ORDER_NO,
				TABLE_ID,
				ORDER_TYPE,
				STATUS,
				SUBTOTAL,
				TAX_AMOUNT,
				SERVICE_CHARGE,
				DISCOUNT_AMOUNT,
				GRAND_TOTAL,
				ENCODED_BY
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;

		const values = [
			ORDER_NO,
			TABLE_ID || null,
			ORDER_TYPE || null,
			STATUS || 3,
			SUBTOTAL || 0,
			TAX_AMOUNT || 0,
			SERVICE_CHARGE || 0,
			DISCOUNT_AMOUNT || 0,
			GRAND_TOTAL || 0,
			user_id
		];

		const [result] = await pool.execute(query, values);
		return result.insertId;
	}

	static async update(id, data) {
		const {
			TABLE_ID,
			ORDER_TYPE,
			STATUS,
			SUBTOTAL,
			TAX_AMOUNT,
			SERVICE_CHARGE,
			DISCOUNT_AMOUNT,
			GRAND_TOTAL,
			user_id
		} = data;

		const query = `
			UPDATE orders SET
				TABLE_ID = ?,
				ORDER_TYPE = ?,
				STATUS = ?,
				SUBTOTAL = ?,
				TAX_AMOUNT = ?,
				SERVICE_CHARGE = ?,
				DISCOUNT_AMOUNT = ?,
				GRAND_TOTAL = ?,
				EDITED_BY = ?,
				EDITED_DT = CURRENT_TIMESTAMP
			WHERE IDNo = ?
		`;

		const values = [
			TABLE_ID || null,
			ORDER_TYPE || null,
			STATUS || 3,
			SUBTOTAL || 0,
			TAX_AMOUNT || 0,
			SERVICE_CHARGE || 0,
			DISCOUNT_AMOUNT || 0,
			GRAND_TOTAL || 0,
			user_id,
			id
		];

		const [result] = await pool.execute(query, values);
		return true; // Return true as long as no exception occurred
	}

	static async updateStatus(id, status, user_id) {
		const query = `
			UPDATE orders SET
				STATUS = ?,
				EDITED_BY = ?,
				EDITED_DT = CURRENT_TIMESTAMP
			WHERE IDNo = ?
		`;
		const [result] = await pool.execute(query, [status, user_id, id]);
		return result.affectedRows > 0;
	}

	// Get orders by user ID (for mobile app sync)
	static async getByUserId(userId) {
		const query = `
			SELECT 
				o.IDNo,
				o.ORDER_NO,
				o.TABLE_ID,
				o.ORDER_TYPE,
				o.STATUS,
				o.SUBTOTAL,
				o.TAX_AMOUNT,
				o.SERVICE_CHARGE,
				o.DISCOUNT_AMOUNT,
				o.GRAND_TOTAL,
				o.ENCODED_DT,
				o.ENCODED_BY
			FROM orders o
			WHERE o.ENCODED_BY = ?
			ORDER BY o.ENCODED_DT DESC
		`;

		const [rows] = await pool.execute(query, [userId]);
		return rows;
	}

	// Get orders by table ID (for mobile app sync after login/restart)
	static async getByTableId(tableId) {
		const query = `
			SELECT 
				o.IDNo,
				o.ORDER_NO,
				o.TABLE_ID,
				o.ORDER_TYPE,
				o.STATUS,
				o.SUBTOTAL,
				o.TAX_AMOUNT,
				o.SERVICE_CHARGE,
				o.DISCOUNT_AMOUNT,
				o.GRAND_TOTAL,
				o.ENCODED_DT,
				o.ENCODED_BY
			FROM orders o
			WHERE o.TABLE_ID = ? AND o.STATUS != 1
			ORDER BY o.ENCODED_DT DESC
		`;

		const [rows] = await pool.execute(query, [tableId]);
		return rows;
	}

	// Get orders by user ID or table ID (for mobile app sync)
	static async getByUserIdOrTableId(userId, tableId) {
		let query, params;
		
		if (tableId != null) {
			// Get orders by table_id (priority) or user_id, exclude SETTLED orders (STATUS = 1)
			query = `
				SELECT 
					o.IDNo,
					o.ORDER_NO,
					o.TABLE_ID,
					o.ORDER_TYPE,
					o.STATUS,
					o.SUBTOTAL,
					o.TAX_AMOUNT,
					o.SERVICE_CHARGE,
					o.DISCOUNT_AMOUNT,
					o.GRAND_TOTAL,
					o.ENCODED_DT,
					o.ENCODED_BY
				FROM orders o
				WHERE (o.TABLE_ID = ? OR o.ENCODED_BY = ?) AND o.STATUS != 1
				ORDER BY o.ENCODED_DT DESC
			`;
			params = [tableId, userId];
		} else {
			// Get orders by user_id only, exclude SETTLED orders
			query = `
				SELECT 
					o.IDNo,
					o.ORDER_NO,
					o.TABLE_ID,
					o.ORDER_TYPE,
					o.STATUS,
					o.SUBTOTAL,
					o.TAX_AMOUNT,
					o.SERVICE_CHARGE,
					o.DISCOUNT_AMOUNT,
					o.GRAND_TOTAL,
					o.ENCODED_DT,
					o.ENCODED_BY
				FROM orders o
				WHERE o.ENCODED_BY = ? AND o.STATUS != 1
				ORDER BY o.ENCODED_DT DESC
			`;
			params = [userId];
		}

		const [rows] = await pool.execute(query, params);
		return rows;
	}

	// Get kitchen orders - all PENDING (3) and CONFIRMED (2) orders
	// Kitchen needs to see all active orders, not filtered by user/table
	static async getKitchenOrders() {
		const query = `
			SELECT 
				o.IDNo,
				o.ORDER_NO,
				o.TABLE_ID,
				t.TABLE_NUMBER,
				o.ORDER_TYPE,
				o.STATUS,
				o.SUBTOTAL,
				o.TAX_AMOUNT,
				o.SERVICE_CHARGE,
				o.DISCOUNT_AMOUNT,
				o.GRAND_TOTAL,
				o.ENCODED_DT,
				o.ENCODED_BY
			FROM orders o
			LEFT JOIN restaurant_tables t ON t.IDNo = o.TABLE_ID
			WHERE o.STATUS IN (3, 2)  -- PENDING (3) and CONFIRMED (2)
			ORDER BY o.ENCODED_DT ASC  -- Oldest first (FIFO)
		`;

		const [rows] = await pool.execute(query);
		return rows;
	}
}

module.exports = OrderModel;
