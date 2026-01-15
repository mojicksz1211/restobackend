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
		const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
		const userAgent = req.headers['user-agent'] || 'Unknown';

		try {
			const { username, password } = req.body;

			// Log login attempt
			console.log(`[${timestamp}] [LOGIN ATTEMPT] Username: ${username || 'N/A'}, IP: ${clientIp}, User-Agent: ${userAgent}`);

			if (!username || !password) {
				console.log(`[${timestamp}] [LOGIN FAILED] Missing credentials - Username: ${username || 'N/A'}, IP: ${clientIp}`);
				return res.status(400).json({
					success: false,
					error: 'Username and password are required'
				});
			}

			const query = 'SELECT * FROM user_info WHERE USERNAME = ? AND ACTIVE = 1';
			const [results] = await pool.execute(query, [username]);

			if (results.length > 0) {
				const user = results[0];
				const storedPassword = user.PASSWORD;
				const salt = user.SALT;

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
					// Optional: auto-upgrade legacy MD5 password to Argon2
					if (isLegacy) {
						console.log(`[${timestamp}] [PASSWORD UPGRADE] Upgrading MD5 to Argon2 for user: ${username} (ID: ${user.IDNo})`);
						const newHash = await argon2.hash(password);
						await pool.execute(`UPDATE user_info SET PASSWORD = ?, SALT = NULL WHERE IDNo = ?`, [newHash, user.IDNo]);
					}

					// Update last login
					await pool.execute(`UPDATE user_info SET LAST_LOGIN = ? WHERE IDNo = ?`, [new Date(), user.IDNo]);

					// Log successful login
					console.log(`[${timestamp}] [LOGIN SUCCESS] User: ${username} (ID: ${user.IDNo}, Name: ${user.FIRSTNAME} ${user.LASTNAME}), IP: ${clientIp}, Permissions: ${user.PERMISSIONS}, Table ID: ${user.TABLE_ID || 'N/A'}`);

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
							table_id: user.TABLE_ID || null
						},
						tokens: {
							accessToken: tokens.accessToken,
							refreshToken: tokens.refreshToken,
							expiresIn: tokens.expiresIn
						}
					});
				} else {
					// Log failed password
					console.log(`[${timestamp}] [LOGIN FAILED] Incorrect password - Username: ${username} (ID: ${user.IDNo}), IP: ${clientIp}`);
					return res.status(401).json({
						success: false,
						error: 'Incorrect password'
					});
				}
			} else {
				// Log user not found
				console.log(`[${timestamp}] [LOGIN FAILED] User not found or inactive - Username: ${username}, IP: ${clientIp}`);
				return res.status(401).json({
					success: false,
					error: 'User not found or inactive'
				});
			}
		} catch (error) {
			// Log error
			console.error(`[${timestamp}] [LOGIN ERROR] Username: ${req.body?.username || 'N/A'}, IP: ${clientIp}, Error:`, error);
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

		try {
			// Log request
			console.log(`[${timestamp}] [API REQUEST] GET /api/categories - IP: ${clientIp}, User-Agent: ${userAgent}`);

			const categories = await CategoryModel.getAll();
			
			// Format response for Android app
			const formattedCategories = categories.map(cat => ({
				id: cat.IDNo,
				name: cat.CAT_NAME,
				description: cat.CAT_DESC || null
			}));

			// Log success
			console.log(`[${timestamp}] [API SUCCESS] GET /api/categories - IP: ${clientIp}, Categories returned: ${formattedCategories.length}`);

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

	// Get menu items (with optional category filter)
	static async getMenuItems(req, res) {
		const timestamp = new Date().toISOString();
		const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
		const userAgent = req.headers['user-agent'] || 'Unknown';
		const categoryId = req.query.category_id || null;

		try {
			// Log request
			console.log(`[${timestamp}] [API REQUEST] GET /api/menu - IP: ${clientIp}, Category ID: ${categoryId || 'All'}, User-Agent: ${userAgent}`);

			const menus = await MenuModel.getByCategory(categoryId);
			
			// Format response for Android app
			// Include full image URL - use HTTPS if available
			let baseUrl = req.protocol + '://' + req.get('host');
			// Force HTTPS if the request came through HTTPS or if hostname suggests HTTPS
			if (req.get('x-forwarded-proto') === 'https' || req.get('host').includes('resto-admin.3core21.com')) {
				baseUrl = 'https://' + req.get('host');
			}
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

			// Log success with details
			const availableCount = formattedMenus.filter(m => m.is_available).length;
			console.log(`[${timestamp}] [API SUCCESS] GET /api/menu - IP: ${clientIp}, Category ID: ${categoryId || 'All'}, Total items: ${formattedMenus.length}, Available: ${availableCount}`);

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

			// Prepare order data
			const orderData = {
				ORDER_NO: order_no.trim(),
				TABLE_ID: table_id || null,
				ORDER_TYPE: order_type || null,
				STATUS: 1, // Default status: Pending/Active
				SUBTOTAL: parseFloat(subtotal) || 0,
				TAX_AMOUNT: parseFloat(tax_amount) || 0,
				SERVICE_CHARGE: parseFloat(service_charge) || 0,
				DISCOUNT_AMOUNT: parseFloat(discount_amount) || 0,
				GRAND_TOTAL: parseFloat(grand_total) || 0,
				user_id: user_id
			};

			// Create order
			const orderId = await OrderModel.create(orderData);

			// Prepare order items
			const orderItems = items.map(item => ({
				menu_id: parseInt(item.menu_id),
				qty: parseFloat(item.qty),
				unit_price: parseFloat(item.unit_price),
				line_total: parseFloat(item.qty) * parseFloat(item.unit_price),
				status: item.status || 1
			}));

			// Create order items
			await OrderItemsModel.createForOrder(orderId, orderItems, user_id);

			// Create billing record
			await BillingModel.createForOrder({
				order_id: orderId,
				amount_due: orderData.GRAND_TOTAL,
				amount_paid: 0,
				status: 3, // Pending payment
				user_id: user_id
			});

			// Update table status to Occupied (2) if a table is assigned
			if (orderData.TABLE_ID) {
				await TableModel.updateStatus(orderData.TABLE_ID, 2);
			}

			// Log success
			console.log(`[${timestamp}] [API SUCCESS] POST /api/orders - Order created: ID ${orderId}, Order No: ${orderData.ORDER_NO}, Items: ${items.length}, Total: ${orderData.GRAND_TOTAL} - IP: ${clientIp}`);

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
}

module.exports = ApiController;

