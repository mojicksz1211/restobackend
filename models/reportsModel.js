// ============================================
// REPORTS MODEL
// ============================================
// File: models/reportsModel.js
// Description: Database operations for reports and analytics
// ============================================

const pool = require('../config/db');

class ReportsModel {
	// Get revenue report by period
	static async getRevenueReport(period = 'daily', startDate = null, endDate = null, branchId = null) {
		let dateFilter = '';
		const params = [];

		if (period === 'daily') {
			if (startDate && endDate) {
				dateFilter = 'AND DATE(b.ENCODED_DT) BETWEEN ? AND ?';
				params.push(startDate, endDate);
			} else {
				dateFilter = 'AND DATE(b.ENCODED_DT) = CURDATE()';
			}
		} else if (period === 'weekly') {
			if (startDate && endDate) {
				dateFilter = 'AND DATE(b.ENCODED_DT) BETWEEN ? AND ?';
				params.push(startDate, endDate);
			} else {
				dateFilter = 'AND YEARWEEK(b.ENCODED_DT) = YEARWEEK(CURDATE())';
			}
		} else if (period === 'monthly') {
			if (startDate && endDate) {
				dateFilter = 'AND DATE(b.ENCODED_DT) BETWEEN ? AND ?';
				params.push(startDate, endDate);
			} else {
				dateFilter = 'AND YEAR(b.ENCODED_DT) = YEAR(CURDATE()) AND MONTH(b.ENCODED_DT) = MONTH(CURDATE())';
			}
		}

		let query = `
			SELECT 
				DATE(b.ENCODED_DT) as date,
				SUM(b.AMOUNT_PAID) as revenue,
				COUNT(DISTINCT b.ORDER_ID) as order_count,
				AVG(b.AMOUNT_PAID) as average_order_value
			FROM billing b
			WHERE b.STATUS IN (1, 2)
			${dateFilter}
		`;

		if (branchId) {
			query += ` AND b.BRANCH_ID = ?`;
			params.push(branchId);
		}

		if (period === 'daily') {
			query += ` GROUP BY DATE(b.ENCODED_DT) ORDER BY date DESC`;
		} else if (period === 'weekly') {
			query += ` GROUP BY YEARWEEK(b.ENCODED_DT) ORDER BY date DESC`;
		} else if (period === 'monthly') {
			query += ` GROUP BY YEAR(b.ENCODED_DT), MONTH(b.ENCODED_DT) ORDER BY date DESC`;
		}

		const [rows] = await pool.execute(query, params);
		return rows;
	}

	// Get order reports
	static async getOrderReport(startDate = null, endDate = null, branchId = null, status = null) {
		let dateFilter = '';
		const params = [];

		if (startDate && endDate) {
			dateFilter = 'AND DATE(o.ENCODED_DT) BETWEEN ? AND ?';
			params.push(startDate, endDate);
		} else {
			dateFilter = 'AND DATE(o.ENCODED_DT) = CURDATE()';
		}

		let query = `
			SELECT 
				DATE(o.ENCODED_DT) as date,
				COUNT(DISTINCT o.IDNo) as total_orders,
				COUNT(oi.IDNo) as total_items,
				SUM(o.GRAND_TOTAL) as total_revenue,
				AVG(o.GRAND_TOTAL) as average_order_value,
				SUM(CASE WHEN o.STATUS = 1 THEN 1 ELSE 0 END) as settled_orders,
				SUM(CASE WHEN o.STATUS = 2 THEN 1 ELSE 0 END) as confirmed_orders,
				SUM(CASE WHEN o.STATUS = 3 THEN 1 ELSE 0 END) as pending_orders
			FROM orders o
			LEFT JOIN order_items oi ON oi.ORDER_ID = o.IDNo
			WHERE 1=1
			${dateFilter}
		`;

		if (branchId) {
			query += ` AND o.BRANCH_ID = ?`;
			params.push(branchId);
		}

		if (status !== null && status !== undefined) {
			query += ` AND o.STATUS = ?`;
			params.push(status);
		}

		query += ` GROUP BY DATE(o.ENCODED_DT) ORDER BY date DESC`;

		const [rows] = await pool.execute(query, params);
		return rows;
	}

	// Get most popular menu items
	static async getPopularMenuItems(startDate = null, endDate = null, branchId = null, limit = 10) {
		let dateFilter = '';
		const params = [];

		if (startDate && endDate) {
			dateFilter = 'AND DATE(o.ENCODED_DT) BETWEEN ? AND ?';
			params.push(startDate, endDate);
		} else {
			dateFilter = 'AND DATE(o.ENCODED_DT) = CURDATE()';
		}

		let query = `
			SELECT 
				m.IDNo,
				m.MENU_NAME,
				m.MENU_PRICE,
				SUM(oi.QTY) as total_quantity,
				COUNT(DISTINCT oi.ORDER_ID) as order_count,
				SUM(oi.LINE_TOTAL) as total_revenue
			FROM order_items oi
			INNER JOIN orders o ON o.IDNo = oi.ORDER_ID
			INNER JOIN menu m ON m.IDNo = oi.MENU_ID
			WHERE 1=1
			${dateFilter}
		`;

		if (branchId) {
			query += ` AND o.BRANCH_ID = ?`;
			params.push(branchId);
		}

		query += `
			GROUP BY m.IDNo, m.MENU_NAME, m.MENU_PRICE
			ORDER BY total_quantity DESC
			LIMIT ?
		`;
		params.push(limit);

		const [rows] = await pool.execute(query, params);
		return rows;
	}

	// Get daily sales by product for chart (last N days)
	// Returns daily revenue breakdown for top products
	// Includes all orders (uses same logic as getPopularMenuItems for consistency)
	// Uses order date (o.ENCODED_DT) for daily grouping
	static async getDailySalesByProduct(startDate = null, endDate = null, branchId = null, limit = 5) {
		let dateFilter = '';
		const params = [];

		if (startDate && endDate) {
			dateFilter = 'AND DATE(o.ENCODED_DT) BETWEEN ? AND ?';
			params.push(startDate, endDate);
		} else {
			// Default to last 30 days
			const end = new Date();
			const start = new Date();
			start.setDate(start.getDate() - 29);
			dateFilter = 'AND DATE(o.ENCODED_DT) BETWEEN ? AND ?';
			params.push(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
		}

		// First, get top N products by total revenue (same logic as getPopularMenuItems)
		let topProductsQuery = `
			SELECT 
				m.IDNo,
				m.MENU_NAME
			FROM order_items oi
			INNER JOIN orders o ON o.IDNo = oi.ORDER_ID
			INNER JOIN menu m ON m.IDNo = oi.MENU_ID
			WHERE 1=1
			${dateFilter}
		`;

		const topProductsParams = [...params];
		if (branchId) {
			topProductsQuery += ` AND o.BRANCH_ID = ?`;
			topProductsParams.push(branchId);
		}

		topProductsQuery += `
			GROUP BY m.IDNo, m.MENU_NAME
			ORDER BY SUM(oi.LINE_TOTAL) DESC
			LIMIT ?
		`;
		topProductsParams.push(limit);

		const [topProducts] = await pool.execute(topProductsQuery, topProductsParams);
		
		if (!topProducts || topProducts.length === 0) {
			return [];
		}

		const productIds = topProducts
			.map(p => p && p.IDNo ? parseInt(p.IDNo, 10) : null)
			.filter(id => id !== null && !isNaN(id));
		
		if (productIds.length === 0) {
			return [];
		}

		const placeholders = productIds.map(() => '?').join(',');

		// Get daily sales for these top products
		// Group by order date (o.ENCODED_DT) to match the date filter
		let query = `
			SELECT 
				DATE(o.ENCODED_DT) as date,
				m.IDNo as menu_id,
				m.MENU_NAME,
				COALESCE(SUM(oi.LINE_TOTAL), 0) as daily_revenue
			FROM order_items oi
			INNER JOIN orders o ON o.IDNo = oi.ORDER_ID
			INNER JOIN menu m ON m.IDNo = oi.MENU_ID
			WHERE m.IDNo IN (${placeholders})
			${dateFilter}
		`;

		const dailyParams = [...productIds, ...params];
		if (branchId) {
			query += ` AND o.BRANCH_ID = ?`;
			dailyParams.push(branchId);
		}

		query += `
			GROUP BY DATE(o.ENCODED_DT), m.IDNo, m.MENU_NAME
			ORDER BY date ASC, m.IDNo ASC
		`;

		const [rows] = await pool.execute(query, dailyParams);
		return rows;
	}

	// Get table utilization report
	static async getTableUtilizationReport(startDate = null, endDate = null, branchId = null) {
		let dateFilter = '';
		const params = [];

		if (startDate && endDate) {
			dateFilter = 'AND DATE(o.ENCODED_DT) BETWEEN ? AND ?';
			params.push(startDate, endDate);
		} else {
			dateFilter = 'AND DATE(o.ENCODED_DT) = CURDATE()';
		}

		let query = `
			SELECT 
				rt.IDNo,
				rt.TABLE_NUMBER,
				rt.CAPACITY,
				COUNT(DISTINCT o.IDNo) as order_count,
				SUM(o.GRAND_TOTAL) as total_revenue,
				AVG(o.GRAND_TOTAL) as average_order_value,
				SUM(CASE WHEN o.STATUS = 1 THEN 1 ELSE 0 END) as settled_count
			FROM restaurant_tables rt
			LEFT JOIN orders o ON o.TABLE_ID = rt.IDNo
			WHERE rt.ACTIVE = 1
			${dateFilter}
		`;

		if (branchId) {
			query += ` AND rt.BRANCH_ID = ?`;
			params.push(branchId);
		}

		query += ` GROUP BY rt.IDNo, rt.TABLE_NUMBER, rt.CAPACITY ORDER BY order_count DESC`;

		const [rows] = await pool.execute(query, params);
		return rows;
	}

	// Get employee performance report
	static async getEmployeePerformanceReport(startDate = null, endDate = null, branchId = null, employeeId = null) {
		let dateFilter = '';
		const params = [];

		if (startDate && endDate) {
			dateFilter = 'AND DATE(o.ENCODED_DT) BETWEEN ? AND ?';
			params.push(startDate, endDate);
		} else {
			dateFilter = 'AND DATE(o.ENCODED_DT) = CURDATE()';
		}

		let query = `
			SELECT 
				u.IDNo as user_id,
				u.USERNAME,
				u.FIRSTNAME,
				u.LASTNAME,
				CONCAT(u.FIRSTNAME, ' ', u.LASTNAME) as fullname,
				COUNT(DISTINCT o.IDNo) as orders_created,
				SUM(o.GRAND_TOTAL) as total_sales,
				AVG(o.GRAND_TOTAL) as average_order_value,
				COUNT(DISTINCT DATE(o.ENCODED_DT)) as days_active
			FROM user_info u
			INNER JOIN orders o ON o.ENCODED_BY = u.IDNo
			WHERE u.ACTIVE = 1
			${dateFilter}
		`;

		if (branchId) {
			query += ` AND o.BRANCH_ID = ?`;
			params.push(branchId);
		}

		if (employeeId) {
			query += ` AND u.IDNo = ?`;
			params.push(employeeId);
		}

		query += ` GROUP BY u.IDNo, u.USERNAME, u.FIRSTNAME, u.LASTNAME ORDER BY total_sales DESC`;

		const [rows] = await pool.execute(query, params);
		return rows;
	}
}

module.exports = ReportsModel;

