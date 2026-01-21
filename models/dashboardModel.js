// ============================================
// DASHBOARD MODEL
// ============================================
// File: models/dashboardModel.js
// Description: Database operations for dashboard data
// ============================================

const pool = require('../config/db');

class DashboardModel {
	// Get today's revenue - Sum of AMOUNT_PAID from billing where status is PAID and date is today
	static async getTodaysRevenue(branchId = null) {
		let query = `
			SELECT COALESCE(SUM(AMOUNT_PAID), 0) as total_revenue
			FROM billing
			WHERE STATUS IN (1, 2)
			AND DATE(ENCODED_DT) = CURDATE()
		`;
		const params = [];
		if (branchId) {
			query += ` AND BRANCH_ID = ?`;
			params.push(branchId);
		}
		const [rows] = await pool.execute(query, params);
		return parseFloat(rows[0]?.total_revenue || 0);
	}

	// Get total orders - Count of order items created today
	static async getTotalOrders(branchId = null) {
		let query = `
			SELECT COUNT(*) as total_orders
			FROM order_items oi
			INNER JOIN orders o ON oi.ORDER_ID = o.IDNo
			WHERE DATE(o.ENCODED_DT) = CURDATE()
		`;
		const params = [];
		if (branchId) {
			query += ` AND o.BRANCH_ID = ?`;
			params.push(branchId);
		}
		const [rows] = await pool.execute(query, params);
		return parseInt(rows[0]?.total_orders || 0);
	}

	// Get active tables - Count of tables with STATUS = 2 (OCCUPIED)
	static async getActiveTables(branchId = null) {
		let query = `
			SELECT COUNT(*) as active_tables
			FROM restaurant_tables
			WHERE ACTIVE = 1
		`;
		const params = [];
		if (branchId) {
			query += ` AND BRANCH_ID = ?`;
			params.push(branchId);
		}
		const [rows] = await pool.execute(query, params);
		return parseInt(rows[0]?.active_tables || 0);
	}

	// Get pending orders - Count of order items with STATUS = 3 (PENDING)
	static async getPendingOrders(branchId = null) {
		let query = `
			SELECT COUNT(*) as pending_orders
			FROM order_items oi
			INNER JOIN orders o ON oi.ORDER_ID = o.IDNo
			WHERE oi.STATUS = 3
		`;
		const params = [];
		if (branchId) {
			query += ` AND o.BRANCH_ID = ?`;
			params.push(branchId);
		}
		const [rows] = await pool.execute(query, params);
		return parseInt(rows[0]?.pending_orders || 0);
	}

	// Get popular items - Count of distinct menu items ordered today
	static async getPopularItems(branchId = null) {
		let query = `
			SELECT COUNT(DISTINCT oi.MENU_ID) as popular_items
			FROM order_items oi
			INNER JOIN orders o ON oi.ORDER_ID = o.IDNo
			WHERE DATE(o.ENCODED_DT) = CURDATE()
		`;
		const params = [];
		if (branchId) {
			query += ` AND o.BRANCH_ID = ?`;
			params.push(branchId);
		}
		const [rows] = await pool.execute(query, params);
		return parseInt(rows[0]?.popular_items || 0);
	}

	// Get all dashboard statistics in one call
	static async getDashboardStats(branchId = null) {
		try {
			const [
				todaysRevenue,
				totalOrders,
				activeTables,
				pendingOrders,
				popularItems
			] = await Promise.all([
				this.getTodaysRevenue(branchId),
				this.getTotalOrders(branchId),
				this.getActiveTables(branchId),
				this.getPendingOrders(branchId),
				this.getPopularItems(branchId)
			]);

			return {
				todaysRevenue,
				totalOrders,
				activeTables,
				pendingOrders,
				popularItems
			};
		} catch (error) {
			console.error('Error fetching dashboard stats:', error);
			throw error;
		}
	}
}

module.exports = DashboardModel;

