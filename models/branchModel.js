const pool = require('../config/db');

class BranchModel {
	// Get all active branches
	static async getAll() {
		const query = `
			SELECT 
				IDNo,
				BRANCH_CODE,
				BRANCH_NAME,
				ADDRESS,
				PHONE,
				ACTIVE,
				CREATED_DT
			FROM branches
			WHERE ACTIVE = 1
			ORDER BY IDNo ASC
		`;
		const [rows] = await pool.execute(query);
		return rows;
	}

	// Get branch by ID
	static async getById(id) {
		// Ensure id is an integer
		const branchId = parseInt(id);
		if (isNaN(branchId)) {
			return null;
		}
		
		const query = `
			SELECT * FROM branches 
			WHERE IDNo = ? AND ACTIVE = 1
		`;
		const [rows] = await pool.execute(query, [branchId]);
		return rows[0] || null;
	}

	// Get branch by code
	static async getByCode(branchCode) {
		const query = `
			SELECT * FROM branches 
			WHERE BRANCH_CODE = ? AND ACTIVE = 1
		`;
		const [rows] = await pool.execute(query, [branchCode]);
		return rows[0];
	}

	// Create new branch
	static async create(data) {
		const { BRANCH_CODE, BRANCH_NAME, ADDRESS, PHONE } = data;

		const query = `
			INSERT INTO branches (
				BRANCH_CODE,
				BRANCH_NAME,
				ADDRESS,
				PHONE,
				ACTIVE
			) VALUES (?, ?, ?, ?, 1)
		`;

		const [result] = await pool.execute(query, [
			BRANCH_CODE.trim(),
			BRANCH_NAME.trim(),
			ADDRESS || null,
			PHONE || null
		]);

		return result.insertId;
	}

	// Update branch
	static async update(id, data) {
		const { BRANCH_CODE, BRANCH_NAME, ADDRESS, PHONE } = data;

		const query = `
			UPDATE branches SET
				BRANCH_CODE = ?,
				BRANCH_NAME = ?,
				ADDRESS = ?,
				PHONE = ?
			WHERE IDNo = ? AND ACTIVE = 1
		`;

		const [result] = await pool.execute(query, [
			BRANCH_CODE.trim(),
			BRANCH_NAME.trim(),
			ADDRESS || null,
			PHONE || null,
			id
		]);

		return result.affectedRows > 0;
	}

	// Soft delete branch
	static async delete(id) {
		const query = `
			UPDATE branches SET
				ACTIVE = 0
			WHERE IDNo = ?
		`;

		const [result] = await pool.execute(query, [id]);
		return result.affectedRows > 0;
	}
}

module.exports = BranchModel;

