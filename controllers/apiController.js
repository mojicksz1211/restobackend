// ============================================
// API CONTROLLER
// ============================================
// File: controllers/apiController.js
// Description: Public API endpoints for Android app
// ============================================

const MenuModel = require('../models/menuModel');
const CategoryModel = require('../models/categoryModel');
const pool = require('../config/db');
const argon2 = require('argon2');
const crypto = require('crypto');

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

					// Return user data (without password)
					return res.json({
						success: true,
						data: {
							user_id: user.IDNo,
							username: user.USERNAME,
							firstname: user.FIRSTNAME,
							lastname: user.LASTNAME,
							permissions: user.PERMISSIONS,
							table_id: user.TABLE_ID || null
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

