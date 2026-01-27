// ============================================
// DASHBOARD CONTROLLER
// ============================================
// File: controllers/dashboardController.js
// Description: Handles dashboard-related business logic
// ============================================

const DashboardModel = require('../models/dashboardModel');
const BranchModel = require('../models/branchModel');

class DashboardController {
	// Display dashboard page
	static async showPage(req, res) {
		const permissions = req.session.permissions;
		if (permissions === undefined) {
			console.error("Permissions are undefined");
			return res.status(500).send("Permissions are undefined");
		}

		const branchId = req.session.branch_id || null; // null = ALL branches (admin)

		try {
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

			res.render('dashboard', {
				username: req.session.username,
				firstname: req.session.firstname,
				lastname: req.session.lastname,
				user_id: req.session.user_id,
				currentPage: 'dashboard',
				permissions,
				todaysRevenue: stats.todaysRevenue,
				totalOrders: stats.totalOrders,
				activeTables: stats.activeTables,
				pendingOrders: stats.pendingOrders,
				popularItems: stats.popularItems,
				currentBranch,
				isKimsBrothersDashboard
			});
		} catch (error) {
			console.error('Error fetching dashboard data:', error);

			// Fallback values with safe branch detection disabled
			res.render('dashboard', {
				username: req.session.username,
				firstname: req.session.firstname,
				lastname: req.session.lastname,
				user_id: req.session.user_id,
				currentPage: 'dashboard',
				permissions,
				todaysRevenue: 0,
				totalOrders: 0,
				activeTables: 0,
				pendingOrders: 0,
				popularItems: 0,
				currentBranch: null,
				isKimsBrothersDashboard: false
			});
		}
	}
}

module.exports = DashboardController;

