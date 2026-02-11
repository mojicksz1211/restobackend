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
const ApiResponse = require('../utils/apiResponse');

class EmployeeController {
	// Get employee page metadata (dropdowns, etc.)
	static async getPageMetadata(req, res) {
		try {
			const perm = parseInt(req.session?.permissions || req.user?.permissions || 0);
			const currentBranchId = req.session?.branch_id || req.user?.branch_id || null;
			
			let branches = [];
			if (perm === 1) {
				branches = await BranchModel.getAll();
			} else if (currentBranchId) {
				const branch = await BranchModel.getById(currentBranchId);
				if (branch) branches = [branch];
			}

			let users = [];
			if (perm === 1) {
				const [allUsers] = await pool.execute(`
					SELECT IDNo, USERNAME, FIRSTNAME, LASTNAME, CONCAT(FIRSTNAME, ' ', LASTNAME) AS FULLNAME
					FROM user_info WHERE ACTIVE = 1 ORDER BY LASTNAME, FIRSTNAME ASC
				`);
				users = allUsers;
			} else if (currentBranchId) {
				const [branchUsers] = await pool.execute(`
					SELECT DISTINCT u.IDNo, u.USERNAME, u.FIRSTNAME, u.LASTNAME, CONCAT(u.FIRSTNAME, ' ', u.LASTNAME) AS FULLNAME
					FROM user_info u
					INNER JOIN user_branches ub ON ub.USER_ID = u.IDNo
					WHERE u.ACTIVE = 1 AND ub.BRANCH_ID = ?
					ORDER BY u.LASTNAME, u.FIRSTNAME ASC
				`, [currentBranchId]);
				users = branchUsers;
			}

			const [roles] = await pool.execute(`
				SELECT IDNo, ROLE FROM user_role WHERE ACTIVE = 1 ORDER BY ROLE ASC
			`);

			const departments = [
				'Kitchen', 'Service', 'Waiter/Waitress', 'Cashier', 'Manager',
				'Supervisor', 'Bartender', 'Cleaning', 'Security', 'Maintenance'
			];

			return ApiResponse.success(res, {
				branches,
				users,
				roles,
				departments
			}, 'Employee page metadata retrieved successfully');
		} catch (error) {
			console.error('Error loading employee page metadata:', error);
			return ApiResponse.error(res, 'Failed to load employee page metadata', 500, error.message);
		}
	}

	// Get all employees
	static async getAll(req, res) {
		try {
			const perm = parseInt(req.session.permissions || 0);
			const branchId = perm === 1 ? (req.query.branch_id || null) : (req.session.branch_id || null);
			
			const employees = await EmployeeModel.getAll(branchId);
			return ApiResponse.success(res, employees, 'Employees retrieved successfully');
		} catch (error) {
			console.error('Error fetching employees:', error);
			return ApiResponse.error(res, 'Failed to fetch employees', 500, error.message);
		}
	}

	// Get employee by ID
	static async getById(req, res) {
		try {
			const { id } = req.params;
			const employee = await EmployeeModel.getById(id);
			if (!employee) {
				return ApiResponse.notFound(res, 'Employee');
			}
			return ApiResponse.success(res, employee, 'Employee retrieved successfully');
		} catch (error) {
			console.error('Error fetching employee:', error);
			return ApiResponse.error(res, 'Failed to fetch employee', 500, error.message);
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
				return ApiResponse.badRequest(res, 'First name or last name is required');
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
				return ApiResponse.badRequest(res, 'User ID is required');
			}

			let createdUserId = null;

			// Create user account if requested
			if (CREATE_USER_ACCOUNT === 'true' || CREATE_USER_ACCOUNT === true) {
				if (!USERNAME || USERNAME.trim() === '') {
					return ApiResponse.badRequest(res, 'Username is required when creating user account');
				}
				if (!PASSWORD || PASSWORD.trim() === '') {
					return ApiResponse.badRequest(res, 'Password is required when creating user account');
				}
				if (PASSWORD !== PASSWORD2) {
					return ApiResponse.badRequest(res, 'Passwords do not match');
				}

				// Check if username already exists
				const [existingUser] = await pool.execute(
					'SELECT IDNo FROM user_info WHERE USERNAME = ? AND ACTIVE = 1',
					[USERNAME.trim()]
				);
				if (existingUser.length > 0) {
					return ApiResponse.error(res, 'Username already exists', 409);
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
			// Note: USER_INFO_ID can be null if CREATE_USER_ACCOUNT is false
			// If the database column doesn't allow NULL, you need to run the migration:
			// scripts/migrations/2026-02-06-employee-user-info-id-nullable.sql
			const employeeId = await EmployeeModel.create({
				BRANCH_ID: finalBranchId,
				USER_INFO_ID: createdUserId || null, // Explicitly set to null if no user account created
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

			const message = CREATE_USER_ACCOUNT === 'true' || CREATE_USER_ACCOUNT === true 
				? 'Employee and user account created successfully'
				: 'Employee created successfully';
			return ApiResponse.created(res, { id: employeeId, user_id: createdUserId }, message);
		} catch (error) {
			console.error('Error creating employee:', error);
			return ApiResponse.error(res, 'Failed to create employee', 500, error.message);
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
				return ApiResponse.badRequest(res, 'First name or last name is required');
			}

			const user_id = req.session.user_id || req.user?.user_id;
			const perm = parseInt(req.session.permissions || req.user?.permissions || 0);
			
			// Non-admin can only update employees in their branch
			let finalBranchId = BRANCH_ID || null;
			const currentBranchId = req.session.branch_id || req.user?.branch_id || null;
			if (perm !== 1 && currentBranchId) {
				finalBranchId = currentBranchId;
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
				STATUS: STATUS !== undefined && STATUS !== null ? parseInt(STATUS) : 1,
				EMERGENCY_CONTACT_NAME: EMERGENCY_CONTACT_NAME || null,
				EMERGENCY_CONTACT_PHONE: EMERGENCY_CONTACT_PHONE || null,
				user_id
			});

			if (!updated) {
				return ApiResponse.notFound(res, 'Employee');
			}

			return ApiResponse.success(res, null, 'Employee updated successfully');
		} catch (error) {
			console.error('Error updating employee:', error);
			return ApiResponse.error(res, 'Failed to update employee', 500, error.message);
		}
	}

	// Delete employee
	static async delete(req, res) {
		try {
			const { id } = req.params;
			const user_id = req.session.user_id || req.user?.user_id;

			const deleted = await EmployeeModel.delete(id, user_id);

			if (!deleted) {
				return ApiResponse.notFound(res, 'Employee');
			}

			return ApiResponse.success(res, null, 'Employee deleted successfully');
		} catch (error) {
			console.error('Error deleting employee:', error);
			return ApiResponse.error(res, 'Failed to delete employee', 500, error.message);
		}
	}
}

module.exports = EmployeeController;

