// ============================================
// CATEGORY MODEL
// ============================================
// File: models/categoryModel.js
// Description: Database operations for categories
// ============================================

const pool = require('../config/db');

class CategoryModel {
	// Get all active categories
	static async getAll() {
		let query = `
			SELECT 
				IDNo,
				CAT_NAME,
				CAT_DESC,
				ACTIVE,
				ENCODED_BY,
				ENCODED_DT,
				EDITED_BY,
				EDITED_DT
			FROM categories
			WHERE ACTIVE = 1
		`;

		query += ` ORDER BY IDNo ASC`;

		const [rows] = await pool.execute(query);
		return rows;
	}

	// Get category by ID
	static async getById(id) {
		const query = `
			SELECT * FROM categories 
			WHERE IDNo = ? AND ACTIVE = 1
		`;
		const [rows] = await pool.execute(query, [id]);
		return rows[0];
	}

	// Create new category
	static async create(data) {
		const { CAT_NAME, CAT_DESC, user_id } = data;
		const branchId = data.BRANCH_ID ?? null;
		const currentDate = new Date();

		const query = `
			INSERT INTO categories (
				BRANCH_ID,
				CAT_NAME,
				CAT_DESC,
				ACTIVE,
				ENCODED_BY,
				ENCODED_DT
			) VALUES (?, ?, ?, 1, ?, ?)
		`;

		const [result] = await pool.execute(query, [
			branchId,
			CAT_NAME.trim(),
			CAT_DESC || null,
			user_id,
			currentDate
		]);

		return result.insertId;
	}

	// Update category
	static async update(id, data) {
		const { CAT_NAME, CAT_DESC, user_id } = data;
		const currentDate = new Date();

		const query = `
			UPDATE categories SET
				CAT_NAME = ?,
				CAT_DESC = ?,
				EDITED_BY = ?,
				EDITED_DT = ?
			WHERE IDNo = ? AND ACTIVE = 1
		`;

		const [result] = await pool.execute(query, [
			CAT_NAME.trim(),
			CAT_DESC || null,
			user_id,
			currentDate,
			id
		]);

		return result.affectedRows > 0;
	}

	// Soft delete category
	static async delete(id, user_id) {
		const currentDate = new Date();

		const query = `
			UPDATE categories SET
				ACTIVE = 0,
				EDITED_BY = ?,
				EDITED_DT = ?
			WHERE IDNo = ?
		`;

		const [result] = await pool.execute(query, [user_id, currentDate, id]);
		return result.affectedRows > 0;
	}
}

module.exports = CategoryModel;

