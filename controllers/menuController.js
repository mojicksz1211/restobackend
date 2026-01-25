// ============================================
// MENU CONTROLLER
// ============================================
// File: controllers/menuController.js
// Description: Handles menu-related business logic
// ============================================

const MenuModel = require('../models/menuModel');
const TranslationService = require('../utils/translationService');

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
			
			// Get target language from query parameter, cookie, or default to 'en'
			// If user selected Korean in UI, show original Korean text (no translation)
			// If user selected English/Japanese/Chinese, translate from Korean to that language
			const targetLanguage = req.query.lang || req.query.language || req.cookies?.lang || 'en';
			
			// Apply translation based on target language
			// Descriptions: ALWAYS translate to selected language (English descriptions should be translated to Korean, Japanese, Chinese, etc.)
			// Menu names & Category names: translate only if not Korean (Korean stays in Korean)
			if (TranslationService.isAvailable()) {
				// First, translate descriptions (always, regardless of target language)
				try {
					const descTextsToTranslate = [];
					const descTextMapping = [];
					
					menus.forEach(menu => {
						if (menu.MENU_DESCRIPTION) {
							descTextsToTranslate.push(menu.MENU_DESCRIPTION);
							descTextMapping.push({ menu: menu });
						}
					});
					
					if (descTextsToTranslate.length > 0) {
						const descTranslations = await TranslationService.translateBatch(descTextsToTranslate, targetLanguage);
						descTranslations.forEach((translation, index) => {
							if (descTextMapping[index]) {
								descTextMapping[index].menu.MENU_DESCRIPTION = translation || descTextMapping[index].menu.MENU_DESCRIPTION;
							}
						});
					}
				} catch (descError) {
					console.error('[MENU CONTROLLER] Description translation error:', descError.message);
				}
				
				// Then, translate menu names and category names
				// If Korean is selected: translate English text to Korean, keep Korean text as is
				// If other language is selected: translate to that language
				try {
					// Collect all texts to translate in batch
					const textsToTranslate = [];
					const textMapping = []; // Track which field each text belongs to
					
					menus.forEach(menu => {
						// Menu names: always translate (auto-detect will handle Korean vs English)
						if (menu.MENU_NAME) {
							textsToTranslate.push(menu.MENU_NAME);
							textMapping.push({ type: 'name', menu: menu });
						}
						// Category names: always translate (auto-detect will handle Korean vs English)
						if (menu.CATEGORY_NAME) {
							textsToTranslate.push(menu.CATEGORY_NAME);
							textMapping.push({ type: 'category', menu: menu });
						}
					});

					if (textsToTranslate.length > 0) {
						// Translate in batch - auto-detect source language (handles both Korean and English)
						// This will translate English to Korean when Korean is selected
						// And translate Korean to other languages when other languages are selected
						const translations = await TranslationService.translateBatch(textsToTranslate, targetLanguage);
						
						// Map translations back to menus
						translations.forEach((translation, index) => {
							const mapping = textMapping[index];
							if (mapping) {
								if (mapping.type === 'name') {
									mapping.menu.MENU_NAME = translation || mapping.menu.MENU_NAME;
								} else if (mapping.type === 'category') {
									mapping.menu.CATEGORY_NAME = translation || mapping.menu.CATEGORY_NAME;
								}
							}
						});
					}
				} catch (nameError) {
					console.error('[MENU CONTROLLER] Menu/Category name translation error:', nameError.message);
				}
			}
			
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
			
			// Get target language from query parameter, cookie, or default to 'en'
			const targetLanguage = req.query.lang || req.query.language || req.cookies?.lang || 'en';
			
			// Apply translation if target language is not Korean (ko) and translation service is available
			if (targetLanguage !== 'ko' && TranslationService.isAvailable()) {
				try {
					// Collect all texts to translate
					const textsToTranslate = [];
					categories.forEach(cat => {
						if (cat.CATEGORY_NAME) textsToTranslate.push(cat.CATEGORY_NAME);
					});

					if (textsToTranslate.length > 0) {
						// Translate in batch - auto-detect source language (handles both Korean and English)
						const translations = await TranslationService.translateBatch(textsToTranslate, targetLanguage);
						
						// Map translations back to categories
						let translationIndex = 0;
						categories.forEach(cat => {
							if (cat.CATEGORY_NAME) {
								cat.CATEGORY_NAME = translations[translationIndex++] || cat.CATEGORY_NAME;
							}
						});
					}
				} catch (translationError) {
					console.error('[MENU CONTROLLER] Category translation error:', translationError);
					// Continue with original text if translation fails
				}
			}
			
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

