// ============================================
// DASHBOARD ROUTES
// ============================================
// File: routes/dashboardRoutes.js
// Description: Routes for dashboard endpoints
// ============================================

const express = require('express');
const router = express.Router();
const { checkSession } = require('./authRoutes');

// ============================================
// GET ROUTES
// ============================================

// GET - Display dashboard page
router.get("/dashboard", checkSession, async (req, res) => {
	const permissions = req.session.permissions;
	if (permissions === undefined) {
		console.error("Permissions are undefined");
		return res.status(500).send("Permissions are undefined");
	}

	// Default values for dashboard variables (casino-related, not used in restaurant system)
	const defaultSqlValue = [{ 
		CASH_DEPOSIT: 0, MARKER_RETURN_DEPOSIT: 0, CASH_WITHDRAW: 0, NNChipsBuyin: 0, 
		NNChipsReturn: 0, TOTAL_NN_MARKER: 0, ACCOUNT_SETTLEMENT: 0, MARKER_RETURN_CASH: 0,
		ACCOUNT_DEDUCT: 0, MARKER_RETURN: 0, JUNKET_EXPENSE: 0, NN_CHIPS_BUYIN_CASH_DEPOSIT: 0,
		CC_CHIPS_BUYIN_CASH_DEPOSIT: 0, TOTAL_ISSUE_RECORD: 0, TOTAL_CASHOUT: 0, TOTAL_NN_DEPOSIT: 0,
		ACCOUNT_TRANSFER: 0, RESET_EXPENSE: 0, ACCOUNT_DEPOSIT: 0, SETTLEMENT_DEPOSIT: 0,
		ACCOUNT_WITHDRAW: 0, TOTAL_AGENT: 0, TOTAL_ISSUE_GAME: 0, CHIPS_RETURN_MARKER: 0,
		RESET_ROLLING: 0, RESET_CASHOUT: 0, TOTAL_ROLLING: 0, CCResetReturn: 0
	}];

	res.render('dashboard', {
		username: req.session.username,
		firstname: req.session.firstname,
		lastname: req.session.lastname,
		user_id: req.session.user_id,
		currentPage: 'dashboard',
		permissions: permissions,
		// Casino-related variables (not used in restaurant system, but needed for template)
		sqlCashDeposit: defaultSqlValue,
		sqlMArkerReturnDeposit: defaultSqlValue,
		sqlCashWithdraw: defaultSqlValue,
		sqlNNChipsBuyin: defaultSqlValue,
		sqlNNChipsReturn: defaultSqlValue,
		sqlNNChipsAccountMarker: defaultSqlValue,
		sqlAccountSettlement: defaultSqlValue,
		sqlMArkerReturnCash: defaultSqlValue,
		sqlAccountDeduct: defaultSqlValue,
		sqlAccountMarkerReturn: defaultSqlValue,
		sqlJunketExpense: defaultSqlValue,
		sqlNNChipsBuyinCashDeposit: defaultSqlValue,
		sqlCCChipsBuyinCashDeposit: defaultSqlValue,
		sqlMarkerIssueAccount: defaultSqlValue,
		sqlTotalCashOut: defaultSqlValue,
		sqlNNChipsAccountDeposit: defaultSqlValue,
		sqlAccountTransfer: defaultSqlValue,
		sqlJunketExpenseReset: defaultSqlValue,
		sqlAccountDeposit: defaultSqlValue,
		sqlSettlementDepositAmount: defaultSqlValue,
		sqlAccountWithdraw: defaultSqlValue,
		sqlAgentCount: defaultSqlValue,
		sqlMarkerIssueGame: defaultSqlValue,
		sqlChipsReturnMarker: defaultSqlValue,
		sqlTotalRollingReset: defaultSqlValue,
		sqlTotalCashOutRollingReset: defaultSqlValue,
		sqlTotalRollingManual: defaultSqlValue,
		sqlCCChipsReturnReset: defaultSqlValue
	});
});

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
