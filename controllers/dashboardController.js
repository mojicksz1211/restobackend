// ============================================
// DASHBOARD CONTROLLER
// ============================================
// File: controllers/dashboardController.js
// Description: Handles dashboard-related business logic
// ============================================

const DashboardModel = require('../models/dashboardModel');
const BranchModel = require('../models/branchModel');
const ApiResponse = require('../utils/apiResponse');

class DashboardController {
	// Get dashboard statistics
	static async getStats(req, res) {
		try {
			const permissions = req.session?.permissions || req.user?.permissions;
			if (permissions === undefined) {
				return ApiResponse.error(res, 'Permissions are undefined', 500);
			}

			const branchId = req.session?.branch_id || req.user?.branch_id || req.query.branch_id || null;

			// Fetch all dashboard statistics (generic cards)
			const stats = await DashboardModel.getDashboardStats(branchId);

			// Detect if current branch is Kim's Brothers
			let currentBranch = null;
			let isKimsBrothersDashboard = false;

			if (branchId) {
				currentBranch = await BranchModel.getById(branchId);
				if (currentBranch) {
					const name = (currentBranch.BRANCH_NAME || '').trim().toLowerCase();
					const code = (currentBranch.BRANCH_CODE || '').trim().toUpperCase();
					if (code === 'BR002' || name === "kim's brothers") {
						isKimsBrothersDashboard = true;
					}
				}
			}

			return ApiResponse.success(res, {
				stats: {
					todaysRevenue: stats.todaysRevenue || 0,
					totalOrders: stats.totalOrders || 0,
					activeTables: stats.activeTables || 0,
					pendingOrders: stats.pendingOrders || 0,
					popularItems: stats.popularItems || 0
				},
				currentBranch,
				isKimsBrothersDashboard,
				permissions,
				user: {
					username: req.session?.username || req.user?.username,
					firstname: req.session?.firstname || req.user?.firstname,
					lastname: req.session?.lastname || req.user?.lastname,
					user_id: req.session?.user_id || req.user?.user_id
				}
			}, 'Dashboard statistics retrieved successfully');
		} catch (error) {
			console.error('Error fetching dashboard data:', error);
			return ApiResponse.error(res, 'Failed to fetch dashboard statistics', 500, error.message);
		}
	}
}

module.exports = DashboardController;

