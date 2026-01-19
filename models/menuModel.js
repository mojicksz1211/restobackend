// ============================================
// MENU MODEL
// ============================================
// File: models/menuModel.js
// Description: Database operations for menus
// ============================================

const pool = require('../config/db');

class MenuModel {
	// Get all active menus with category name
	static async getAll() {
		const query = `
			SELECT 
				m.IDNo,
				m.CATEGORY_ID,
				c.CAT_NAME AS CATEGORY_NAME,
				m.MENU_NAME,
				m.MENU_DESCRIPTION,
				m.MENU_IMG,
				m.MENU_PRICE,
				m.IS_AVAILABLE,
				m.ACTIVE,
				m.ENCODED_BY,
				m.ENCODED_DT,
				m.EDITED_BY,
				m.EDITED_DT
			FROM menu m
			LEFT JOIN categories c ON m.CATEGORY_ID = c.IDNo
			WHERE m.ACTIVE = 1
			ORDER BY m.IDNo ASC
		`;
		const [rows] = await pool.execute(query);
		return rows;
	}

	// Get menu by ID
	static async getById(id) {
		const query = `
			SELECT * FROM menu 
			WHERE IDNo = ? AND ACTIVE = 1
		`;
		const [rows] = await pool.execute(query, [id]);
		return rows[0];
	}

	// Create new menu
	static async create(data) {
		const {
			CATEGORY_ID,
			MENU_NAME,
			MENU_DESCRIPTION,
			MENU_IMG,
			MENU_PRICE,
			IS_AVAILABLE,
			user_id
		} = data;
		const currentDate = new Date();

		const query = `
			INSERT INTO menu (
				CATEGORY_ID,
				MENU_NAME,
				MENU_DESCRIPTION,
				MENU_IMG,
				MENU_PRICE,
				IS_AVAILABLE,
				ACTIVE,
				ENCODED_BY,
				ENCODED_DT
			) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
		`;

		const [result] = await pool.execute(query, [
			CATEGORY_ID || null,
			MENU_NAME,
			MENU_DESCRIPTION || null,
			MENU_IMG || null,
			MENU_PRICE || 0,
			IS_AVAILABLE || 0,
			user_id,
			currentDate
		]);

		return result.insertId;
	}

	// Update menu
	static async update(id, data) {
		const {
			CATEGORY_ID,
			MENU_NAME,
			MENU_DESCRIPTION,
			MENU_IMG,
			MENU_PRICE,
			IS_AVAILABLE,
			user_id
		} = data;
		const currentDate = new Date();

		const query = `
			UPDATE menu SET
				CATEGORY_ID = ?,
				MENU_NAME = ?,
				MENU_DESCRIPTION = ?,
				MENU_IMG = ?,
				MENU_PRICE = ?,
				IS_AVAILABLE = ?,
				EDITED_BY = ?,
				EDITED_DT = ?
			WHERE IDNo = ? AND ACTIVE = 1
		`;

		const [result] = await pool.execute(query, [
			CATEGORY_ID || null,
			MENU_NAME,
			MENU_DESCRIPTION || null,
			MENU_IMG || null,
			MENU_PRICE || 0,
			IS_AVAILABLE || 0,
			user_id,
			currentDate,
			id
		]);

		return result.affectedRows > 0;
	}

	// Soft delete menu
	static async delete(id, user_id) {
		const currentDate = new Date();

		const query = `
			UPDATE menu SET
				ACTIVE = 0,
				EDITED_BY = ?,
				EDITED_DT = ?
			WHERE IDNo = ?
		`;

		const [result] = await pool.execute(query, [user_id, currentDate, id]);
		return result.affectedRows > 0;
	}

	// Get all categories for dropdown
	static async getCategories() {
		const query = `
			SELECT IDNo, CAT_NAME AS CATEGORY_NAME 
			FROM categories 
			WHERE ACTIVE = 1 
			ORDER BY CAT_NAME
		`;
		const [rows] = await pool.execute(query);
		return rows;
	}

	// Get menus filtered by category (for API)
	static async getByCategory(categoryId = null) {
		let query = `
			SELECT 
				m.IDNo,
				m.CATEGORY_ID,
				c.CAT_NAME AS CATEGORY_NAME,
				m.MENU_NAME,
				m.MENU_DESCRIPTION,
				m.MENU_IMG,
				m.MENU_PRICE,
				m.IS_AVAILABLE
			FROM menu m
			LEFT JOIN categories c ON m.CATEGORY_ID = c.IDNo
			WHERE m.ACTIVE = 1 AND m.IS_AVAILABLE = 1
		`;
		
		const params = [];
		if (categoryId) {
			query += ` AND m.CATEGORY_ID = ?`;
			params.push(categoryId);
		}
		
		query += ` ORDER BY m.IDNo ASC`;
		
		const [rows] = await pool.execute(query, params);
		return rows;
	}
}

module.exports = MenuModel;

