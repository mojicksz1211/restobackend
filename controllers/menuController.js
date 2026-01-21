// ============================================
// MENU CONTROLLER
// ============================================
// File: controllers/menuController.js
// Description: Handles menu-related business logic
// ============================================

const MenuModel = require('../models/menuModel');

class MenuController {
	// Display menu management page
	static async showPage(req, res) {
		const sessions = {
			username: req.session.username,
			firstname: req.session.firstname,
			lastname: req.session.lastname,
			user_id: req.session.user_id,
			currentPage: 'manageMenu'
		};
		res.render("menu/manageMenu", sessions);
	}

	// Get all menus
	static async getAll(req, res) {
		try {
			// Prioritize session branch_id
			const branchId = req.session?.branch_id || req.query.branch_id || req.body.branch_id || req.user?.branch_id || null;
			const menus = await MenuModel.getAll(branchId);
			res.json(menus);
		} catch (error) {
			console.error('Error fetching menus:', error);
			res.status(500).json({ error: 'Failed to fetch menus' });
		}
	}

	// Get all categories for dropdown
	static async getCategories(req, res) {
		try {
			const categories = await MenuModel.getCategories();
			res.json(categories);
		} catch (error) {
			console.error('Error fetching categories:', error);
			res.status(500).json({ error: 'Failed to fetch categories' });
		}
	}

	// Create new menu
	static async create(req, res) {
		try {
			const {
				CATEGORY_ID,
				MENU_NAME,
				MENU_DESCRIPTION,
				MENU_PRICE,
				IS_AVAILABLE
			} = req.body;

			// Handle file upload
			let MENU_IMG = null;
			if (req.file) {
				MENU_IMG = `/uploads/menu/${req.file.filename}`;
			}

			const user_id = req.session.user_id || req.user?.user_id;
			// Prioritize session branch_id
			const branchId = req.session?.branch_id || req.body.BRANCH_ID || req.query.branch_id || req.user?.branch_id;
			if (!branchId) {
				return res.status(400).json({ error: 'Branch ID is required. Please select a branch first.' });
			}
			const menuId = await MenuModel.create({
				BRANCH_ID: branchId,
				CATEGORY_ID,
				MENU_NAME,
				MENU_DESCRIPTION,
				MENU_IMG,
				MENU_PRICE,
				IS_AVAILABLE,
				user_id
			});

			res.json({ 
				success: true, 
				message: 'Menu created successfully',
				id: menuId
			});
		} catch (error) {
			console.error('Error creating menu:', error);
			res.status(500).json({ error: 'Failed to create menu' });
		}
	}

	// Update menu
	static async update(req, res) {
		try {
			const { id } = req.params;
			const {
				CATEGORY_ID,
				MENU_NAME,
				MENU_DESCRIPTION,
				MENU_IMG, // This is the existing image URL from hidden input
				MENU_PRICE,
				IS_AVAILABLE
			} = req.body;

			// Handle file upload - if new file uploaded, use it; otherwise keep existing
			let imagePath = MENU_IMG; // Default to existing image
			if (req.file) {
				imagePath = `/uploads/menu/${req.file.filename}`;
				// TODO: Optionally delete old image file if exists
			}

			const user_id = req.session.user_id;
			const updated = await MenuModel.update(id, {
				CATEGORY_ID,
				MENU_NAME,
				MENU_DESCRIPTION,
				MENU_IMG: imagePath,
				MENU_PRICE,
				IS_AVAILABLE,
				user_id
			});

			if (!updated) {
				return res.status(404).json({ error: 'Menu not found' });
			}

			res.json({ success: true, message: 'Menu updated successfully' });
		} catch (error) {
			console.error('Error updating menu:', error);
			res.status(500).json({ error: 'Failed to update menu' });
		}
	}

	// Delete menu
	static async delete(req, res) {
		try {
			const { id } = req.params;
			const user_id = req.session.user_id;

			const deleted = await MenuModel.delete(id, user_id);

			if (!deleted) {
				return res.status(404).json({ error: 'Menu not found' });
			}

			res.json({ success: true, message: 'Menu deleted successfully' });
		} catch (error) {
			console.error('Error deleting menu:', error);
			res.status(500).json({ error: 'Failed to delete menu' });
		}
	}
}

module.exports = MenuController;

