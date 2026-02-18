// ============================================
// API CONTROLLER
// ============================================
// File: controllers/apiController.js
// Description: Public API endpoints for Android app
// ============================================

const MenuModel = require('../models/menuModel');
const CategoryModel = require('../models/categoryModel');
const OrderModel = require('../models/orderModel');
const OrderItemsModel = require('../models/orderItemsModel');
const BillingModel = require('../models/billingModel');
const TableModel = require('../models/tableModel');
const pool = require('../config/db');
const argon2 = require('argon2');
const crypto = require('crypto');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const socketService = require('../utils/socketService');
const TranslationService = require('../utils/translationService');

// Helper function to check if password is Argon2 hash
function isArgonHash(hash) {
	return typeof hash === 'string' && hash.startsWith('$argon2');
}

// Fallback MD5 for legacy support
function generateMD5(input) {
	return crypto.createHash('md5').update(input).digest('hex');
}

class ApiController {
	// Login endpoint for mobile app
	static async login(req, res) {
		const timestamp = new Date().toISOString();

		try {
			const { username, password } = req.body;

			if (!username || !password) {
				console.log(`[${timestamp}] [LOGIN FAILED] Missing credentials - Username: ${username || 'N/A'}`);
				return res.status(400).json({
					success: false,
					error: 'Username and password are required'
				});
			}

			// Join with user_role table to get role name
			const query = `
				SELECT 
					user_info.*,
					user_role.ROLE AS role
				FROM user_info 
				LEFT JOIN user_role ON user_role.IDno = user_info.PERMISSIONS
				WHERE user_info.USERNAME = ? AND user_info.ACTIVE = 1
			`;
			const [results] = await pool.execute(query, [username]);

			if (results.length > 0) {
				const user = results[0];
				const storedPassword = user.PASSWORD;
				const salt = user.SALT;
				const userRole = user.role || null; // Get role name from joined table

				let isValid = false;
				let isLegacy = false;

				if (isArgonHash(storedPassword)) {
					// ✅ Argon2 login
					isValid = await argon2.verify(storedPassword, password);
				} else {
					// 🔁 MD5 fallback
					const hashedMD5 = generateMD5(salt + password);
					isValid = (hashedMD5 === storedPassword);
					isLegacy = true;
				}

				if (isValid) {
					// Check if user has PERMISSIONS = 2 (Tablet), 14 (Waiter), 15 (Cashier), or 16 (Kitchen)
					// Allow tablet, waiter, cashier, and kitchen users to login via API
					const allowedPermissions = [2, 14, 15, 16]; // 2 = Tablet, 14 = Waiter, 15 = Cashier, 16 = Kitchen
					const userPermissions = parseInt(user.PERMISSIONS, 10); // Convert to integer for comparison
					
					// Debug logging
					console.log(`[${timestamp}] [LOGIN CHECK] ${username} - PERMISSIONS: ${user.PERMISSIONS} (type: ${typeof user.PERMISSIONS}), parsed: ${userPermissions}, allowed: [${allowedPermissions.join(', ')}]`);
					
					if (!allowedPermissions.includes(userPermissions)) {
						console.log(`[${timestamp}] [LOGIN FAILED] ${username} - Not an allowed mobile app user (PERMISSIONS: ${user.PERMISSIONS}, parsed: ${userPermissions}, allowed: [${allowedPermissions.join(', ')}])`);
						return res.status(403).json({
							success: false,
							error: 'This account is for web admin only. Please use the web application to login.'
						});
					}
					
					console.log(`[${timestamp}] [LOGIN PERMISSION CHECK PASSED] ${username} - PERMISSIONS: ${userPermissions}`);

					// Optional: auto-upgrade legacy MD5 password to Argon2
					if (isLegacy) {
						const newHash = await argon2.hash(password);
						await pool.execute(`UPDATE user_info SET PASSWORD = ?, SALT = NULL WHERE IDNo = ?`, [newHash, user.IDNo]);
					}

					// Update last login
					await pool.execute(`UPDATE user_info SET LAST_LOGIN = ? WHERE IDNo = ?`, [new Date(), user.IDNo]);

					// Log successful login - simple format
					console.log(`[${timestamp}] [LOGIN] ${username}`);

					// Get user's accessible branches
					let branches = [];
					try {
						const UserBranchModel = require('../models/userBranchModel');
						if (user.PERMISSIONS === 1) {
							// Admin can access all branches
							const [allBranches] = await pool.execute(
								'SELECT IDNo, BRANCH_CODE, BRANCH_NAME FROM branches WHERE ACTIVE = 1'
							);
							branches = allBranches;
						} else {
							// Regular users get their assigned branches
							branches = await UserBranchModel.getBranchesByUserId(user.IDNo);
						}
					} catch (branchError) {
						// Log error but don't fail login - just return empty branches array
						console.error(`[${timestamp}] [LOGIN] Error getting branches for user ${user.IDNo}:`, branchError);
						branches = [];
					}

					// Generate JWT tokens
					const tokenPayload = {
						user_id: user.IDNo,
						username: user.USERNAME,
						permissions: user.PERMISSIONS
					};
					const tokens = generateTokenPair(tokenPayload);

					// Return user data with JWT tokens
					return res.json({
						success: true,
						data: {
							user_id: user.IDNo,
							username: user.USERNAME,
							firstname: user.FIRSTNAME,
							lastname: user.LASTNAME,
							permissions: user.PERMISSIONS,
							role: userRole, // Include role name from user_role table
							table_id: user.TABLE_ID || null,
							branches: branches
						},
						tokens: {
							accessToken: tokens.accessToken,
							refreshToken: tokens.refreshToken,
							expiresIn: tokens.expiresIn
						}
					});
				} else {
					// Log failed password
					console.log(`[${timestamp}] [LOGIN FAILED] ${username}`);
					return res.status(401).json({
						success: false,
						error: 'Incorrect password'
					});
				}
			} else {
				// Log user not found
				console.log(`[${timestamp}] [LOGIN FAILED] ${username}`);
				return res.status(401).json({
					success: false,
					error: 'User not found or inactive'
				});
			}
		} catch (error) {
			// Log error
			console.error(`[${timestamp}] [LOGIN ERROR] ${req.body?.username || 'N/A'}`);
			return res.status(500).json({
				success: false,
				error: 'Internal server error'
			});
		}
	}

	// Get all categories (for filter button)
	static async getCategories(req, res) {
		const timestamp = new Date().toISOString();
		const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
		const userAgent = req.headers['user-agent'] || 'Unknown';
		const targetLanguage = req.query.lang || req.query.language || 'en'; // Default to English

		try {
			// Log request
			console.log(`[${timestamp}] [API REQUEST] GET /api/categories - IP: ${clientIp}, Language: ${targetLanguage}, User-Agent: ${userAgent}`);

			const categories = await CategoryModel.getAll();
			
			// Format response for Android app
			let formattedCategories = categories.map(cat => ({
				id: cat.IDNo,
				name: cat.CAT_NAME,
				description: cat.CAT_DESC || null
			}));

			// Apply translation - Descriptions ALWAYS translate, Category names translate to target language
			const translationAvailable = TranslationService.isAvailable();
			console.log(`[${timestamp}] [TRANSLATION] Categories translation available=${translationAvailable}, lang=${targetLanguage}`);
			if (translationAvailable) {
				// First, translate descriptions (always, regardless of target language)
				try {
					const descTextsToTranslate = [];
					const descTextMapping = [];
					
					formattedCategories.forEach(cat => {
						if (cat.description) {
							descTextsToTranslate.push(cat.description);
							descTextMapping.push({ cat: cat });
						}
					});
					
					if (descTextsToTranslate.length > 0) {
						const descTranslations = await TranslationService.translateBatch(descTextsToTranslate, targetLanguage);
						descTranslations.forEach((translation, index) => {
							if (descTextMapping[index]) {
								descTextMapping[index].cat.description = translation || descTextMapping[index].cat.description;
							}
						});
						console.log(`[${timestamp}] [TRANSLATION] Category descriptions translated: ${descTranslations.length}`);
					}
				} catch (descError) {
					console.error(`[${timestamp}] [TRANSLATION ERROR] Failed to translate category descriptions:`, descError);
				}
				
				// Then, translate category names to target language
				try {
					const textsToTranslate = [];
					const textMapping = [];
					
					formattedCategories.forEach(cat => {
						if (cat.name) {
							textsToTranslate.push(cat.name);
							textMapping.push({ type: 'name', cat: cat });
						}
					});

					if (textsToTranslate.length > 0) {
						const translations = await TranslationService.translateBatch(textsToTranslate, targetLanguage);
						if (translations.length > 0) {
							console.log(`[${timestamp}] [TRANSLATION] Category name sample "${textsToTranslate[0]}" -> "${translations[0]}"`);
						}
						translations.forEach((translation, index) => {
							const mapping = textMapping[index];
							if (mapping && mapping.type === 'name') {
								mapping.cat.name = translation || mapping.cat.name;
							}
						});
					}
				} catch (nameError) {
					console.error(`[${timestamp}] [TRANSLATION ERROR] Failed to translate category names:`, nameError);
				}
			}

			// Log success
			console.log(`[${timestamp}] [API SUCCESS] GET /api/categories - IP: ${clientIp}, Categories returned: ${formattedCategories.length}, Language: ${targetLanguage}`);

			res.json({
				success: true,
				data: formattedCategories
			});
		} catch (error) {
			// Log error
			console.error(`[${timestamp}] [API ERROR] GET /api/categories - IP: ${clientIp}, Error:`, error);
			res.status(500).json({ 
				success: false,
				error: 'Failed to fetch categories' 
			});
		}
	}

	// Get all restaurant tables
	static async getTables(req, res) {
		const timestamp = new Date().toISOString();
		const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
		const userAgent = req.headers['user-agent'] || 'Unknown';
		const user_id = req.user?.user_id;

		try {
			console.log(`[${timestamp}] [API REQUEST] GET /api/tables - IP: ${clientIp}, User ID: ${user_id}, User-Agent: ${userAgent}`);

			let resolvedBranchId = req.query.branch_id || req.user?.branch_id || null;
			if (!resolvedBranchId && user_id) {
				const UserBranchModel = require('../models/userBranchModel');
				const branches = await UserBranchModel.getBranchesByUserId(user_id);
				if (branches.length > 0) {
					resolvedBranchId = branches[0].IDNo;
				}
			}

			const tables = await TableModel.getAll(resolvedBranchId);
			const formattedTables = tables.map(table => ({
				id: table.IDNo,
				table_number: table.TABLE_NUMBER,
				capacity: table.CAPACITY,
				status: table.STATUS,
				branch_id: table.BRANCH_ID ?? null
			}));

			console.log(`[${timestamp}] [API SUCCESS] GET /api/tables - User ID: ${user_id}, Tables returned: ${formattedTables.length} - IP: ${clientIp}`);

			return res.json({
				success: true,
				data: formattedTables
			});
		} catch (error) {
			console.error(`[${timestamp}] [API ERROR] GET /api/tables - User ID: ${user_id}, IP: ${clientIp}, Error:`, error);
			return res.status(500).json({
				success: false,
				error: 'Failed to fetch tables',
				message: error.message
			});
		}
	}

	// Get menu items (with optional category filter)
	static async getMenuItems(req, res) {
		const timestamp = new Date().toISOString();
		const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
		const userAgent = req.headers['user-agent'] || 'Unknown';
		const categoryId = req.query.category_id || null;
		const targetLanguage = req.query.lang || req.query.language || 'en'; // Default to English

		try {
			// Log request
			console.log(`[${timestamp}] [API REQUEST] GET /api/menu - IP: ${clientIp}, Category ID: ${categoryId || 'All'}, Language: ${targetLanguage}, User-Agent: ${userAgent}`);

			// Get branch_id from query or user context
			const branchId = req.query.branch_id || req.user?.branch_id || null;
			const menus = await MenuModel.getByCategory(categoryId, branchId);
			
			// Format response for Android app
			// Include full image URL - use HTTPS if available
			let baseUrl = req.protocol + '://' + req.get('host');
			// Force HTTPS if the request came through HTTPS or if hostname suggests HTTPS
			if (req.get('x-forwarded-proto') === 'https' || req.get('host').includes('resto-admin.3core21.com')) {
				baseUrl = 'https://' + req.get('host');
			}
			let formattedMenus = menus.map(menu => ({
				id: menu.IDNo,
				category_id: menu.CATEGORY_ID,
				category_name: menu.CATEGORY_NAME || null,
				name: menu.MENU_NAME,
				description: menu.MENU_DESCRIPTION || null,
				image: menu.MENU_IMG ? baseUrl + menu.MENU_IMG : null,
				price: parseFloat(menu.MENU_PRICE || 0),
				is_available: menu.IS_AVAILABLE === 1
			}));

			// Apply translation - Descriptions ALWAYS translate, Menu/Category names only if not Korean
			if (TranslationService.isAvailable()) {
				console.log(`[${timestamp}] [TRANSLATION] Starting translation for ${formattedMenus.length} menus to ${targetLanguage}`);
				
				// First, translate descriptions (always, regardless of target language)
				try {
					const descTextsToTranslate = [];
					const descTextMapping = [];
					
					formattedMenus.forEach(menu => {
						if (menu.description) {
							descTextsToTranslate.push(menu.description);
							descTextMapping.push({ menu: menu });
						}
					});
					
					if (descTextsToTranslate.length > 0) {
						console.log(`[${timestamp}] [TRANSLATION] Translating ${descTextsToTranslate.length} descriptions...`);
						const descTranslations = await TranslationService.translateBatch(descTextsToTranslate, targetLanguage);
						descTranslations.forEach((translation, index) => {
							if (descTextMapping[index]) {
								descTextMapping[index].menu.description = translation || descTextMapping[index].menu.description;
							}
						});
						console.log(`[${timestamp}] [TRANSLATION] Descriptions translated successfully`);
					}
				} catch (descError) {
					console.error(`[${timestamp}] [TRANSLATION ERROR] Failed to translate descriptions:`, descError);
				}
				
				// Then, translate menu names and category names
				// If Korean is selected: translate English text to Korean, keep Korean text as is
				// If other language is selected: translate to that language
				try {
					const textsToTranslate = [];
					const textMapping = [];
					
					formattedMenus.forEach(menu => {
						// Menu names: always translate (auto-detect will handle Korean vs English)
						if (menu.name) {
							textsToTranslate.push(menu.name);
							textMapping.push({ type: 'name', menu: menu });
						}
						// Category names: always translate (auto-detect will handle Korean vs English)
						if (menu.category_name) {
							textsToTranslate.push(menu.category_name);
							textMapping.push({ type: 'category', menu: menu });
						}
					});

					if (textsToTranslate.length > 0) {
						console.log(`[${timestamp}] [TRANSLATION] Translating ${textsToTranslate.length} menu/category names to ${targetLanguage}...`);
						// Translate in batch - auto-detect source language (handles both Korean and English)
						// This will translate English to Korean when Korean is selected
						// And translate Korean to other languages when other languages are selected
						const translations = await TranslationService.translateBatch(textsToTranslate, targetLanguage);
						console.log(`[${timestamp}] [TRANSLATION] Received ${translations.length} translations`);
						
						translations.forEach((translation, index) => {
							const mapping = textMapping[index];
							if (mapping) {
								if (mapping.type === 'name') {
									mapping.menu.name = translation || mapping.menu.name;
								} else if (mapping.type === 'category') {
									mapping.menu.category_name = translation || mapping.menu.category_name;
								}
							}
						});
						console.log(`[${timestamp}] [TRANSLATION] Menu/Category names translated successfully`);
					}
				} catch (nameError) {
					console.error(`[${timestamp}] [TRANSLATION ERROR] Failed to translate menu/category names:`, nameError);
				}
			} else {
				console.log(`[${timestamp}] [TRANSLATION] Translation service not available. isAvailable(): ${TranslationService.isAvailable()}`);
			}

			// Log success with details
			const availableCount = formattedMenus.filter(m => m.is_available).length;
			console.log(`[${timestamp}] [API SUCCESS] GET /api/menu - IP: ${clientIp}, Category ID: ${categoryId || 'All'}, Total items: ${formattedMenus.length}, Available: ${availableCount}, Language: ${targetLanguage}`);

			res.json({
				success: true,
				data: formattedMenus,
				count: formattedMenus.length
			});
		} catch (error) {
			// Log error
			console.error(`[${timestamp}] [API ERROR] GET /api/menu - IP: ${clientIp}, Category ID: ${categoryId || 'All'}, Error:`, error);
			res.status(500).json({ 
				success: false,
				error: 'Failed to fetch menu items' 
			});
		}
	}

	// Refresh token endpoint
	static async refreshToken(req, res) {
		const timestamp = new Date().toISOString();
		const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';

		try {
			const { refreshToken } = req.body;

			if (!refreshToken) {
				console.log(`[${timestamp}] [REFRESH FAILED] No refresh token provided - IP: ${clientIp}`);
				return res.status(400).json({
					success: false,
					error: 'Refresh token is required'
				});
			}

			// Verify refresh token
			const decoded = verifyRefreshToken(refreshToken);

			// Get user info from database to ensure user is still active
			const query = 'SELECT * FROM user_info WHERE IDNo = ? AND ACTIVE = 1';
			const [results] = await pool.execute(query, [decoded.user_id]);

			if (results.length === 0) {
				console.log(`[${timestamp}] [REFRESH FAILED] User not found or inactive - User ID: ${decoded.user_id}, IP: ${clientIp}`);
				return res.status(401).json({
					success: false,
					error: 'User not found or inactive'
				});
			}

			const user = results[0];

			// Generate new token pair
			const tokenPayload = {
				user_id: user.IDNo,
				username: user.USERNAME,
				permissions: user.PERMISSIONS
			};
			const tokens = generateTokenPair(tokenPayload);

			// Log successful refresh
			console.log(`[${timestamp}] [REFRESH SUCCESS] User: ${user.USERNAME} (ID: ${user.IDNo}), IP: ${clientIp}`);

			return res.json({
				success: true,
				tokens: {
					accessToken: tokens.accessToken,
					refreshToken: tokens.refreshToken,
					expiresIn: tokens.expiresIn
				}
			});
		} catch (error) {
			// Log error
			console.error(`[${timestamp}] [REFRESH ERROR] IP: ${clientIp}, Error:`, error);
			
			if (error.message === 'Refresh token expired') {
				return res.status(401).json({
					success: false,
					error: 'Refresh token expired',
					code: 'REFRESH_TOKEN_EXPIRED'
				});
			} else if (error.message === 'Invalid refresh token') {
				return res.status(401).json({
					success: false,
					error: 'Invalid refresh token',
					code: 'INVALID_REFRESH_TOKEN'
				});
			} else {
				return res.status(500).json({
					success: false,
					error: 'Internal server error'
				});
			}
		}
	}

	// Get user orders (for syncing with local storage)
	static async getUserOrders(req, res) {
		const timestamp = new Date().toISOString();
		const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
		const userAgent = req.headers['user-agent'] || 'Unknown';
		const user_id = req.user?.user_id;
		const table_id = req.query.table_id ? parseInt(req.query.table_id) : null;

		try {
			// Log request
			console.log(`[${timestamp}] [API REQUEST] GET /api/orders - IP: ${clientIp}, User ID: ${user_id}, Table ID: ${table_id || 'N/A'}, User-Agent: ${userAgent}`);

			if (!user_id) {
				return res.status(400).json({
					success: false,
					error: 'User ID is required'
				});
			}

			// Get branch_id from query or user context
			const branchId = req.query.branch_id || req.user?.branch_id || null;

			// Get orders by user ID or table ID (prioritize table_id if provided)
			// This allows syncing orders after login/restart based on table assignment
			const orders = await OrderModel.getByUserIdOrTableId(user_id, table_id, branchId);

			// Get order items for each order
			const ordersWithItems = await Promise.all(
				orders.map(async (order) => {
					const items = await OrderItemsModel.getByOrderId(order.IDNo);
					return {
						order_id: order.IDNo,
						order_no: order.ORDER_NO,
						table_id: order.TABLE_ID,
						order_type: order.ORDER_TYPE,
						status: order.STATUS,
						subtotal: parseFloat(order.SUBTOTAL || 0),
						tax_amount: parseFloat(order.TAX_AMOUNT || 0),
						service_charge: parseFloat(order.SERVICE_CHARGE || 0),
						discount_amount: parseFloat(order.DISCOUNT_AMOUNT || 0),
						grand_total: parseFloat(order.GRAND_TOTAL || 0),
						encoded_dt: order.ENCODED_DT,
						items: items.map(item => ({
							menu_id: item.MENU_ID,
							menu_name: item.MENU_NAME,
							qty: parseFloat(item.QTY || 0),
							unit_price: parseFloat(item.UNIT_PRICE || 0),
							line_total: parseFloat(item.LINE_TOTAL || 0),
							status: item.STATUS
						}))
					};
				})
			);

			// Log success
			console.log(`[${timestamp}] [API SUCCESS] GET /api/orders - User ID: ${user_id}, Table ID: ${table_id || 'N/A'}, Orders returned: ${ordersWithItems.length} - IP: ${clientIp}`);

			return res.json({
				success: true,
				data: ordersWithItems
			});
		} catch (error) {
			// Log error
			console.error(`[${timestamp}] [API ERROR] GET /api/orders - User ID: ${user_id}, IP: ${clientIp}, Error:`, error);
			return res.status(500).json({
				success: false,
				error: 'Failed to fetch orders',
				message: error.message
			});
		}
	}

	// Get kitchen orders - all PENDING (3) and CONFIRMED (2) orders
	static async getKitchenOrders(req, res) {
		const timestamp = new Date().toISOString();
		const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
		const userAgent = req.headers['user-agent'] || 'Unknown';
		const user_id = req.user?.user_id;

		try {
			// Log request
			console.log(`[${timestamp}] [API REQUEST] GET /api/kitchen/orders - IP: ${clientIp}, User ID: ${user_id}, User-Agent: ${userAgent}`);

			if (!user_id) {
				return res.status(400).json({
					success: false,
					error: 'User ID is required'
				});
			}

			// Get branch_id from query or user context
			const branchId = req.query.branch_id || req.user?.branch_id || null;

			// Get all PENDING (3) and CONFIRMED (2) orders for kitchen
			const orders = await OrderModel.getKitchenOrders(branchId);

			// Get order items for each order and calculate overall status from items
			const ordersWithItems = await Promise.all(
				orders.map(async (order) => {
					const items = await OrderItemsModel.getByOrderId(order.IDNo);
					
					// Calculate overall order status from order_items
					// Priority: If any item is PENDING (3), show PENDING
					// If all items are READY (1), show READY
					// Otherwise, show PREPARING (2)
					let overallStatus = 1; // Default to READY
					const hasPending = items.some(item => item.STATUS === 3);
					const hasPreparing = items.some(item => item.STATUS === 2);
					const allReady = items.every(item => item.STATUS === 1);
					
					if (hasPending) {
						overallStatus = 3; // PENDING
					} else if (hasPreparing) {
						overallStatus = 2; // PREPARING
					} else if (allReady) {
						overallStatus = 1; // READY
					}
					
					return {
						order_id: order.IDNo,
						order_no: order.ORDER_NO,
						table_id: order.TABLE_ID,
						table_number: order.TABLE_NUMBER || null,
						order_type: order.ORDER_TYPE,
						status: overallStatus, // Status calculated from order_items
						subtotal: parseFloat(order.SUBTOTAL || 0),
						tax_amount: parseFloat(order.TAX_AMOUNT || 0),
						service_charge: parseFloat(order.SERVICE_CHARGE || 0),
						discount_amount: parseFloat(order.DISCOUNT_AMOUNT || 0),
						grand_total: parseFloat(order.GRAND_TOTAL || 0),
						encoded_dt: order.ENCODED_DT,
						items: items.map(item => ({
							item_id: item.IDNo,
							menu_id: item.MENU_ID,
							menu_name: item.MENU_NAME,
							qty: parseFloat(item.QTY || 0),
							unit_price: parseFloat(item.UNIT_PRICE || 0),
							line_total: parseFloat(item.LINE_TOTAL || 0),
							status: item.STATUS
						}))
					};
				})
			);

			// Log success
			console.log(`[${timestamp}] [API SUCCESS] GET /api/kitchen/orders - User ID: ${user_id}, Orders returned: ${ordersWithItems.length} - IP: ${clientIp}`);

			return res.json({
				success: true,
				data: ordersWithItems
			});
		} catch (error) {
			// Log error
			console.error(`[${timestamp}] [API ERROR] GET /api/kitchen/orders - User ID: ${user_id}, IP: ${clientIp}, Error:`, error);
			return res.status(500).json({
				success: false,
				error: 'Failed to fetch kitchen orders',
				message: error.message
			});
		}
	}

	// Update order status (Kitchen actions) - updates all order_items status
	static async updateKitchenOrderStatus(req, res) {
		const timestamp = new Date().toISOString();
		const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
		const userAgent = req.headers['user-agent'] || 'Unknown';
		const user_id = req.user?.user_id;
		const { order_id } = req.params;
		const { status } = req.body || {};

		const allowedStatuses = [3, 2, 1]; // Pending (3), Preparing (2), Ready (1)

		try {
			console.log(`[${timestamp}] [API REQUEST] POST /api/kitchen/orders/${order_id}/status - IP: ${clientIp}, User ID: ${user_id}, Status: ${status}, User-Agent: ${userAgent}`);

			if (!user_id) {
				return res.status(400).json({
					success: false,
					error: 'User ID is required'
				});
			}

			const targetStatus = parseInt(status, 10);
			if (isNaN(targetStatus) || !allowedStatuses.includes(targetStatus)) {
				return res.status(400).json({
					success: false,
					error: 'Invalid status. Allowed: 3 (Pending), 2 (Preparing), 1 (Ready)'
				});
			}

			if (!order_id) {
				return res.status(400).json({
					success: false,
					error: 'Order ID is required'
				});
			}

			// Get the order first to check existence and branch
			const order = await OrderModel.getById(order_id);
			if (!order) {
				console.log(`[${timestamp}] [API ERROR] Order ${order_id} not found in database`);
				return res.status(404).json({
					success: false,
					error: `Order #${order_id} not found`
				});
			}

			// Branching check
			const resolvedBranchId = req.query.branch_id || req.user?.branch_id || null;
			if (resolvedBranchId && order.BRANCH_ID && parseInt(order.BRANCH_ID) !== parseInt(resolvedBranchId)) {
				console.log(`[${timestamp}] [API ERROR] Branch mismatch for order ${order_id}. Order branch: ${order.BRANCH_ID}, User branch: ${resolvedBranchId}`);
				return res.status(403).json({
					success: false,
					error: 'Order is not in your branch'
				});
			}

			// Get all order items for this order
			const items = await OrderItemsModel.getByOrderId(order_id);
			
			if (items.length === 0) {
				console.log(`[${timestamp}] [API ERROR] No items found for order ${order_id}`);
				return res.status(404).json({
					success: false,
					error: 'Order has no items to update'
				});
			}

			// Update status for all order items
			await Promise.all(
				items.map(item => 
					OrderItemsModel.updateStatus(item.IDNo, targetStatus, user_id)
				)
			);

			// ALSO update the main orders table status
			// Only update if it's not READY (1), because 1 in orders table means SETTLED
			if (targetStatus !== 1) {
				await OrderModel.updateStatus(order_id, targetStatus, user_id);
			}

			// Emit socket update
			socketService.emitOrderUpdate(order_id, {
				order_id: parseInt(order_id, 10),
				order_no: order.ORDER_NO,
				table_id: order.TABLE_ID,
				order_type: order.ORDER_TYPE,
				// Use targetStatus for socket, but if it's 1 (READY for kitchen), 
				// we should probably send the current order status (likely 2=CONFIRMED) 
				// to avoid triggering "Settled" logic on frontend
				status: targetStatus === 1 ? (order.STATUS || 2) : targetStatus,
				grand_total: parseFloat(order.GRAND_TOTAL || 0),
				items: items.map(item => ({ ...item, STATUS: targetStatus }))
			});

			console.log(`[${timestamp}] [API SUCCESS] POST /api/kitchen/orders/${order_id}/status - User ID: ${user_id}, New Status: ${targetStatus}, Items Updated: ${items.length}, IP: ${clientIp}`);

			return res.json({
				success: true,
				data: {
					order_id: parseInt(order_id, 10),
					status: targetStatus,
					items_updated: items.length
				}
			});
		} catch (error) {
			console.error(`[${timestamp}] [API ERROR] POST /api/kitchen/orders/${order_id}/status - User ID: ${user_id}, IP: ${clientIp}, Error:`, error);
			return res.status(500).json({
				success: false,
				error: 'Failed to update order status',
				message: error.message
			});
		}
	}

	// Get waiter orders - use orders table status (PENDING=3, CONFIRMED=2)
	static async getWaiterOrders(req, res) {
		const timestamp = new Date().toISOString();
		const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
		const userAgent = req.headers['user-agent'] || 'Unknown';
		const user_id = req.user?.user_id;

		try {
			console.log(`[${timestamp}] [API REQUEST] GET /api/waiter/orders - IP: ${clientIp}, User ID: ${user_id}, User-Agent: ${userAgent}`);

			let resolvedBranchId = req.query.branch_id || req.user?.branch_id || null;
			if (!resolvedBranchId && user_id) {
				const UserBranchModel = require('../models/userBranchModel');
				const branches = await UserBranchModel.getBranchesByUserId(user_id);
				if (branches.length > 0) {
					resolvedBranchId = branches[0].IDNo;
				}
			}
			const orders = await OrderModel.getAll(resolvedBranchId);
			const activeOrders = orders.filter(order => [3, 2, 1].includes(order.STATUS));

			const ordersWithItems = await Promise.all(
				activeOrders.map(async (order) => {
					const items = await OrderItemsModel.getByOrderId(order.IDNo);
					return {
						order_id: order.IDNo,
						order_no: order.ORDER_NO,
						payment_method: order.payment_method || null,
						table_id: order.TABLE_ID,
						table_number: order.TABLE_NUMBER || null,
						order_type: order.ORDER_TYPE,
						status: order.STATUS,
						subtotal: parseFloat(order.SUBTOTAL || 0),
						tax_amount: parseFloat(order.TAX_AMOUNT || 0),
						service_charge: parseFloat(order.SERVICE_CHARGE || 0),
						discount_amount: parseFloat(order.DISCOUNT_AMOUNT || 0),
						grand_total: parseFloat(order.GRAND_TOTAL || 0),
						encoded_dt: order.ENCODED_DT,
						items: items.map(item => ({
							item_id: item.IDNo,
							menu_id: item.MENU_ID,
							menu_name: item.MENU_NAME,
							qty: parseFloat(item.QTY || 0),
							unit_price: parseFloat(item.UNIT_PRICE || 0),
							line_total: parseFloat(item.LINE_TOTAL || 0),
							status: item.STATUS
						}))
					};
				})
			);

			console.log(`[${timestamp}] [API SUCCESS] GET /api/waiter/orders - User ID: ${user_id}, Orders returned: ${ordersWithItems.length} - IP: ${clientIp}`);

			return res.json({
				success: true,
				data: ordersWithItems
			});
		} catch (error) {
			console.error(`[${timestamp}] [API ERROR] GET /api/waiter/orders - User ID: ${user_id}, IP: ${clientIp}, Error:`, error);
			return res.status(500).json({
				success: false,
				error: 'Failed to fetch waiter orders',
				message: error.message
			});
		}
	}

	// Update waiter order status (orders table only)
	static async updateWaiterOrderStatus(req, res) {
		const timestamp = new Date().toISOString();
		const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
		const userAgent = req.headers['user-agent'] || 'Unknown';
		const user_id = req.user?.user_id;
		const { order_id } = req.params;
		const { status, payment_method } = req.body || {};

		const allowedStatuses = [3, 2, 1]; // Pending (3), Confirmed (2), Settled (1)

		try {
			console.log(`[${timestamp}] [API REQUEST] PATCH /api/waiter/orders/${order_id}/status - IP: ${clientIp}, User ID: ${user_id}, Status: ${status}, Payment Method: ${payment_method || 'N/A'}, User-Agent: ${userAgent}`);

			if (!user_id) {
				return res.status(400).json({
					success: false,
					error: 'User ID is required'
				});
			}

			const targetStatus = parseInt(status, 10);
			if (!allowedStatuses.includes(targetStatus)) {
				return res.status(400).json({
					success: false,
					error: 'Invalid status. Allowed: 3 (Pending), 2 (Confirmed), 1 (Settled)'
				});
			}

			if (!order_id) {
				return res.status(400).json({
					success: false,
					error: 'Order ID is required'
				});
			}

			const order = await OrderModel.getById(order_id);
			if (!order) {
				return res.status(404).json({
					success: false,
					error: 'Order not found'
				});
			}
			const resolvedBranchId = req.query.branch_id || req.user?.branch_id || null;
			if (resolvedBranchId && order.BRANCH_ID && parseInt(order.BRANCH_ID) !== parseInt(resolvedBranchId)) {
				return res.status(403).json({
					success: false,
					error: 'Order is not in your branch'
				});
			}

			await OrderModel.updateStatus(order_id, targetStatus, user_id);

			const paymentMethod = payment_method || 'CASH';

			// If status is 1 (Settled), free up the table and create billing
			if (targetStatus === 1) {
				const TableModel = require('../models/tableModel');
				const BillingModel = require('../models/billingModel');
				
				// 1. Free up the table (Status 1 = Available) if it's a table order
				if (order.TABLE_ID) {
					await TableModel.updateStatus(order.TABLE_ID, 1);
				}
				
				// 2. Create or Update Billing record
				const existingBilling = await BillingModel.getByOrderId(order_id);
				if (existingBilling) {
					await BillingModel.updateForOrder(order_id, {
						status: 1, // PAID
						amount_paid: order.GRAND_TOTAL,
						payment_method: paymentMethod
					});
				} else {
					await BillingModel.createForOrder({
						branch_id: order.BRANCH_ID,
						order_id: order_id,
						payment_method: paymentMethod,
						amount_due: order.GRAND_TOTAL,
						amount_paid: order.GRAND_TOTAL,
						status: 1, // PAID
						user_id: user_id
					});
				}

				// 3. Record transaction history (Wrapped in try-catch in case table doesn't exist)
				try {
					await BillingModel.recordTransaction({
						order_id: order_id,
						payment_method: paymentMethod,
						amount_paid: order.GRAND_TOTAL,
						payment_ref: 'Settled via Cashier App',
						user_id: user_id
					});
				} catch (e) {
					console.error(`[${timestamp}] [TRANSACTION ERROR] Could not record to payment_transactions table: ${e.message}`);
				}

				// 4. Sync order to sales_hourly_summary, sales_category_report, and product_sales_summary for dashboard charts
				try {
					const ReportsModel = require('../models/reportsModel');
					await ReportsModel.syncOrderToSalesHourlySummary(order_id);
					await ReportsModel.syncOrderToSalesCategoryReport(order_id);
					await ReportsModel.syncOrderToProductSalesSummary(order_id);
				} catch (syncError) {
					console.error(`[${timestamp}] [SYNC ERROR] Could not sync order to reports tables: ${syncError.message}`);
					// Don't fail the request if sync fails
				}
			}

			// Emit socket update
			const orderItems = await OrderItemsModel.getByOrderId(order_id);
			socketService.emitOrderUpdate(order_id, {
				order_id: parseInt(order_id, 10),
				order_no: order.ORDER_NO,
				payment_method: targetStatus === 1 ? paymentMethod : null,
				table_id: order.TABLE_ID,
				order_type: order.ORDER_TYPE,
				status: targetStatus,
				grand_total: parseFloat(order.GRAND_TOTAL || 0),
				items: orderItems
			});

			console.log(`[${timestamp}] [API SUCCESS] PATCH /api/waiter/orders/${order_id}/status - User ID: ${user_id}, New Status: ${targetStatus}, IP: ${clientIp}`);

			return res.json({
				success: true,
				data: {
					order_id: parseInt(order_id, 10),
					status: targetStatus
				}
			});
		} catch (error) {
			console.error(`[${timestamp}] [API ERROR] PATCH /api/waiter/orders/${order_id}/status - User ID: ${user_id}, IP: ${clientIp}, Error:`, error);
			return res.status(500).json({
				success: false,
				error: 'Failed to update order status',
				message: error.message
			});
		}
	}

	// Create order endpoint for mobile app
	static async createOrder(req, res) {
		const timestamp = new Date().toISOString();
		const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
		const userAgent = req.headers['user-agent'] || 'Unknown';
		const user_id = req.user?.user_id;

		try {
			// Log request
			console.log(`[${timestamp}] [API REQUEST] POST /api/orders - IP: ${clientIp}, User ID: ${user_id}, User-Agent: ${userAgent}`);

			// Validate required fields
			const {
				branch_id,
				order_no,
				table_id,
				order_type,
				subtotal,
				tax_amount,
				service_charge,
				discount_amount,
				grand_total,
				items
			} = req.body;

			// Validate order number
			if (!order_no || order_no.trim() === '') {
				console.log(`[${timestamp}] [API ERROR] POST /api/orders - Missing order_no - IP: ${clientIp}`);
				return res.status(400).json({
					success: false,
					error: 'Order number is required'
				});
			}

			// Validate items
			if (!items || !Array.isArray(items) || items.length === 0) {
				console.log(`[${timestamp}] [API ERROR] POST /api/orders - No items provided - IP: ${clientIp}`);
				return res.status(400).json({
					success: false,
					error: 'At least one order item is required'
				});
			}

			// Validate item structure
			for (const item of items) {
				if (!item.menu_id || !item.qty || !item.unit_price) {
					console.log(`[${timestamp}] [API ERROR] POST /api/orders - Invalid item structure - IP: ${clientIp}`);
					return res.status(400).json({
						success: false,
						error: 'Each item must have menu_id, qty, and unit_price'
					});
				}
			}

			// Resolve branch_id (prefer body, then table, then user branch)
			let resolvedBranchId = branch_id ? parseInt(branch_id) : null;
			if (!resolvedBranchId && table_id) {
				const table = await TableModel.getById(table_id);
				if (table?.BRANCH_ID) {
					resolvedBranchId = parseInt(table.BRANCH_ID);
				}
			}
			if (!resolvedBranchId && user_id) {
				const UserBranchModel = require('../models/userBranchModel');
				const branches = await UserBranchModel.getBranchesByUserId(user_id);
				if (branches.length > 0) {
					resolvedBranchId = parseInt(branches[0].IDNo);
				}
			}
			if (!resolvedBranchId) {
				console.log(`[${timestamp}] [API ERROR] POST /api/orders - Missing branch_id - IP: ${clientIp}`);
				return res.status(400).json({
					success: false,
					error: 'Branch ID is required'
				});
			}

			// Prepare order data
			// Status codes: 3=PENDING, 2=CONFIRMED, 1=SETTLED, -1=CANCELLED
			const orderData = {
				BRANCH_ID: resolvedBranchId,
				ORDER_NO: order_no.trim(),
				TABLE_ID: table_id || null,
				ORDER_TYPE: order_type || null,
				STATUS: 3, // Default status: PENDING (3)
				SUBTOTAL: parseFloat(subtotal) || 0,
				TAX_AMOUNT: parseFloat(tax_amount) || 0,
				SERVICE_CHARGE: parseFloat(service_charge) || 0,
				DISCOUNT_AMOUNT: parseFloat(discount_amount) || 0,
				GRAND_TOTAL: parseFloat(grand_total) || 0,
				user_id: user_id
			};

			// Log order creation details
			// Status codes: 3=PENDING, 2=CONFIRMED, 1=SETTLED, -1=CANCELLED
			console.log(`[${timestamp}] [CREATE ORDER] Starting order creation - User ID: ${user_id}, IP: ${clientIp}`);
			console.log(`[${timestamp}] [CREATE ORDER] Order Details: Order No: ${orderData.ORDER_NO}, Table ID: ${orderData.TABLE_ID || 'N/A'}, Order Type: ${orderData.ORDER_TYPE || 'N/A'}, Status: PENDING (3)`);
			console.log(`[${timestamp}] [CREATE ORDER] Order Totals: Subtotal: ${orderData.SUBTOTAL}, Tax: ${orderData.TAX_AMOUNT}, Service Charge: ${orderData.SERVICE_CHARGE}, Discount: ${orderData.DISCOUNT_AMOUNT}, Grand Total: ${orderData.GRAND_TOTAL}`);
			console.log(`[${timestamp}] [CREATE ORDER] Items Count: ${items.length}`);
			
			// Log each item detail
			items.forEach((item, index) => {
				console.log(`[${timestamp}] [CREATE ORDER] Item ${index + 1}: Menu ID: ${item.menu_id}, Qty: ${item.qty}, Unit Price: ${item.unit_price}, Line Total: ${parseFloat(item.qty) * parseFloat(item.unit_price)}`);
			});

			// Create order
			const orderId = await OrderModel.create(orderData);
			console.log(`[${timestamp}] [CREATE ORDER] Order created in database - Order ID: ${orderId}`);

			// Prepare order items
			// Order Item Status codes: 3=PENDING, 2=PREPARING, 1=READY
			const newOrderItems = items.map(item => ({
				menu_id: parseInt(item.menu_id),
				qty: parseFloat(item.qty),
				unit_price: parseFloat(item.unit_price),
				line_total: parseFloat(item.qty) * parseFloat(item.unit_price),
				status: item.status || 3 // Default status: PENDING (3)
			}));

			// Create order items
			await OrderItemsModel.createForOrder(orderId, newOrderItems, user_id);
			console.log(`[${timestamp}] [CREATE ORDER] Order items created - ${newOrderItems.length} items added`);

			// Create billing record
			await BillingModel.createForOrder({
				branch_id: orderData.BRANCH_ID,
				order_id: orderId,
				amount_due: orderData.GRAND_TOTAL,
				amount_paid: 0,
				status: 3, // Pending payment
				user_id: user_id
			});
			console.log(`[${timestamp}] [CREATE ORDER] Billing record created - Amount Due: ${orderData.GRAND_TOTAL}`);

			// Update table status to Occupied (2) if a table is assigned
			if (orderData.TABLE_ID) {
				await TableModel.updateStatus(orderData.TABLE_ID, 2);
				console.log(`[${timestamp}] [CREATE ORDER] Table status updated - Table ID: ${orderData.TABLE_ID}, Status: Occupied (2)`);
			}

			// Log success summary
			console.log(`[${timestamp}] [CREATE ORDER SUCCESS] Order ID: ${orderId}, Order No: ${orderData.ORDER_NO}, Items: ${items.length}, Grand Total: ${orderData.GRAND_TOTAL}, User ID: ${user_id}, IP: ${clientIp}`);

			// Get full order data with items for socket emission
			const fullOrder = await OrderModel.getById(orderId);
			const orderItems = await OrderItemsModel.getByOrderId(orderId);

			// Emit socket event for order creation
			socketService.emitOrderCreated(orderId, {
				order_id: orderId,
				order_no: orderData.ORDER_NO,
				table_id: orderData.TABLE_ID,
				status: orderData.STATUS,
				grand_total: orderData.GRAND_TOTAL,
				items: orderItems,
				items_count: items.length
			});

			// Return success response
			return res.json({
				success: true,
				data: {
					order_id: orderId,
					order_no: orderData.ORDER_NO,
					table_id: orderData.TABLE_ID,
					status: orderData.STATUS,
					grand_total: orderData.GRAND_TOTAL,
					items_count: items.length
				}
			});
		} catch (error) {
			// Log error
			console.error(`[${timestamp}] [API ERROR] POST /api/orders - IP: ${clientIp}, Error:`, error);
			return res.status(500).json({
				success: false,
				error: 'Failed to create order',
				message: error.message
			});
		}
	}

	// Add additional items to existing order
	static async addItemsToOrder(req, res) {
		const timestamp = new Date().toISOString();
		const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
		const userAgent = req.headers['user-agent'] || 'Unknown';
		const user_id = req.user?.user_id;
		const { order_id } = req.params;

		try {
			// Log request
			console.log(`[${timestamp}] [API REQUEST] POST /api/orders/${order_id}/items - IP: ${clientIp}, User ID: ${user_id}, User-Agent: ${userAgent}`);

			// Validate order_id
			if (!order_id) {
				console.log(`[${timestamp}] [API ERROR] POST /api/orders/${order_id}/items - Missing order_id - IP: ${clientIp}`);
				return res.status(400).json({
					success: false,
					error: 'Order ID is required'
				});
			}

			// Get existing order
			const existingOrder = await OrderModel.getById(order_id);
			if (!existingOrder) {
				console.log(`[${timestamp}] [ADDITIONAL ORDER ERROR] Order not found - Order ID: ${order_id}, User ID: ${user_id}, IP: ${clientIp}`);
				return res.status(404).json({
					success: false,
					error: 'Order not found'
				});
			}
			const resolvedBranchId = req.query.branch_id || req.user?.branch_id || null;
			if (resolvedBranchId && existingOrder.BRANCH_ID && parseInt(existingOrder.BRANCH_ID) !== parseInt(resolvedBranchId)) {
				return res.status(403).json({
					success: false,
					error: 'Order is not in your branch'
				});
			}

			// Log existing order details
			console.log(`[${timestamp}] [ADDITIONAL ORDER] Starting additional order - Order ID: ${order_id}, Order No: ${existingOrder.ORDER_NO}, User ID: ${user_id}, IP: ${clientIp}`);
			console.log(`[${timestamp}] [ADDITIONAL ORDER] Existing Order Details: Table ID: ${existingOrder.TABLE_ID || 'N/A'}, Order Type: ${existingOrder.ORDER_TYPE || 'N/A'}, Status: ${existingOrder.STATUS}`);
			console.log(`[${timestamp}] [ADDITIONAL ORDER] Existing Order Totals: Subtotal: ${existingOrder.SUBTOTAL}, Tax: ${existingOrder.TAX_AMOUNT || 0}, Service Charge: ${existingOrder.SERVICE_CHARGE || 0}, Discount: ${existingOrder.DISCOUNT_AMOUNT || 0}, Grand Total: ${existingOrder.GRAND_TOTAL}`);

			// Validate items
			const { items } = req.body;
			if (!items || !Array.isArray(items) || items.length === 0) {
				console.log(`[${timestamp}] [ADDITIONAL ORDER ERROR] No items provided - Order ID: ${order_id}, User ID: ${user_id}, IP: ${clientIp}`);
				return res.status(400).json({
					success: false,
					error: 'At least one order item is required'
				});
			}

			// Validate item structure
			for (const item of items) {
				if (!item.menu_id || !item.qty || !item.unit_price) {
					console.log(`[${timestamp}] [ADDITIONAL ORDER ERROR] Invalid item structure - Order ID: ${order_id}, User ID: ${user_id}, IP: ${clientIp}`);
					return res.status(400).json({
						success: false,
						error: 'Each item must have menu_id, qty, and unit_price'
					});
				}
			}

			// Get existing order items
			const existingItems = await OrderItemsModel.getByOrderId(order_id);
			console.log(`[${timestamp}] [ADDITIONAL ORDER] Existing items count: ${existingItems.length}`);

			// Calculate new item totals
			const newItemsTotal = items.reduce((sum, item) => {
				return sum + (parseFloat(item.qty) * parseFloat(item.unit_price));
			}, 0);

			// Calculate existing items total
			const existingItemsTotal = existingItems.reduce((sum, item) => {
				return sum + (parseFloat(item.LINE_TOTAL) || 0);
			}, 0);

			console.log(`[${timestamp}] [ADDITIONAL ORDER] New items total: ${newItemsTotal}, Existing items total: ${existingItemsTotal}`);
			console.log(`[${timestamp}] [ADDITIONAL ORDER] Items to add: ${items.length}`);

			// Log each new item detail
			items.forEach((item, index) => {
				console.log(`[${timestamp}] [ADDITIONAL ORDER] New Item ${index + 1}: Menu ID: ${item.menu_id}, Qty: ${item.qty}, Unit Price: ${item.unit_price}, Line Total: ${parseFloat(item.qty) * parseFloat(item.unit_price)}`);
			});

			// Prepare new order items
			// Order Item Status codes: 3=PENDING, 2=PREPARING, 1=READY
			const orderItems = items.map(item => ({
				menu_id: parseInt(item.menu_id),
				qty: parseFloat(item.qty),
				unit_price: parseFloat(item.unit_price),
				line_total: parseFloat(item.qty) * parseFloat(item.unit_price),
				status: item.status || 3 // Default status: PENDING (3)
			}));

			// Add new items to existing order
			await OrderItemsModel.createForOrder(order_id, orderItems, user_id);
			console.log(`[${timestamp}] [ADDITIONAL ORDER] Order items added to database - ${orderItems.length} items added`);

			// Calculate new totals - use actual existing items total instead of SUBTOTAL field
			// This ensures accuracy even if SUBTOTAL field was not updated correctly before
			const existingTaxAmount = Number(existingOrder.TAX_AMOUNT) || 0;
			const existingServiceCharge = Number(existingOrder.SERVICE_CHARGE) || 0;
			const existingDiscountAmount = Number(existingOrder.DISCOUNT_AMOUNT) || 0;

			// Use existingItemsTotal (calculated from actual items) instead of existingOrder.SUBTOTAL
			// This ensures we get the correct total from all existing items in the database
			const existingSubtotalNum = Number(existingItemsTotal);
			const newItemsTotalNum = Number(newItemsTotal);

			// Calculate existing grand total from existing subtotal + tax + service charge - discount
			const existingGrandTotal = Number((existingSubtotalNum + existingTaxAmount + existingServiceCharge - existingDiscountAmount).toFixed(2));

			const newSubtotal = Number((existingSubtotalNum + newItemsTotalNum).toFixed(2));
			const newTaxAmount = Number((existingTaxAmount).toFixed(2)); // Keep existing tax amount
			const newServiceCharge = Number((existingServiceCharge).toFixed(2)); // Keep existing service charge
			const newDiscountAmount = Number((existingDiscountAmount).toFixed(2)); // Keep existing discount amount
			const newGrandTotal = Number((newSubtotal + newTaxAmount + newServiceCharge - newDiscountAmount).toFixed(2));

			console.log(`[${timestamp}] [ADDITIONAL ORDER] Calculated new totals: Subtotal: ${newSubtotal} (was ${existingSubtotalNum} + ${newItemsTotalNum}), Grand Total: ${newGrandTotal} (was ${Number(existingOrder.GRAND_TOTAL) || 0})`);

			// Update order totals
			const updatePayload = {
				TABLE_ID: existingOrder.TABLE_ID,
				ORDER_TYPE: existingOrder.ORDER_TYPE,
				STATUS: existingOrder.STATUS,
				SUBTOTAL: newSubtotal,
				TAX_AMOUNT: newTaxAmount,
				SERVICE_CHARGE: newServiceCharge,
				DISCOUNT_AMOUNT: newDiscountAmount,
				GRAND_TOTAL: newGrandTotal,
				user_id: user_id
			};

			await OrderModel.update(order_id, updatePayload);
			console.log(`[${timestamp}] [ADDITIONAL ORDER] Order totals updated in database`);

			// Update billing record
			const existingBilling = await BillingModel.getByOrderId(order_id);
			if (existingBilling) {
				const existingAmountDue = parseFloat(existingBilling.AMOUNT_DUE || existingGrandTotal);
				await BillingModel.updateForOrder(order_id, {
					amount_due: newGrandTotal
				});
				console.log(`[${timestamp}] [ADDITIONAL ORDER] Billing record updated - New Amount Due: ${newGrandTotal} (was ${existingAmountDue})`);
			}

			// Log success summary
			console.log(`[${timestamp}] [ADDITIONAL ORDER SUCCESS] Order ID: ${order_id}, Order No: ${existingOrder.ORDER_NO}, Items Added: ${items.length}, Old Total: ${existingGrandTotal}, New Total: ${newGrandTotal}, User ID: ${user_id}, IP: ${clientIp}`);

			// Get updated order data with items for socket emission
			const updatedOrder = await OrderModel.getById(order_id);
			const allOrderItems = await OrderItemsModel.getByOrderId(order_id);

			// Emit socket event for items added
			socketService.emitOrderItemsAdded(order_id, {
				order_id: parseInt(order_id),
				order_no: existingOrder.ORDER_NO,
				table_id: updatedOrder.TABLE_ID,
				status: updatedOrder.STATUS,
				grand_total: newGrandTotal,
				items: allOrderItems,
				items_added: items.length
			});

			// Return success response
			return res.json({
				success: true,
				data: {
					order_id: parseInt(order_id),
					order_no: existingOrder.ORDER_NO,
					items_added: items.length,
					new_subtotal: newSubtotal,
					new_grand_total: newGrandTotal
				}
			});
		} catch (error) {
			// Log error
			console.error(`[${timestamp}] [API ERROR] POST /api/orders/${order_id}/items - IP: ${clientIp}, Error:`, error);
			return res.status(500).json({
				success: false,
				error: 'Failed to add items to order',
				message: error.message
			});
		}
	}

	// Replace items in existing order (Edit Order)
	static async replaceOrderItems(req, res) {
		const timestamp = new Date().toISOString();
		const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
		const userAgent = req.headers['user-agent'] || 'Unknown';
		const user_id = req.user?.user_id;
		const { order_id } = req.params;

		try {
			console.log(`[${timestamp}] [API REQUEST] PUT /api/orders/${order_id}/items - IP: ${clientIp}, User ID: ${user_id}, User-Agent: ${userAgent}`);

			if (!order_id) {
				return res.status(400).json({
					success: false,
					error: 'Order ID is required'
				});
			}

			const existingOrder = await OrderModel.getById(order_id);
			if (!existingOrder) {
				return res.status(404).json({
					success: false,
					error: 'Order not found'
				});
			}
			const resolvedBranchId = req.query.branch_id || req.user?.branch_id || null;
			if (resolvedBranchId && existingOrder.BRANCH_ID && parseInt(existingOrder.BRANCH_ID) !== parseInt(resolvedBranchId)) {
				return res.status(403).json({
					success: false,
					error: 'Order is not in your branch'
				});
			}

			const { items } = req.body;
			if (!items || !Array.isArray(items) || items.length === 0) {
				return res.status(400).json({
					success: false,
					error: 'At least one order item is required'
				});
			}

			for (const item of items) {
				if (!item.menu_id || !item.qty || !item.unit_price) {
					return res.status(400).json({
						success: false,
						error: 'Each item must have menu_id, qty, and unit_price'
					});
				}
			}

			const replacementItems = items.map(item => ({
				menu_id: parseInt(item.menu_id),
				qty: parseFloat(item.qty),
				unit_price: parseFloat(item.unit_price),
				line_total: parseFloat(item.qty) * parseFloat(item.unit_price),
				status: item.status || 3
			}));

			const newSubtotal = Number(
				replacementItems.reduce((sum, item) => sum + item.line_total, 0).toFixed(2)
			);
			const taxAmount = Number(existingOrder.TAX_AMOUNT) || 0;
			const serviceCharge = Number(existingOrder.SERVICE_CHARGE) || 0;
			const discountAmount = Number(existingOrder.DISCOUNT_AMOUNT) || 0;
			const newGrandTotal = Number((newSubtotal + taxAmount + serviceCharge - discountAmount).toFixed(2));

			await OrderItemsModel.replaceForOrder(order_id, replacementItems, user_id);

			await OrderModel.update(order_id, {
				TABLE_ID: existingOrder.TABLE_ID,
				ORDER_TYPE: existingOrder.ORDER_TYPE,
				STATUS: existingOrder.STATUS,
				SUBTOTAL: newSubtotal,
				TAX_AMOUNT: taxAmount,
				SERVICE_CHARGE: serviceCharge,
				DISCOUNT_AMOUNT: discountAmount,
				GRAND_TOTAL: newGrandTotal,
				user_id: user_id
			});

			const existingBilling = await BillingModel.getByOrderId(order_id);
			if (existingBilling) {
				await BillingModel.updateForOrder(order_id, {
					amount_due: newGrandTotal
				});
			}

			const updatedOrder = await OrderModel.getById(order_id);
			const updatedItems = await OrderItemsModel.getByOrderId(order_id);

			socketService.emitOrderUpdate(order_id, {
				order_id: parseInt(order_id),
				order_no: updatedOrder.ORDER_NO,
				table_id: updatedOrder.TABLE_ID,
				status: updatedOrder.STATUS,
				grand_total: newGrandTotal,
				items: updatedItems
			});

			return res.json({
				success: true,
				data: {
					order_id: parseInt(order_id),
					order_no: updatedOrder.ORDER_NO,
					items_count: replacementItems.length,
					new_grand_total: newGrandTotal
				}
			});
		} catch (error) {
			console.error(`[${timestamp}] [API ERROR] PUT /api/orders/${order_id}/items - IP: ${clientIp}, Error:`, error);
			return res.status(500).json({
				success: false,
				error: 'Failed to update order items',
				message: error.message
			});
		}
	}
}

module.exports = ApiController;

