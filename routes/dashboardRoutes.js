// ============================================
// DASHBOARD ROUTES
// ============================================
// File: routes/dashboardRoutes.js
// Description: Routes for dashboard endpoints
// ============================================

const express = require('express');
const router = express.Router();
const { checkSession } = require('./authRoutes');
const DashboardController = require('../controllers/dashboardController');

// ============================================
// GET ROUTES
// ============================================

// GET - Display dashboard page
router.get("/dashboard", checkSession, DashboardController.showPage);

// GET - Activity logs endpoint (casino-related, not used in restaurant system)
router.get("/activity_logs", checkSession, async (req, res) => {
	res.json([]);
});

// GET - Win/Loss endpoint (casino-related, not used in restaurant system)
router.get("/get_winloss", checkSession, async (req, res) => {
	res.json({
		winloss: 0,
		percentChange: 0,
		chart: {
			data: [],
			labels: []
		}
	});
});

// ============================================
// EXPORT
// ============================================

module.exports = router;
