// ============================================
// EMPLOYEE CONTROLLER
// ============================================
// File: controllers/employeeController.js
// Description: Handles employee-related business logic
// ============================================

const EmployeeModel = require('../models/employeeModel');
const BranchModel = require('../models/branchModel');
const UserBranchModel = require('../models/userBranchModel');
const pool = require('../config/db');
const argon2 = require('argon2');
const crypto = require('crypto');

class EmployeeController {
	// Display employee management page
	static async showPage(req, res) {
		const sessions = {
			username: req.session.username,
			firstname: req.session.firstname,
			lastname: req.session.lastname,
			user_id: req.session.user_id,
			currentPage: 'manageEmployee',
			permissions: req.session.permissions
		};
		
		try {
			// Get branches for dropdown (admin sees all, others see their branch)
			const perm = parseInt(req.session.permissions || 0);
			const currentBranchId = req.session.branch_id || null;
			
			let branches = [];
			if (perm === 1) {
				// Admin can see all branches
				branches = await BranchModel.getAll();
			} else if (currentBranchId) {
				// Non-admin sees only their branch
				const branch = await BranchModel.getById(currentBranchId);
				if (branch) {
					branches = [branch];
				}
			}

			// Get users for USERINFO_ID dropdown
			let users = [];
			if (perm === 1) {
				// Admin sees all users
				const [allUsers] = await pool.execute(`
					SELECT IDNo, USERNAME, FIRSTNAME, LASTNAME, CONCAT(FIRSTNAME, ' ', LASTNAME) AS FULLNAME
					FROM user_info
					WHERE ACTIVE = 1
					ORDER BY LASTNAME, FIRSTNAME ASC
				`);
				users = allUsers;
			} else if (currentBranchId) {
				// Non-admin sees users in their branch
				const [branchUsers] = await pool.execute(`
					SELECT DISTINCT u.IDNo, u.USERNAME, u.FIRSTNAME, u.LASTNAME, CONCAT(u.FIRSTNAME, ' ', u.LASTNAME) AS FULLNAME
					FROM user_info u
					INNER JOIN user_branches ub ON ub.USER_ID = u.IDNo
					WHERE u.ACTIVE = 1 AND ub.BRANCH_ID = ?
					ORDER BY u.LASTNAME, u.FIRSTNAME ASC
				`, [currentBranchId]);
				users = branchUsers;
			}

			// Get user roles for dropdown
			const [roles] = await pool.execute(`
				SELECT IDNo, ROLE
				FROM user_role
				WHERE ACTIVE = 1
				ORDER BY ROLE ASC
			`);

			// Restaurant departments
			const departments = [
				'Kitchen',
				'Service',
				'Waiter/Waitress',
				'Cashier',
				'Manager',
				'Supervisor',
				'Bartender',
				'Cleaning',
				'Security',
				'Maintenance'
			];

			sessions.branches = branches;
			sessions.users = users;
			sessions.roles = roles;
			sessions.departments = departments;
		} catch (error) {
			console.error('Error loading employee page data:', error);
			sessions.branches = [];
			sessions.users = [];
		}

		res.render("employee/manageEmployee", sessions);
	}

	// Get all employees
	static async getAll(req, res) {
		try {
			const perm = parseInt(req.session.permissions || 0);
			const branchId = perm === 1 ? (req.query.branch_id || null) : (req.session.branch_id || null);
			
			const employees = await EmployeeModel.getAll(branchId);
			res.json(employees);
		} catch (error) {
			console.error('Error fetching employees:', error);
			console.error('Error stack:', error.stack);
			console.error('Error message:', error.message);
			res.status(500).json({ 
				error: 'Failed to fetch employees',
				details: process.env.NODE_ENV === 'development' ? error.message : undefined
			});
		}
	}

	// Get employee by ID
	static async getById(req, res) {
		try {
			const { id } = req.params;
			const employee = await EmployeeModel.getById(id);
			
			if (!employee) {
				return res.status(404).json({ error: 'Employee not found' });
			}
			
			res.json(employee);
		} catch (error) {
			console.error('Error fetching employee:', error);
			res.status(500).json({ error: 'Failed to fetch employee' });
		}
	}

	// Create new employee
	static async create(req, res) {
		try {
			const { 
				PHOTO, 
				FIRSTNAME, 
				LASTNAME, 
				CONTACTNo, 
				DEPARTMENT, 
				ADDRESS, 
				DATE_STARTED, 
				SALARY,
				EMERGENCY_CONTACT_NAME,
				EMERGENCY_CONTACT_PHONE,
				CREATE_USER_ACCOUNT,
				USERNAME,
				PASSWORD,
				PASSWORD2,
				PERMISSIONS
			} = req.body;

			if ((!FIRSTNAME || FIRSTNAME.trim() === '') && (!LASTNAME || LASTNAME.trim() === '')) {
				return res.status(400).json({ error: 'First name or last name is required' });
			}

			const user_id = req.session.user_id || req.user?.user_id;
			const perm = parseInt(req.session.permissions || 0);
			
			// Get branch_id from the logged-in user (ENCODED_BY's branch)
			let finalBranchId = null;
			if (req.session.branch_id) {
				finalBranchId = req.session.branch_id;
			} else {
				// Fallback: get branch from user_branches
				const [ub] = await pool.execute(
					'SELECT BRANCH_ID FROM user_branches WHERE USER_ID = ? LIMIT 1',
					[user_id]
				);
				if (ub.length > 0) {
					finalBranchId = ub[0].BRANCH_ID;
				}
			}

			// Admin can override branch selection
			if (perm === 1 && req.body.BRANCH_ID) {
				finalBranchId = req.body.BRANCH_ID;
			}

			if (!user_id) {
				return res.status(400).json({ error: 'User ID is required' });
			}

			let createdUserId = null;

			// Create user account if requested
			if (CREATE_USER_ACCOUNT === 'true' || CREATE_USER_ACCOUNT === true) {
				if (!USERNAME || USERNAME.trim() === '') {
					return res.status(400).json({ error: 'Username is required when creating user account' });
				}
				if (!PASSWORD || PASSWORD.trim() === '') {
					return res.status(400).json({ error: 'Password is required when creating user account' });
				}
				if (PASSWORD !== PASSWORD2) {
					return res.status(400).json({ error: 'Passwords do not match' });
				}

				// Check if username already exists
				const [existingUser] = await pool.execute(
					'SELECT IDNo FROM user_info WHERE USERNAME = ? AND ACTIVE = 1',
					[USERNAME.trim()]
				);
				if (existingUser.length > 0) {
					return res.status(400).json({ error: 'Username already exists' });
				}

				// Hash password with argon2
				const hashedPassword = await argon2.hash(PASSWORD);
				// Generate salt for database (even though Argon2 includes salt in hash, DB requires it)
				const salt = crypto.randomBytes(32).toString('base64');
				const currentDate = new Date();

				// Create user account - use FIRSTNAME and LASTNAME from employee form
				const userQuery = `
					INSERT INTO user_info 
					(FIRSTNAME, LASTNAME, USERNAME, PASSWORD, SALT, PERMISSIONS, LAST_LOGIN, ENCODED_BY, ENCODED_DT) 
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
				`;

				const [userResult] = await pool.execute(userQuery, [
					FIRSTNAME.trim(), // Use employee's first name
					LASTNAME.trim(),  // Use employee's last name
					USERNAME.trim(),
					hashedPassword,
					salt,
					parseInt(PERMISSIONS) || 3, // Default to Manager if not specified
					currentDate,
					user_id,
					currentDate
				]);

				createdUserId = userResult.insertId;

				// Assign branch to user
				if (finalBranchId) {
					const roleId = parseInt(PERMISSIONS) || 3;
					if (roleId === 1) {
						// Admin: give access to all branches
						const [branches] = await pool.execute(
							'SELECT IDNo AS BRANCH_ID FROM branches WHERE ACTIVE = 1'
						);
						if (branches.length > 0) {
							const values = branches.map(b => [createdUserId, b.BRANCH_ID]);
							await pool.query(
								'INSERT IGNORE INTO user_branches (USER_ID, BRANCH_ID) VALUES ?',
								[values]
							);
						}
					} else {
						// Non-admin: assign to one branch
						await UserBranchModel.addUserToBranch(createdUserId, finalBranchId);
					}
				}
			}

			// Create employee (STATUS defaults to 1 = Active)
			const employeeId = await EmployeeModel.create({
				BRANCH_ID: finalBranchId,
				USER_INFO_ID: createdUserId,
				PHOTO: PHOTO || null,
				FIRSTNAME: FIRSTNAME || '',
				LASTNAME: LASTNAME || '',
				CONTACTNo: CONTACTNo || null,
				DEPARTMENT: DEPARTMENT || null,
				ADDRESS: ADDRESS || null,
				DATE_STARTED: DATE_STARTED || null,
				SALARY: SALARY ? SALARY.toString().replace(/,/g, '') : null,
				STATUS: 1, // Default to Active
				EMERGENCY_CONTACT_NAME: EMERGENCY_CONTACT_NAME || null,
				EMERGENCY_CONTACT_PHONE: EMERGENCY_CONTACT_PHONE || null,
				user_id
			});

			res.json({ 
				success: true, 
				message: CREATE_USER_ACCOUNT === 'true' || CREATE_USER_ACCOUNT === true 
					? 'Employee and user account created successfully'
					: 'Employee created successfully',
				id: employeeId,
				user_id: createdUserId
			});
		} catch (error) {
			console.error('Error creating employee:', error);
			res.status(500).json({ error: 'Failed to create employee: ' + error.message });
		}
	}

	// Update employee
	static async update(req, res) {
		try {
			const { id } = req.params;
			const { 
				BRANCH_ID, 
				USER_INFO_ID, 
				PHOTO, 
				FIRSTNAME, 
				LASTNAME, 
				CONTACTNo, 
				DEPARTMENT, 
				ADDRESS, 
				DATE_STARTED, 
				SALARY,
				STATUS,
				EMERGENCY_CONTACT_NAME,
				EMERGENCY_CONTACT_PHONE
			} = req.body;

			// Remove commas from salary before saving
			const cleanSalary = SALARY ? SALARY.toString().replace(/,/g, '') : null;

			if ((!FIRSTNAME || FIRSTNAME.trim() === '') && (!LASTNAME || LASTNAME.trim() === '')) {
				return res.status(400).json({ error: 'First name or last name is required' });
			}

			const user_id = req.session.user_id;
			const perm = parseInt(req.session.permissions || 0);
			
			// Non-admin can only update employees in their branch
			let finalBranchId = BRANCH_ID || null;
			if (perm !== 1 && req.session.branch_id) {
				finalBranchId = req.session.branch_id;
			}

			const updated = await EmployeeModel.update(id, {
				BRANCH_ID: finalBranchId,
				USER_INFO_ID: USER_INFO_ID || null,
				PHOTO: PHOTO || null,
				FIRSTNAME: FIRSTNAME || '',
				LASTNAME: LASTNAME || '',
				CONTACTNo: CONTACTNo || null,
				DEPARTMENT: DEPARTMENT || null,
				ADDRESS: ADDRESS || null,
				DATE_STARTED: DATE_STARTED || null,
				SALARY: cleanSalary || null,
				STATUS: STATUS || 1,
				EMERGENCY_CONTACT_NAME: EMERGENCY_CONTACT_NAME || null,
				EMERGENCY_CONTACT_PHONE: EMERGENCY_CONTACT_PHONE || null,
				user_id
			});

			if (!updated) {
				return res.status(404).json({ error: 'Employee not found' });
			}

			res.json({ success: true, message: 'Employee updated successfully' });
		} catch (error) {
			console.error('Error updating employee:', error);
			res.status(500).json({ error: 'Failed to update employee' });
		}
	}

	// Delete employee
	static async delete(req, res) {
		try {
			const { id } = req.params;
			const user_id = req.session.user_id;

			const deleted = await EmployeeModel.delete(id, user_id);

			if (!deleted) {
				return res.status(404).json({ error: 'Employee not found' });
			}

			res.json({ success: true, message: 'Employee deleted successfully' });
		} catch (error) {
			console.error('Error deleting employee:', error);
			res.status(500).json({ error: 'Failed to delete employee' });
		}
	}
}

module.exports = EmployeeController;

