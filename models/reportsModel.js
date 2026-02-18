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

	// Get sales hourly summary (from sales_hourly_summary table)
	// Columns: id, branch_id, sale_datetime, total_sales, refund, discount, net_sales, product_unit_price, gross_profit
	static async getSalesHourlySummary(startDate = null, endDate = null, branchId = null) {
		const params = [];
		let dateFilter = '';
		let branchFilter = '';

		if (startDate && endDate) {
			dateFilter = 'AND DATE(sale_datetime) BETWEEN ? AND ?';
			params.push(startDate, endDate);
		}

		if (branchId) {
			branchFilter = 'AND branch_id = ?';
			params.push(branchId);
		}

		const query = `
			SELECT 
				sale_datetime as hour,
				COALESCE(total_sales, 0) as total_sales,
				COALESCE(refund, 0) as refund,
				COALESCE(discount, 0) as discount,
				COALESCE(net_sales, 0) as net_sales,
				COALESCE(product_unit_price, 0) as product_unit_price,
				COALESCE(gross_profit, 0) as gross_profit
			FROM sales_hourly_summary
			WHERE 1=1
			${dateFilter}
			${branchFilter}
			ORDER BY sale_datetime DESC
		`;
		const [rows] = await pool.execute(query, params);
		return rows;
	}

	// Import sales hourly summary (insert into sales_hourly_summary table)
	// Expects array of { sale_datetime, total_sales, refund, discount, net_sales, product_unit_price, gross_profit }
	// branch_id is optional - use provided value or null
	static async importSalesHourlySummary(rows, branchId = null) {
		if (!rows || rows.length === 0) {
			return { inserted: 0, message: 'No data to import' };
		}
		let inserted = 0;
		for (const row of rows) {
			let saleDatetime = row.sale_datetime || row.hour;
			if (!saleDatetime) continue;
			// Normalize to MySQL DATETIME format (YYYY-MM-DD HH:mm:ss)
			if (typeof saleDatetime === 'string' && saleDatetime.includes('T')) {
				saleDatetime = saleDatetime.replace('T', ' ').slice(0, 19);
			}
			const totalSales = parseFloat(row.total_sales) || 0;
			const refund = parseFloat(row.refund) || 0;
			const discount = parseFloat(row.discount) || 0;
			const netSales = parseFloat(row.net_sales) || totalSales - refund - discount;
			const productUnitPrice = parseFloat(row.product_unit_price) || 0;
			const grossProfit = parseFloat(row.gross_profit) || netSales;

			await pool.execute(
				`INSERT INTO sales_hourly_summary (branch_id, sale_datetime, total_sales, refund, discount, net_sales, product_unit_price, gross_profit)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				[branchId || null, saleDatetime, totalSales, refund, discount, netSales, productUnitPrice, grossProfit]
			);
			inserted++;
		}
		return { inserted };
	}

	// Get receipts (from receipts table)
	// Columns: receipt_number, receipt_date, employee_name, customer_name, transaction_type, total_amount
	static async getReceipts(startDate = null, endDate = null, branchId = null, employeeFilter = null, search = null) {
		const params = [];
		let dateFilter = '';
		let employeeFilterClause = '';
		let searchClause = '';

		if (startDate && endDate) {
			dateFilter = 'AND DATE(receipt_date) BETWEEN ? AND ?';
			params.push(startDate, endDate);
		}

		if (employeeFilter && employeeFilter !== 'all') {
			employeeFilterClause = 'AND employee_name = ?';
			params.push(employeeFilter);
		}

		if (search && search.trim()) {
			const term = `%${search.trim()}%`;
			searchClause = 'AND (receipt_number LIKE ? OR employee_name LIKE ? OR customer_name LIKE ? OR CAST(transaction_type AS CHAR) LIKE ?)';
			params.push(term, term, term, term);
		}

		const query = `
			SELECT receipt_number, receipt_date, employee_name, customer_name, transaction_type, total_amount
			FROM receipts
			WHERE 1=1
			${dateFilter}
			${employeeFilterClause}
			${searchClause}
			ORDER BY receipt_date DESC
		`;
		const [rows] = await pool.execute(query, params);
		return rows;
	}

	// Import receipts (insert into receipts table)
	// Expects array of { receipt_number, receipt_date, employee_name, customer_name, transaction_type, total_amount }
	// Uses INSERT IGNORE to skip duplicates (receipt_number has UNIQUE key)
	static async importReceipts(rows) {
		if (!rows || rows.length === 0) {
			return { inserted: 0, skipped: 0, message: 'No data to import' };
		}
		let inserted = 0;
		let skipped = 0;
		for (const row of rows) {
			const receiptNumber = String(row.receipt_number || '').trim();
			if (!receiptNumber) continue;
			let receiptDate = row.receipt_date || (row.date && row.time ? `${row.date} ${row.time.length === 5 ? row.time + ':00' : row.time}` : row.date) || null;
			if (!receiptDate) continue;
			if (typeof receiptDate === 'string' && receiptDate.includes('T')) {
				receiptDate = receiptDate.replace('T', ' ').slice(0, 19);
			}
			const employeeName = String(row.employee_name || row.employee || '').trim() || null;
			const customerName = String(row.customer_name || row.customer || '').trim() || null;
			// transaction_type: 1 = sales, 2 = refund
			const typeRaw = row.transaction_type ?? row.type ?? 1;
			const transactionType = [1, 2, '1', '2'].includes(typeRaw)
				? parseInt(typeRaw, 10)
				: /^(refund|2|환불)$/i.test(String(typeRaw).trim()) ? 2 : 1;
			const totalAmount = parseFloat(row.total_amount || row.total) || 0;

			const [result] = await pool.execute(
				`INSERT IGNORE INTO receipts (receipt_number, receipt_date, employee_name, customer_name, transaction_type, total_amount)
				 VALUES (?, ?, ?, ?, ?, ?)`,
				[receiptNumber, receiptDate, employeeName, customerName, transactionType, totalAmount]
			);
			if (result.affectedRows > 0) {
				inserted++;
			} else {
				skipped++;
			}
		}
		return { inserted, skipped };
	}

	// Get discount report (from discount_report table/view)
	// Columns: name, discount_applied, point_discount_amount
	// Accepts start_date, end_date, branch_id for future extension when view has those columns
	static async getDiscountReport(startDate = null, endDate = null, branchId = null) {
		const query = `SELECT name, discount_applied, point_discount_amount FROM discount_report`;
		const [rows] = await pool.execute(query);
		return rows;
	}

	// Import discount data (insert into discount_report table)
	// Expects array of { name, discount_applied, point_discount_amount }
	static async importDiscountReport(rows) {
		if (!rows || rows.length === 0) {
			return { inserted: 0, message: 'No data to import' };
		}
		let inserted = 0;
		for (const row of rows) {
			const name = String(row.name || '').trim();
			const discountApplied = parseFloat(row.discount_applied) || 0;
			const pointDiscountAmount = parseFloat(row.point_discount_amount) || 0;
			if (!name) continue;
			await pool.execute(
				`INSERT INTO discount_report (name, discount_applied, point_discount_amount) VALUES (?, ?, ?)`,
				[name, discountApplied, pointDiscountAmount]
			);
			inserted++;
		}
		return { inserted };
	}

	// Get sales by category report (from sales_category_report table)
	// Columns: category, sales_quantity, net_sales, unit_cost, total_revenue
	// Accepts start_date, end_date, branch_id for future extension when view has those columns
	static async getSalesCategoryReport(startDate = null, endDate = null, branchId = null) {
		const query = `
			SELECT 
				category,
				COALESCE(sales_quantity, 0) as sales_quantity,
				COALESCE(net_sales, 0) as net_sales,
				COALESCE(unit_cost, 0) as unit_cost,
				COALESCE(total_revenue, 0) as total_revenue
			FROM sales_category_report
			ORDER BY total_revenue DESC, category ASC
		`;
		const [rows] = await pool.execute(query);
		return rows;
	}

	// Import sales category data (insert into sales_category_report table)
	// Expects array of { category, sales_quantity, net_sales, unit_cost, total_revenue }
	// Uses INSERT ... ON DUPLICATE KEY UPDATE to handle duplicates (if category has unique key)
	// Falls back to REPLACE INTO if no unique key exists
	static async importSalesCategoryReport(rows) {
		if (!rows || rows.length === 0) {
			return { inserted: 0, message: 'No data to import' };
		}
		let inserted = 0;
		for (const row of rows) {
			const category = String(row.category || '').trim();
			if (!category) continue;
			const salesQuantity = parseInt(row.sales_quantity || row.quantity || 0, 10) || 0;
			const netSales = parseFloat(row.net_sales || 0) || 0;
			const unitCost = parseFloat(row.unit_cost || 0) || 0;
			const totalRevenue = parseFloat(row.total_revenue || 0) || 0;

			try {
				// Try INSERT ... ON DUPLICATE KEY UPDATE first (if category has unique key)
				await pool.execute(
					`INSERT INTO sales_category_report (category, sales_quantity, net_sales, unit_cost, total_revenue) 
					 VALUES (?, ?, ?, ?, ?)
					 ON DUPLICATE KEY UPDATE 
					 sales_quantity = VALUES(sales_quantity),
					 net_sales = VALUES(net_sales),
					 unit_cost = VALUES(unit_cost),
					 total_revenue = VALUES(total_revenue)`,
					[category, salesQuantity, netSales, unitCost, totalRevenue]
				);
			} catch (err) {
				// Fallback to REPLACE INTO if ON DUPLICATE KEY UPDATE fails
				await pool.execute(
					`REPLACE INTO sales_category_report (category, sales_quantity, net_sales, unit_cost, total_revenue) VALUES (?, ?, ?, ?, ?)`,
					[category, salesQuantity, netSales, unitCost, totalRevenue]
				);
			}
			inserted++;
		}
		return { inserted };
	}
}

module.exports = ReportsModel;

