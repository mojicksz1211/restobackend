// ============================================
// API CONTROLLER
// ============================================
// File: controllers/apiController.js
// Description: Public API endpoints for Android app
// ============================================

const MenuModel = require('../models/menuModel');
const CategoryModel = require('../models/categoryModel');

class ApiController {
	// Get all categories (for filter button)
	static async getCategories(req, res) {
		try {
			const categories = await CategoryModel.getAll();
			
			// Format response for Android app
			const formattedCategories = categories.map(cat => ({
				id: cat.IDNo,
				name: cat.CAT_NAME,
				description: cat.CAT_DESC || null
			}));

			res.json({
				success: true,
				data: formattedCategories
			});
		} catch (error) {
			console.error('Error fetching categories:', error);
			res.status(500).json({ 
				success: false,
				error: 'Failed to fetch categories' 
			});
		}
	}

	// Get menu items (with optional category filter)
	static async getMenuItems(req, res) {
		try {
			const categoryId = req.query.category_id || null;
			const menus = await MenuModel.getByCategory(categoryId);
			
			// Format response for Android app
			// Include full image URL
			const baseUrl = req.protocol + '://' + req.get('host');
			const formattedMenus = menus.map(menu => ({
				id: menu.IDNo,
				category_id: menu.CATEGORY_ID,
				category_name: menu.CATEGORY_NAME || null,
				name: menu.MENU_NAME,
				description: menu.MENU_DESCRIPTION || null,
				image: menu.MENU_IMG ? baseUrl + menu.MENU_IMG : null,
				price: parseFloat(menu.MENU_PRICE || 0),
				is_available: menu.IS_AVAILABLE === 1
			}));

			res.json({
				success: true,
				data: formattedMenus,
				count: formattedMenus.length
			});
		} catch (error) {
			console.error('Error fetching menu items:', error);
			res.status(500).json({ 
				success: false,
				error: 'Failed to fetch menu items' 
			});
		}
	}
}

module.exports = ApiController;

