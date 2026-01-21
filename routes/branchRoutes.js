// ============================================
// BRANCH ROUTES
// ============================================
// File: routes/branchRoutes.js
// Description: Routes for branch management
// ============================================

const express = require('express');
const router = express.Router();
const BranchController = require('../controllers/branchController');

// Session-based auth for web admin
const checkSession = (req, res, next) => {
	if (!req.session || !req.session.username) {
		const accept = req.headers['accept'] || '';
		const isJsonRequest =
			req.xhr ||
			accept.includes('application/json') ||
			accept.includes('text/json');

		// If normal page navigation (HTML), redirect to login
		if (!isJsonRequest && req.accepts(['html', 'json']) === 'html') {
			return res.redirect('/login');
		}
		// Otherwise (AJAX), return JSON
		return res.status(401).json({ error: 'Authentication required' });
	}
	next();
};

const requireAdminSession = (req, res, next) => {
	const perm = parseInt(req.session?.permissions);
	if (perm !== 1) {
		return res.status(403).json({ error: 'Admin only' });
	}
	next();
};

// Web routes (session-based) - admin only
router.get('/manage', checkSession, requireAdminSession, BranchController.showPage);

// Branch selection routes removed (non-admin = ONE branch only; admin = ALL branches)

// Branch switcher (dashboard/topbar)
router.get('/options', checkSession, BranchController.getBranchOptions);
router.post('/set-current', checkSession, BranchController.setCurrentBranch);

// Get branches (admin sees all; non-admin sees assigned)
router.get('/', checkSession, BranchController.getAll);

// Admin-only: view branches for a user (used by web UI)
router.get('/user/:userId/branches', checkSession, requireAdminSession, BranchController.getBranchesByUser);

// Get branch by ID or code (admin-only)
router.get('/:id', checkSession, requireAdminSession, BranchController.getById);

// Create branch (admin only)
router.post('/', checkSession, requireAdminSession, BranchController.create);

// Update branch (admin only)
router.put('/:id', checkSession, requireAdminSession, BranchController.update);

// Delete branch disabled for now (branch ID is referenced by other tables)
// router.delete('/:id', checkSession, requireAdminSession, BranchController.delete);

// Get users by branch (admin only)
router.get('/:branchId/users', checkSession, requireAdminSession, BranchController.getUsersByBranch);

// User-Branch assignment (admin only) - used by web UI
router.post('/assign', checkSession, requireAdminSession, BranchController.assignUserToBranch);
router.post('/remove', checkSession, requireAdminSession, BranchController.removeUserFromBranch);
router.post('/set-user-branches', checkSession, requireAdminSession, BranchController.setUserBranches);

module.exports = router;

