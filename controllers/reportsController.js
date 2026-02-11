// ============================================
// REPORTS CONTROLLER
// ============================================
// File: controllers/reportsController.js
// Description: Handles reports and analytics business logic
// ============================================

const ReportsModel = require('../models/reportsModel');
const ApiResponse = require('../utils/apiResponse');

class ReportsController {
	// Get revenue report
	static async getRevenueReport(req, res) {
		try {
			const { period = 'daily', start_date, end_date } = req.query;
			const branchId = req.session?.branch_id || req.query.branch_id || req.user?.branch_id || null;

			if (!['daily', 'weekly', 'monthly'].includes(period)) {
				return ApiResponse.badRequest(res, 'Period must be daily, weekly, or monthly');
			}

			const report = await ReportsModel.getRevenueReport(period, start_date, end_date, branchId);

			return ApiResponse.success(res, {
				period,
				start_date: start_date || null,
				end_date: end_date || null,
				branch_id: branchId,
				data: report,
				total_revenue: report.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0),
				total_orders: report.reduce((sum, item) => sum + parseInt(item.order_count || 0), 0)
			}, 'Revenue report retrieved successfully');
		} catch (error) {
			console.error('Error fetching revenue report:', error);
			return ApiResponse.error(res, 'Failed to fetch revenue report', 500, error.message);
		}
	}

	// Get order report
	static async getOrderReport(req, res) {
		try {
			const { start_date, end_date, status } = req.query;
			const branchId = req.session?.branch_id || req.query.branch_id || req.user?.branch_id || null;

			const report = await ReportsModel.getOrderReport(start_date, end_date, branchId, status ? parseInt(status) : null);

			return ApiResponse.success(res, {
				start_date: start_date || null,
				end_date: end_date || null,
				branch_id: branchId,
				status: status ? parseInt(status) : null,
				data: report
			}, 'Order report retrieved successfully');
		} catch (error) {
			console.error('Error fetching order report:', error);
			return ApiResponse.error(res, 'Failed to fetch order report', 500, error.message);
		}
	}

	// Get popular menu items
	static async getPopularMenuItems(req, res) {
		try {
			const { start_date, end_date, limit = 10 } = req.query;
			const branchId = req.session?.branch_id || req.query.branch_id || req.user?.branch_id || null;

			const report = await ReportsModel.getPopularMenuItems(start_date, end_date, branchId, parseInt(limit));

			return ApiResponse.success(res, {
				start_date: start_date || null,
				end_date: end_date || null,
				branch_id: branchId,
				limit: parseInt(limit),
				data: report
			}, 'Popular menu items retrieved successfully');
		} catch (error) {
			console.error('Error fetching popular menu items:', error);
			return ApiResponse.error(res, 'Failed to fetch popular menu items', 500, error.message);
		}
	}

	// Get table utilization report
	static async getTableUtilizationReport(req, res) {
		try {
			const { start_date, end_date } = req.query;
			const branchId = req.session?.branch_id || req.query.branch_id || req.user?.branch_id || null;

			const report = await ReportsModel.getTableUtilizationReport(start_date, end_date, branchId);

			return ApiResponse.success(res, {
				start_date: start_date || null,
				end_date: end_date || null,
				branch_id: branchId,
				data: report
			}, 'Table utilization report retrieved successfully');
		} catch (error) {
			console.error('Error fetching table utilization report:', error);
			return ApiResponse.error(res, 'Failed to fetch table utilization report', 500, error.message);
		}
	}

	// Get employee performance report
	static async getEmployeePerformanceReport(req, res) {
		try {
			const { start_date, end_date, employee_id } = req.query;
			const branchId = req.session?.branch_id || req.query.branch_id || req.user?.branch_id || null;

			const report = await ReportsModel.getEmployeePerformanceReport(
				start_date,
				end_date,
				branchId,
				employee_id ? parseInt(employee_id) : null
			);

			return ApiResponse.success(res, {
				start_date: start_date || null,
				end_date: end_date || null,
				branch_id: branchId,
				employee_id: employee_id ? parseInt(employee_id) : null,
				data: report
			}, 'Employee performance report retrieved successfully');
		} catch (error) {
			console.error('Error fetching employee performance report:', error);
			return ApiResponse.error(res, 'Failed to fetch employee performance report', 500, error.message);
		}
	}
}

module.exports = ReportsController;

