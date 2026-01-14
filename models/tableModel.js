// ============================================
// TABLE MODEL
// ============================================
// File: models/tableModel.js
// Description: Database operations for restaurant tables
// ============================================

const pool = require('../config/db');

class TableModel {
	// Get all restaurant tables
	static async getAll() {
		const query = `
			SELECT 
				IDNo,
				TABLE_NUMBER,
				CAPACITY,
				STATUS,
				ENCODED_BY,
				ENCODED_DT
			FROM restaurant_tables
			ORDER BY TABLE_NUMBER ASC
		`;
		const [rows] = await pool.execute(query);
		return rows;
	}

	// Create new restaurant table
	static async create(data) {
		const { TABLE_NUMBER, CAPACITY, STATUS, user_id } = data;
		const currentDate = new Date();

		const query = `
			INSERT INTO restaurant_tables (
				TABLE_NUMBER,
				CAPACITY,
				STATUS,
				ENCODED_BY,
				ENCODED_DT
			) VALUES (?, ?, ?, ?, ?)
		`;

		const [result] = await pool.execute(query, [
			TABLE_NUMBER,
			parseInt(CAPACITY) || 0,
			parseInt(STATUS) || 1,
			user_id,
			currentDate
		]);

		return result.insertId;
	}

	// Update restaurant table
	static async update(id, data) {
		const { TABLE_NUMBER, CAPACITY, STATUS } = data;

		const query = `
			UPDATE restaurant_tables SET
				TABLE_NUMBER = ?,
				CAPACITY = ?,
				STATUS = ?
			WHERE IDNo = ?
		`;

		const [result] = await pool.execute(query, [
			TABLE_NUMBER,
			parseInt(CAPACITY) || 0,
			parseInt(STATUS) || 1,
			id
		]);

		return result.affectedRows > 0;
	}

	// Delete restaurant table
	static async delete(id) {
		const query = `
			DELETE FROM restaurant_tables
			WHERE IDNo = ?
		`;

		const [result] = await pool.execute(query, [id]);
		return result.affectedRows > 0;
	}

	static async updateStatus(id, status) {
		const query = `
			UPDATE restaurant_tables 
			SET STATUS = ?
			WHERE IDNo = ?
		`;
		const [result] = await pool.execute(query, [status, id]);
		return result.affectedRows > 0;
	}
}

module.exports = TableModel;

