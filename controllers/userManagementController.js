// ============================================
// USER MANAGEMENT CONTROLLER
// ============================================
// For restoadmin User & Access page (users list + roles)
// Uses req.user from JWT (authenticateJWT)
// ============================================

const pool = require('../config/db');
const argon2 = require('argon2');
const ApiResponse = require('../utils/apiResponse');

/**
 * Format LAST_LOGIN datetime as relative "last active" string
 */
function formatLastActive(dateStr) {
	if (!dateStr) return 'Never';
	const now = Date.now();
	const then = new Date(dateStr).getTime();
	const diffSec = (now - then) / 1000;
	if (diffSec < 60) return 'Just now';
	if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
	if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hour(s) ago`;
	if (diffSec < 172800) return 'Yesterday';
	if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
	return new Date(dateStr).toLocaleDateString();
}

/**
 * GET /api/user-management/users
 * Returns users in shape expected by restoadmin: id, name, email, roleId, roleName, lastActive, avatar
 */
async function getUsers(req, res) {
	try {
		const permissions = req.user?.permissions;
		const branchId = req.user?.branch_id;

		// Build same logic as authRoutes GET /users
		// Prefer columns EMAIL, AVATAR_URL if present (run migration); else fallback query
		let query = `
			SELECT 
				u.IDNo AS user_id,
				u.FIRSTNAME,
				u.LASTNAME,
				u.USERNAME,
				u.LAST_LOGIN,
				u.PERMISSIONS AS role_id,
				ur.ROLE AS role_name
			FROM user_info u
			LEFT JOIN user_role ur ON ur.IDNo = u.PERMISSIONS
			LEFT JOIN user_branches ub ON ub.USER_ID = u.IDNo
			WHERE u.ACTIVE = 1
		`;
		let withExtra = false;
		try {
			const [probe] = await pool.execute(
				'SELECT EMAIL, AVATAR_URL FROM user_info LIMIT 1'
			);
			withExtra = true;
		} catch (_) {
			// columns don't exist yet
		}
		if (withExtra) {
			query = `
			SELECT 
				u.IDNo AS user_id,
				u.FIRSTNAME,
				u.LASTNAME,
				u.USERNAME,
				u.EMAIL,
				u.LAST_LOGIN,
				u.PERMISSIONS AS role_id,
				u.AVATAR_URL,
				ur.ROLE AS role_name
			FROM user_info u
			LEFT JOIN user_role ur ON ur.IDNo = u.PERMISSIONS
			LEFT JOIN user_branches ub ON ub.USER_ID = u.IDNo
			WHERE u.ACTIVE = 1
			`;
		}
		const params = [];

		if (permissions === 1) {
			// Admin: optional filter by current branch
			if (branchId) {
				query += ` AND ub.BRANCH_ID = ?`;
				params.push(parseInt(branchId));
			}
		} else {
			// Non-admin: only users in their branch
			if (!branchId) {
				return ApiResponse.success(res, [], 'Users retrieved');
			}
			query += ` AND ub.BRANCH_ID = ?`;
			params.push(parseInt(branchId));
		}

		query += ` GROUP BY u.IDNo ORDER BY u.LASTNAME ASC, u.FIRSTNAME ASC`;

		const [rows] = await pool.execute(query, params);

		const data = rows.map((r) => ({
			id: String(r.user_id),
			firstname: r.FIRSTNAME || '',
			lastname: r.LASTNAME || '',
			name: [r.FIRSTNAME, r.LASTNAME].filter(Boolean).join(' ').trim() || r.USERNAME || '—',
			username: r.USERNAME || '',
			email: (r.EMAIL != null && r.EMAIL !== '') ? r.EMAIL : (r.USERNAME || ''),
			roleId: String(r.role_id || ''),
			roleName: r.role_name || '—',
			lastActivityAt: r.LAST_LOGIN ? new Date(r.LAST_LOGIN).toISOString() : null,
			lastActive: formatLastActive(r.LAST_LOGIN),
			avatar: r.AVATAR_URL || null
		}));

		return ApiResponse.success(res, data, 'Users retrieved');
	} catch (err) {
		console.error('User management getUsers error:', err);
		return ApiResponse.error(res, 'Failed to fetch users', 500, err.message);
	}
}

/**
 * GET /api/user-management/roles
 * Returns roles in shape expected by restoadmin: id, name, description, permissions
 * Works with or without DESCRIPTION/PERMISSIONS columns (migration optional for roles).
 */
async function getRoles(req, res) {
	try {
		let rows;
		try {
			[rows] = await pool.execute(
				'SELECT IDNo, ROLE AS name, DESCRIPTION, PERMISSIONS FROM user_role WHERE ACTIVE = 1 ORDER BY IDNo'
			);
		} catch (colErr) {
			if (colErr.code === 'ER_BAD_FIELD_ERROR') {
				[rows] = await pool.execute(
					'SELECT IDNo, ROLE AS name FROM user_role WHERE ACTIVE = 1 ORDER BY IDNo'
				);
			} else {
				throw colErr;
			}
		}

		const data = rows.map((r) => {
			let permissions = [];
			if (r.PERMISSIONS) {
				try {
					permissions = typeof r.PERMISSIONS === 'string' ? JSON.parse(r.PERMISSIONS) : r.PERMISSIONS;
				} catch (_) {
					permissions = r.IDNo === 1 ? ['all'] : [];
				}
			}
			if (r.IDNo === 1 && permissions.length === 0) permissions = ['all'];
			return {
				id: String(r.IDNo),
				name: r.name || '—',
				description: (r.DESCRIPTION != null) ? r.DESCRIPTION : '',
				permissions: Array.isArray(permissions) ? permissions : []
			};
		});

		return ApiResponse.success(res, data, 'Roles retrieved');
	} catch (err) {
		console.error('User management getRoles error:', err);
		return ApiResponse.error(res, 'Failed to fetch roles', 500, err.message);
	}
}

async function createUser(req, res) {
	try {
		const creatorId = req.user?.user_id;
		const creatorPerm = parseInt(req.user?.permissions) || 0;
		const creatorBranchId = req.user?.branch_id;

		const {
			firstname,
			lastname,
			username,
			email,
			password,
			passwordConfirm,
			roleId,
			branch_id,
			table_id
		} = req.body;

		if (!firstname || !lastname || !username || !password || !passwordConfirm) {
			return ApiResponse.badRequest(res, 'First name, last name, username, and password are required.');
		}
		if (password !== passwordConfirm) {
			return ApiResponse.badRequest(res, 'Passwords do not match.');
		}

		const roleIdNum = parseInt(roleId);
		if (roleIdNum === 1 && creatorPerm !== 1) {
			return ApiResponse.forbidden(res, 'Only admin can create Administrator accounts.');
		}

		let tableIdToSave = null;
		if (roleIdNum === 2) {
			if (!table_id) {
				return ApiResponse.badRequest(res, 'Table is required for this role.');
			}
			tableIdToSave = parseInt(table_id);
			const [existing] = await pool.execute(
				'SELECT IDNo FROM user_info WHERE TABLE_ID = ? AND ACTIVE = 1 LIMIT 1',
				[tableIdToSave]
			);
			if (existing.length > 0) {
				return ApiResponse.badRequest(res, 'Selected table is already assigned to another user.');
			}
		}

		const dateNow = new Date();
		const hashedPw = await argon2.hash(password);

		const [result] = await pool.execute(
			`INSERT INTO user_info (FIRSTNAME, LASTNAME, USERNAME, PASSWORD, SALT, PERMISSIONS, TABLE_ID, LAST_LOGIN, ENCODED_BY, ENCODED_DT)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[firstname, lastname, username, hashedPw, '', roleIdNum, tableIdToSave, dateNow, creatorId, dateNow]
		);
		const newUserId = result.insertId;

		if (email) {
			try {
				await pool.execute('UPDATE user_info SET EMAIL = ? WHERE IDNo = ?', [email, newUserId]);
			} catch (_) {}
		}

		if (roleIdNum === 1) {
			const [branches] = await pool.execute('SELECT IDNo AS BRANCH_ID FROM branches WHERE ACTIVE = 1');
			if (branches.length > 0) {
				const values = branches.map(b => [newUserId, b.BRANCH_ID]);
				await pool.query('INSERT IGNORE INTO user_branches (USER_ID, BRANCH_ID) VALUES ?', [values]);
			}
		} else {
			let targetBranchId = null;
			if (creatorPerm === 1 && branch_id) {
				targetBranchId = parseInt(branch_id);
			} else if (creatorBranchId) {
				targetBranchId = parseInt(creatorBranchId);
			} else {
				const [ub] = await pool.execute('SELECT BRANCH_ID FROM user_branches WHERE USER_ID = ? LIMIT 1', [creatorId]);
				if (ub.length > 0) targetBranchId = parseInt(ub[0].BRANCH_ID);
			}
			if (targetBranchId && !isNaN(targetBranchId)) {
				await pool.execute(
					'INSERT INTO user_branches (USER_ID, BRANCH_ID) VALUES (?, ?) ON DUPLICATE KEY UPDATE BRANCH_ID = VALUES(BRANCH_ID)',
					[newUserId, targetBranchId]
				);
			}
		}

		return ApiResponse.created(res, { id: newUserId }, 'User created successfully');
	} catch (err) {
		console.error('User management createUser error:', err);
		return ApiResponse.error(res, err.message || 'Failed to create user', 500, err.message);
	}
}

async function updateUser(req, res) {
	try {
		const id = parseInt(req.params.id);
		const { firstname, lastname, username, email, roleId, table_id } = req.body;
		if (!id) return ApiResponse.badRequest(res, 'Invalid user id.');

		const roleIdNum = parseInt(roleId);
		let tableIdToSave = null;
		if (roleIdNum === 2) {
			if (!table_id) {
				return ApiResponse.badRequest(res, 'Table is required for this role.');
			}
			tableIdToSave = parseInt(table_id);
			const [existing] = await pool.execute(
				'SELECT IDNo FROM user_info WHERE TABLE_ID = ? AND ACTIVE = 1 AND IDNo <> ? LIMIT 1',
				[tableIdToSave, id]
			);
			if (existing.length > 0) {
				return ApiResponse.badRequest(res, 'Selected table is already assigned to another user.');
			}
		}

		const dateNow = new Date();
		const creatorId = req.user?.user_id;

		await pool.execute(
			`UPDATE user_info SET FIRSTNAME = ?, LASTNAME = ?, USERNAME = ?, PERMISSIONS = ?, TABLE_ID = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`,
			[firstname, lastname, username, roleIdNum, tableIdToSave, creatorId, dateNow, id]
		);

		if (email !== undefined) {
			try {
				await pool.execute('UPDATE user_info SET EMAIL = ? WHERE IDNo = ?', [email || null, id]);
			} catch (_) {}
		}

		return ApiResponse.success(res, { id }, 'User updated successfully');
	} catch (err) {
		console.error('User management updateUser error:', err);
		return ApiResponse.error(res, err.message || 'Failed to update user', 500, err.message);
	}
}

async function deleteUser(req, res) {
	try {
		const id = parseInt(req.params.id);
		if (!id) return ApiResponse.badRequest(res, 'Invalid user id.');
		const dateNow = new Date();
		const editorId = req.user?.user_id;

		await pool.execute(
			'UPDATE user_info SET ACTIVE = 0, TABLE_ID = NULL, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?',
			[editorId, dateNow, id]
		);
		return ApiResponse.success(res, { id }, 'User removed successfully');
	} catch (err) {
		console.error('User management deleteUser error:', err);
		return ApiResponse.error(res, err.message || 'Failed to remove user', 500, err.message);
	}
}

async function createRole(req, res) {
	try {
		const { name, description, permissions } = req.body;
		if (!name || !name.trim()) {
			return ApiResponse.badRequest(res, 'Role name is required.');
		}
		const dateNow = new Date();
		const creatorId = req.user?.user_id || 0;

		let query = 'INSERT INTO user_role (ROLE, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?)';
		const params = [name.trim(), creatorId, dateNow];

		try {
			const [result] = await pool.execute(
				'INSERT INTO user_role (ROLE, DESCRIPTION, PERMISSIONS, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?)',
				[name.trim(), description || null, permissions && Array.isArray(permissions) && permissions.length > 0 ? JSON.stringify(permissions) : null, creatorId, dateNow]
			);
			return ApiResponse.created(res, { id: result.insertId }, 'Role created successfully');
		} catch (colErr) {
			if (colErr.code === 'ER_BAD_FIELD_ERROR') {
				const [result] = await pool.execute(query, params);
				return ApiResponse.created(res, { id: result.insertId }, 'Role created successfully');
			}
			throw colErr;
		}
	} catch (err) {
		console.error('User management createRole error:', err);
		return ApiResponse.error(res, err.message || 'Failed to create role', 500, err.message);
	}
}

async function updateRole(req, res) {
	try {
		const id = parseInt(req.params.id);
		const { name, description, permissions } = req.body;
		if (!id) return ApiResponse.badRequest(res, 'Invalid role id.');
		if (!name || !name.trim()) return ApiResponse.badRequest(res, 'Role name is required.');

		const dateNow = new Date();
		const editorId = req.user?.user_id || 0;

		// Handle permissions: if provided and is array with items, stringify it; otherwise set to null
		// Always update permissions field, even if it's undefined (will be set to null)
		let permissionsValue = null;
		if (permissions !== undefined && permissions !== null) {
			if (Array.isArray(permissions)) {
				if (permissions.length > 0) {
					permissionsValue = JSON.stringify(permissions);
				} else {
					permissionsValue = null; // Empty array means no permissions
				}
			}
		}
		// If permissions is undefined, permissionsValue remains null (will clear the field)

		console.log(`[updateRole] Role ID: ${id}, Permissions received:`, permissions, '-> Storing as:', permissionsValue);

		try {
			const [result] = await pool.execute(
				'UPDATE user_role SET ROLE = ?, DESCRIPTION = ?, PERMISSIONS = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?',
				[name.trim(), description || null, permissionsValue, editorId, dateNow, id]
			);
			console.log(`[updateRole] Update result:`, result.affectedRows, 'rows affected');
		} catch (colErr) {
			if (colErr.code === 'ER_BAD_FIELD_ERROR') {
				console.log('[updateRole] PERMISSIONS column does not exist, skipping permissions update');
				await pool.execute('UPDATE user_role SET ROLE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?', [name.trim(), editorId, dateNow, id]);
			} else {
				throw colErr;
			}
		}
		return ApiResponse.success(res, { id }, 'Role updated successfully');
	} catch (err) {
		console.error('User management updateRole error:', err);
		return ApiResponse.error(res, err.message || 'Failed to update role', 500, err.message);
	}
}

async function deleteRole(req, res) {
	try {
		const id = parseInt(req.params.id);
		if (!id) return ApiResponse.badRequest(res, 'Invalid role id.');
		const dateNow = new Date();
		const editorId = req.user?.user_id || 0;

		await pool.execute('UPDATE user_role SET ACTIVE = 0, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?', [editorId, dateNow, id]);
		return ApiResponse.success(res, { id }, 'Role removed successfully');
	} catch (err) {
		console.error('User management deleteRole error:', err);
		return ApiResponse.error(res, err.message || 'Failed to remove role', 500, err.message);
	}
}

// Export as object with static methods for router
module.exports = {
	getUsers: async (req, res) => getUsers(req, res),
	getRoles: async (req, res) => getRoles(req, res),
	createUser: async (req, res) => createUser(req, res),
	updateUser: async (req, res) => updateUser(req, res),
	deleteUser: async (req, res) => deleteUser(req, res),
	createRole: async (req, res) => createRole(req, res),
	updateRole: async (req, res) => updateRole(req, res),
	deleteRole: async (req, res) => deleteRole(req, res)
};
