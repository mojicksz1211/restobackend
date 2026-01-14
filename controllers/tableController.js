// ============================================
// TABLE CONTROLLER
// ============================================
// File: controllers/tableController.js
// Description: Handles restaurant table-related business logic
// ============================================

const TableModel = require('../models/tableModel');

class TableController {
	// Display restaurant table management page
	static async showPage(req, res) {
		const sessions = {
			username: req.session.username,
			firstname: req.session.firstname,
			lastname: req.session.lastname,
			user_id: req.session.user_id,
			currentPage: 'manageTable'
		};
		res.render("table/manageTable", sessions);
	}

	// Get all restaurant tables
	static async getAll(req, res) {
		try {
			const tables = await TableModel.getAll();
			res.json(tables);
		} catch (error) {
			console.error('Error fetching restaurant tables:', error);
			res.status(500).json({ error: 'Failed to fetch restaurant tables' });
		}
	}

	// Create new restaurant table
	static async create(req, res) {
		try {
			const {
				TABLE_NUMBER,
				CAPACITY,
				STATUS
			} = req.body;

			if (!TABLE_NUMBER || TABLE_NUMBER.trim() === '') {
				return res.status(400).json({ error: 'Table number is required' });
			}

			const user_id = req.session.user_id;
			const tableId = await TableModel.create({
				TABLE_NUMBER,
				CAPACITY,
				STATUS,
				user_id
			});

			res.json({ 
				success: true, 
				message: 'Restaurant table created successfully',
				id: tableId
			});
		} catch (error) {
			console.error('Error creating restaurant table:', error);
			res.status(500).json({ error: 'Failed to create restaurant table' });
		}
	}

	// Update restaurant table
	static async update(req, res) {
		try {
			const { id } = req.params;
			const {
				TABLE_NUMBER,
				CAPACITY,
				STATUS
			} = req.body;

			if (!TABLE_NUMBER || TABLE_NUMBER.trim() === '') {
				return res.status(400).json({ error: 'Table number is required' });
			}

			const updated = await TableModel.update(id, {
				TABLE_NUMBER,
				CAPACITY,
				STATUS
			});

			if (!updated) {
				return res.status(404).json({ error: 'Restaurant table not found' });
			}

			res.json({ success: true, message: 'Restaurant table updated successfully' });
		} catch (error) {
			console.error('Error updating restaurant table:', error);
			res.status(500).json({ error: 'Failed to update restaurant table' });
		}
	}

	// Delete restaurant table
	static async delete(req, res) {
		try {
			const { id } = req.params;

			const deleted = await TableModel.delete(id);

			if (!deleted) {
				return res.status(404).json({ error: 'Restaurant table not found' });
			}

			res.json({ success: true, message: 'Restaurant table deleted successfully' });
		} catch (error) {
			console.error('Error deleting restaurant table:', error);
			res.status(500).json({ error: 'Failed to delete restaurant table' });
		}
	}
}

module.exports = TableController;

