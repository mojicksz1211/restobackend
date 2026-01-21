// ============================================
// BRANCH CONTROLLER
// ============================================
// File: controllers/branchController.js
// Description: Handles branch-related business logic
// ============================================

const BranchModel = require('../models/branchModel');
const UserBranchModel = require('../models/userBranchModel');
const AuditLogModel = require('../models/auditLogModel');
const pool = require('../config/db');

class BranchController {
	// Display branch management page
	static async showPage(req, res) {
		const sessions = {
			username: req.session.username,
			firstname: req.session.firstname,
			lastname: req.session.lastname,
			user_id: req.session.user_id,
			currentPage: 'manageBranch',
			permissions: req.session.permissions
		};
		res.render("branch/manageBranch", sessions);
	}

	// Get all branches
	static async getAll(req, res) {
		try {
			const user_id = req.session?.user_id || req.user?.user_id;
			const userPermissions = req.session?.permissions || req.user?.permissions;
			
			let branches = [];
			
			// If admin, return all branches
			if (userPermissions === 1) {
				branches = await BranchModel.getAll();
			} else if (user_id) {
				// Regular users get only their assigned branches
				branches = await UserBranchModel.getBranchesByUserId(user_id);
			} else {
				// No user context, return all active branches
				branches = await BranchModel.getAll();
			}
			
			
			res.json(branches);
		} catch (error) {
			console.error('Error fetching branches:', error);
			res.status(500).json({ error: 'Failed to fetch branches', details: error.message });
		}
	}

	// Options for dashboard branch switcher
	// - Admin (PERMISSIONS=1): can choose ALL or any branch
	// - Non-admin: only their single assigned branch
	static async getBranchOptions(req, res) {
		try {
			const user_id = req.session?.user_id;
			const perm = parseInt(req.session?.permissions);

			let branches = [];
			if (perm === 1) {
				branches = await BranchModel.getAll();
			} else {
				branches = await UserBranchModel.getBranchesByUserId(user_id);
			}

			const current = req.session?.branch_id ?? null;

			const options = [];
			if (perm === 1) {
				options.push({ value: 'ALL', label: 'ALL BRANCHES' });
			}

			(branches || []).forEach(b => {
				options.push({
					value: String(b.IDNo),
					label: `${b.BRANCH_NAME} (${b.BRANCH_CODE})`
				});
			});

			return res.json({
				success: true,
				permissions: perm,
				current: current === null ? 'ALL' : String(current),
				options
			});
		} catch (error) {
			console.error('Error getting branch options:', error);
			return res.status(500).json({ error: 'Failed to get branch options' });
		}
	}

	// Set current branch filter for session
	static async setCurrentBranch(req, res) {
		try {
			const user_id = req.session?.user_id;
			const perm = parseInt(req.session?.permissions);
			const branch_id = req.body?.branch_id ?? req.body?.branchId ?? req.body?.BRANCH_ID;

			if (!branch_id) {
				return res.status(400).json({ error: 'branch_id is required' });
			}

			// Admin: allow ALL or specific branch
			if (perm === 1) {
				if (String(branch_id).toUpperCase() === 'ALL') {
					req.session.branch_id = null;
					req.session.branch_name = null;
					req.session.branch_code = null;
					return res.json({ success: true, current: 'ALL' });
				}

				const bid = parseInt(branch_id);
				if (isNaN(bid)) {
					return res.status(400).json({ error: 'Invalid branch_id' });
				}

				const branch = await BranchModel.getById(bid);
				if (!branch) {
					return res.status(404).json({ error: 'Branch not found' });
				}

				req.session.branch_id = bid;
				req.session.branch_name = branch.BRANCH_NAME;
				req.session.branch_code = branch.BRANCH_CODE;
				return res.json({ success: true, current: String(bid) });
			}

			// Non-admin: must stay on their single assigned branch
			const assigned = await UserBranchModel.getBranchesByUserId(user_id);
			const only = assigned?.[0];
			if (!only) {
				return res.status(400).json({ error: 'No branch assigned to this account' });
			}

			const onlyId = parseInt(only.IDNo);
			const bid = parseInt(branch_id);
			if (isNaN(bid) || bid !== onlyId) {
				return res.status(403).json({ error: 'Non-admin users cannot switch branches' });
			}

			req.session.branch_id = onlyId;
			req.session.branch_name = only.BRANCH_NAME;
			req.session.branch_code = only.BRANCH_CODE;
			return res.json({ success: true, current: String(onlyId) });
		} catch (error) {
			console.error('Error setting current branch:', error);
			return res.status(500).json({ error: 'Failed to set current branch' });
		}
	}

	// Get branch by ID
	static async getById(req, res) {
		try {
			const { id } = req.params;
			console.log('[BRANCH GET] Requested ID:', id, typeof id);

			let branch = null;
			const branchIdInt = parseInt(id);
			if (!isNaN(branchIdInt)) {
				branch = await BranchModel.getById(branchIdInt);
			} else {
				// Allow lookup by branch code for convenience
				branch = await BranchModel.getByCode(String(id || '').trim());
			}

			console.log('[BRANCH GET] Result:', branch ? 'Found' : 'Not found');
			
			if (!branch) {
				// Get all branches for debugging
				const allBranches = await BranchModel.getAll();
				return res.status(404).json({ 
					error: 'Branch not found',
					requested: id,
					available_branches: allBranches.map(b => ({ id: b.IDNo, code: b.BRANCH_CODE, name: b.BRANCH_NAME }))
				});
			}
			res.json(branch);
		} catch (error) {
			console.error('Error fetching branch:', error);
			res.status(500).json({ error: 'Failed to fetch branch', details: error.message });
		}
	}


	// Create new branch
	static async create(req, res) {
		try {
			const { BRANCH_CODE, BRANCH_NAME, ADDRESS, PHONE } = req.body;

			if (!BRANCH_CODE || BRANCH_CODE.trim() === '') {
				return res.status(400).json({ error: 'Branch code is required' });
			}

			if (!BRANCH_NAME || BRANCH_NAME.trim() === '') {
				return res.status(400).json({ error: 'Branch name is required' });
			}

			// Check if branch code already exists
			const existing = await BranchModel.getByCode(BRANCH_CODE);
			if (existing) {
				return res.status(400).json({ error: 'Branch code already exists' });
			}

			const user_id = req.session.user_id || req.user?.user_id;
			const branchId = await BranchModel.create({
				BRANCH_CODE,
				BRANCH_NAME,
				ADDRESS,
				PHONE
			});

			// Automatically add ALL active admins to this new branch in user_branches
			const [admins] = await pool.execute(
				`SELECT IDNo AS USER_ID FROM user_info WHERE PERMISSIONS = 1 AND ACTIVE = 1`
			);
			for (const admin of admins) {
				await UserBranchModel.addUserToBranch(admin.USER_ID, branchId);
			}

			// Log audit
			await AuditLogModel.create({
				user_id,
				branch_id: branchId,
				action: 'CREATE',
				table_name: 'branches',
				record_id: branchId
			});

			res.json({ 
				success: true, 
				message: 'Branch created successfully',
				id: branchId
			});
		} catch (error) {
			console.error('Error creating branch:', error);
			res.status(500).json({ error: 'Failed to create branch' });
		}
	}

	// Update branch
	static async update(req, res) {
		try {
			const { id } = req.params;
			const { BRANCH_CODE, BRANCH_NAME, ADDRESS, PHONE } = req.body;

			if (!BRANCH_CODE || BRANCH_CODE.trim() === '') {
				return res.status(400).json({ error: 'Branch code is required' });
			}

			if (!BRANCH_NAME || BRANCH_NAME.trim() === '') {
				return res.status(400).json({ error: 'Branch name is required' });
			}

			// Check if branch code already exists (excluding current branch)
			const existing = await BranchModel.getByCode(BRANCH_CODE);
			if (existing && existing.IDNo != id) {
				return res.status(400).json({ error: 'Branch code already exists' });
			}

			const user_id = req.session.user_id || req.user?.user_id;
			const updated = await BranchModel.update(id, {
				BRANCH_CODE,
				BRANCH_NAME,
				ADDRESS,
				PHONE
			});

			if (!updated) {
				return res.status(404).json({ error: 'Branch not found' });
			}

			// Log audit
			await AuditLogModel.create({
				user_id,
				branch_id: id,
				action: 'UPDATE',
				table_name: 'branches',
				record_id: id
			});

			res.json({ success: true, message: 'Branch updated successfully' });
		} catch (error) {
			console.error('Error updating branch:', error);
			res.status(500).json({ error: 'Failed to update branch' });
		}
	}

	// Delete branch
	static async delete(req, res) {
		try {
			const { id } = req.params;
			const user_id = req.session.user_id || req.user?.user_id;

			const deleted = await BranchModel.delete(id);

			if (!deleted) {
				return res.status(404).json({ error: 'Branch not found' });
			}

			// Log audit
			await AuditLogModel.create({
				user_id,
				branch_id: id,
				action: 'DELETE',
				table_name: 'branches',
				record_id: id
			});

			res.json({ success: true, message: 'Branch deleted successfully' });
		} catch (error) {
			console.error('Error deleting branch:', error);
			res.status(500).json({ error: 'Failed to delete branch' });
		}
	}

	// Get branches for a user
	static async getBranchesByUser(req, res) {
		try {
			const { userId } = req.params;
			const branches = await UserBranchModel.getBranchesByUserId(userId);
			res.json(branches);
		} catch (error) {
			console.error('Error fetching user branches:', error);
			res.status(500).json({ error: 'Failed to fetch user branches' });
		}
	}

	// Get users for a branch
	static async getUsersByBranch(req, res) {
		try {
			const { branchId } = req.params;
			const users = await UserBranchModel.getUsersByBranchId(branchId);
			res.json(users);
		} catch (error) {
			console.error('Error fetching branch users:', error);
			res.status(500).json({ error: 'Failed to fetch branch users' });
		}
	}

	// Assign user to branch
	static async assignUserToBranch(req, res) {
		try {
			const { userId, branchId } = req.body;
			const currentUserId = req.session.user_id || req.user?.user_id;

			if (!userId || !branchId) {
				return res.status(400).json({ error: 'User ID and Branch ID are required' });
			}

			// Enforce: non-admin users must have exactly ONE branch
			const [urows] = await pool.execute('SELECT PERMISSIONS FROM user_info WHERE IDNo = ? LIMIT 1', [userId]);
			const targetPerm = urows[0]?.PERMISSIONS;
			if (targetPerm == null) {
				return res.status(404).json({ error: 'User not found' });
			}

			// For non-admin, replace existing assignment with this single branch
			if (parseInt(targetPerm) !== 1) {
				await UserBranchModel.setUserBranches(userId, [parseInt(branchId)]);
			} else {
				// Admin has ALL branches automatically; keep assignment optional
				await UserBranchModel.setUserBranches(userId, []);
			}

			// Log audit
			await AuditLogModel.create({
				user_id: currentUserId,
				branch_id: branchId,
				action: 'ASSIGN_USER',
				table_name: 'user_branches',
				record_id: userId
			});

			res.json({ success: true, message: 'User assigned to branch successfully' });
		} catch (error) {
			console.error('Error assigning user to branch:', error);
			res.status(500).json({ error: 'Failed to assign user to branch' });
		}
	}

	// Remove user from branch
	static async removeUserFromBranch(req, res) {
		try {
			const { userId, branchId } = req.body;
			const currentUserId = req.session.user_id || req.user?.user_id;

			if (!userId || !branchId) {
				return res.status(400).json({ error: 'User ID and Branch ID are required' });
			}

			await UserBranchModel.removeUserFromBranch(userId, branchId);

			// Log audit
			await AuditLogModel.create({
				user_id: currentUserId,
				branch_id: branchId,
				action: 'REMOVE_USER',
				table_name: 'user_branches',
				record_id: userId
			});

			res.json({ success: true, message: 'User removed from branch successfully' });
		} catch (error) {
			console.error('Error removing user from branch:', error);
			res.status(500).json({ error: 'Failed to remove user from branch' });
		}
	}

	// Set all branches for a user (replace existing)
	static async setUserBranches(req, res) {
		try {
			const { userId, branchIds } = req.body;
			const currentUserId = req.session.user_id || req.user?.user_id;

			if (!userId) {
				return res.status(400).json({ error: 'User ID is required' });
			}

			// Enforce: non-admin users must have exactly ONE branch
			const [urows] = await pool.execute('SELECT PERMISSIONS FROM user_info WHERE IDNo = ? LIMIT 1', [userId]);
			const targetPerm = urows[0]?.PERMISSIONS;
			if (targetPerm == null) {
				return res.status(404).json({ error: 'User not found' });
			}

			const ids = Array.isArray(branchIds) ? branchIds.map(x => parseInt(x)).filter(x => !isNaN(x)) : [];

			if (parseInt(targetPerm) === 1) {
				// Admin has ALL branches automatically. We don't need to store assignments.
				await UserBranchModel.setUserBranches(userId, []);
				await AuditLogModel.create({
					user_id: currentUserId,
					action: 'SET_ADMIN_BRANCH_MODE_ALL',
					table_name: 'user_branches',
					record_id: userId
				});
				return res.json({
					success: true,
					message: 'Admin has ALL branches automatically (no branch assignment needed).',
					branches_assigned: 0
				});
			}

			// Non-admin: must be exactly one
			if (ids.length !== 1) {
				return res.status(400).json({ error: 'Non-admin user must be assigned exactly ONE branch.' });
			}

			await UserBranchModel.setUserBranches(userId, ids);

			// Log audit
			await AuditLogModel.create({
				user_id: currentUserId,
				action: 'SET_USER_BRANCHES',
				table_name: 'user_branches',
				record_id: userId
			});

			res.json({ 
				success: true, 
				message: 'User branches updated successfully',
				branches_assigned: branchIds.length
			});
		} catch (error) {
			console.error('Error setting user branches:', error);
			res.status(500).json({ error: 'Failed to set user branches', details: error.message });
		}
	}
}

module.exports = BranchController;
