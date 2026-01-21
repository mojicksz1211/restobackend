// ============================================
// CATEGORY CONTROLLER
// ============================================
// File: controllers/categoryController.js
// Description: Handles category-related business logic
// ============================================

const CategoryModel = require('../models/categoryModel');
const BranchModel = require('../models/branchModel');

class CategoryController {
	// Display category management page
	static async showPage(req, res) {
		const sessions = {
			username: req.session.username,
			firstname: req.session.firstname,
			lastname: req.session.lastname,
			user_id: req.session.user_id,
			currentPage: 'manageCategory'
		};
		res.render("category/manageCategory", sessions);
	}

	// Get all categories
	static async getAll(req, res) {
		try {
			const categories = await CategoryModel.getAll();
			res.json(categories);
		} catch (error) {
			console.error('Error fetching categories:', error);
			res.status(500).json({ error: 'Failed to fetch categories' });
		}
	}

	// Create new category
	static async create(req, res) {
		try {
			const { CAT_NAME, CAT_DESC } = req.body;

			if (!CAT_NAME || CAT_NAME.trim() === '') {
				return res.status(400).json({ error: 'Category name is required' });
			}

			const user_id = req.session.user_id || req.user?.user_id;

			// Categories are shared across branches; assign a fallback branch id only if required by schema
			let branchId = req.session?.branch_id || req.body.BRANCH_ID || req.query.branch_id || req.user?.branch_id || null;
			if (!branchId) {
				const branches = await BranchModel.getAll();
				branchId = branches.length > 0 ? branches[0].IDNo : null;
			}

			const categoryId = await CategoryModel.create({
				BRANCH_ID: branchId,
				CAT_NAME,
				CAT_DESC,
				user_id
			});

			res.json({ 
				success: true, 
				message: 'Category created successfully',
				id: categoryId
			});
		} catch (error) {
			console.error('Error creating category:', error);
			res.status(500).json({ error: 'Failed to create category' });
		}
	}

	// Update category
	static async update(req, res) {
		try {
			const { id } = req.params;
			const { CAT_NAME, CAT_DESC } = req.body;

			if (!CAT_NAME || CAT_NAME.trim() === '') {
				return res.status(400).json({ error: 'Category name is required' });
			}

			const user_id = req.session.user_id;
			const updated = await CategoryModel.update(id, {
				CAT_NAME,
				CAT_DESC,
				user_id
			});

			if (!updated) {
				return res.status(404).json({ error: 'Category not found' });
			}

			res.json({ success: true, message: 'Category updated successfully' });
		} catch (error) {
			console.error('Error updating category:', error);
			res.status(500).json({ error: 'Failed to update category' });
		}
	}

	// Delete category
	static async delete(req, res) {
		try {
			const { id } = req.params;
			const user_id = req.session.user_id;

			const deleted = await CategoryModel.delete(id, user_id);

			if (!deleted) {
				return res.status(404).json({ error: 'Category not found' });
			}

			res.json({ success: true, message: 'Category deleted successfully' });
		} catch (error) {
			console.error('Error deleting category:', error);
			res.status(500).json({ error: 'Failed to delete category' });
		}
	}
}

module.exports = CategoryController;

