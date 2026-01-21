// ============================================
// USER BRANCH MODEL
// ============================================
// File: models/userBranchModel.js
// Description: Database operations for user-branch relationships
// ============================================

const pool = require('../config/db');

class UserBranchModel {
	// Get all branches for a user
	static async getBranchesByUserId(userId) {
		const query = `
			SELECT 
				b.IDNo,
				b.BRANCH_CODE,
				b.BRANCH_NAME,
				b.ADDRESS,
				b.PHONE,
				b.ACTIVE
			FROM user_branches ub
			INNER JOIN branches b ON b.IDNo = ub.BRANCH_ID
			WHERE ub.USER_ID = ? AND b.ACTIVE = 1
			ORDER BY b.BRANCH_NAME ASC
		`;
		const [rows] = await pool.execute(query, [userId]);
		return rows;
	}

	// Get all users for a branch
	static async getUsersByBranchId(branchId) {
		const query = `
			SELECT 
				u.IDNo,
				u.USERNAME,
				u.FIRSTNAME,
				u.LASTNAME,
				u.PERMISSIONS,
				u.ACTIVE
			FROM user_branches ub
			INNER JOIN user_info u ON u.IDNo = ub.USER_ID
			WHERE ub.BRANCH_ID = ? AND u.ACTIVE = 1
			ORDER BY u.USERNAME ASC
		`;
		const [rows] = await pool.execute(query, [branchId]);
		return rows;
	}

	// Check if user has access to branch
	static async hasAccess(userId, branchId) {
		const query = `
			SELECT COUNT(*) as count
			FROM user_branches
			WHERE USER_ID = ? AND BRANCH_ID = ?
		`;
		const [rows] = await pool.execute(query, [userId, branchId]);
		return rows[0].count > 0;
	}

	// Add user to branch
	static async addUserToBranch(userId, branchId) {
		const query = `
			INSERT INTO user_branches (USER_ID, BRANCH_ID)
			VALUES (?, ?)
			ON DUPLICATE KEY UPDATE BRANCH_ID = VALUES(BRANCH_ID)
		`;
		await pool.execute(query, [userId, branchId]);
		return true;
	}

	// Remove user from branch
	static async removeUserFromBranch(userId, branchId) {
		const query = `
			DELETE FROM user_branches
			WHERE USER_ID = ? AND BRANCH_ID = ?
		`;
		const [result] = await pool.execute(query, [userId, branchId]);
		return result.affectedRows > 0;
	}

	// Replace all branches for a user
	static async setUserBranches(userId, branchIds) {
		// First, remove all existing associations
		await pool.execute('DELETE FROM user_branches WHERE USER_ID = ?', [userId]);
		
		// Then add new associations
		if (branchIds && branchIds.length > 0) {
			const values = branchIds.map(branchId => [userId, branchId]);
			const query = `
				INSERT INTO user_branches (USER_ID, BRANCH_ID)
				VALUES ?
			`;
			await pool.query(query, [values]);
		}
		
		return true;
	}

	// Replace all users for a branch
	static async setBranchUsers(branchId, userIds) {
		// First, remove all existing associations
		await pool.execute('DELETE FROM user_branches WHERE BRANCH_ID = ?', [branchId]);
		
		// Then add new associations
		if (userIds && userIds.length > 0) {
			const values = userIds.map(userId => [userId, branchId]);
			const query = `
				INSERT INTO user_branches (USER_ID, BRANCH_ID)
				VALUES ?
			`;
			await pool.query(query, [values]);
		}
		
		return true;
	}
}

module.exports = UserBranchModel;

