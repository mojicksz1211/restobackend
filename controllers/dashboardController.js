// ============================================
// DASHBOARD CONTROLLER
// ============================================
// File: controllers/dashboardController.js
// Description: Handles dashboard-related business logic
// ============================================

const DashboardModel = require('../models/dashboardModel');

class DashboardController {
	// Display dashboard page
	static async showPage(req, res) {
		const permissions = req.session.permissions;
		if (permissions === undefined) {
			console.error("Permissions are undefined");
			return res.status(500).send("Permissions are undefined");
		}

		try {
			// Fetch all dashboard statistics
			const stats = await DashboardModel.getDashboardStats();

			res.render('dashboard', {
				username: req.session.username,
				firstname: req.session.firstname,
				lastname: req.session.lastname,
				user_id: req.session.user_id,
				currentPage: 'dashboard',
				permissions: permissions,
				todaysRevenue: stats.todaysRevenue,
				totalOrders: stats.totalOrders,
				activeTables: stats.activeTables,
				pendingOrders: stats.pendingOrders,
				popularItems: stats.popularItems
			});
		} catch (error) {
			console.error('Error fetching dashboard data:', error);
			// Render with default values if there's an error
			res.render('dashboard', {
				username: req.session.username,
				firstname: req.session.firstname,
				lastname: req.session.lastname,
				user_id: req.session.user_id,
				currentPage: 'dashboard',
				permissions: permissions,
				todaysRevenue: 0,
				totalOrders: 0,
				activeTables: 0,
				pendingOrders: 0,
				popularItems: 0
			});
		}
	}
}

module.exports = DashboardController;

