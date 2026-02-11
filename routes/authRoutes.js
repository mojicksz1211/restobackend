const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const argon2 = require('argon2');
const crypto = require('crypto');
const { generateTokenPair } = require('../utils/jwt');
const { authenticate, optionalAuthenticate } = require('../middleware/unifiedAuth');

function isArgonHash(hash) {
    return typeof hash === 'string' && hash.startsWith('$argon2');
  }
  
  // Fallback MD5 for legacy support
  function generateMD5(input) {
    return crypto.createHash('md5').update(input).digest('hex');
  }
// Middleware to check session
const checkSession = (req, res, next) => {
    if (!req.session || !req.session.username) {
        res.redirect('/login');
    } else {
        next();
    }
};

const wantsJson = (req) => {
  const accept = req.headers.accept || '';
  const contentType = req.headers['content-type'] || '';
  return req.xhr
    || accept.includes('application/json')
    || contentType.includes('application/json')
    || req.headers['x-requested-with'] === 'XMLHttpRequest';
};
function sessions(req, page) {
	return {
		username: req.session.username,
		firstname: req.session.firstname,
			lastname: req.session.lastname,
		user_id: req.session.user_id,
		currentPage: page
	};
}





// Login page removed - use API endpoint /api/login for authentication
// Frontend should handle login UI separately

// User management routes removed - use API endpoints instead
// GET /api/users, POST /api/users, etc.

// Get current user (JWT or session) - for SPA refresh persistence. Returns 200 with data: null when not logged in (avoids 401 in console).
router.get('/me', optionalAuthenticate, (req, res) => {
  if (!req.user) {
    return res.json({ success: true, data: null });
  }
  const u = req.user;
  return res.json({
    success: true,
    data: {
      user_id: u.user_id,
      username: u.username || '',
      firstname: u.firstname || null,
      lastname: u.lastname || null,
      permissions: u.permissions,
      branch_id: u.branch_id || null,
      branch_name: req.session?.branch_name || null,
      branch_code: req.session?.branch_code || null
    }
  });
});

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM user_info WHERE USERNAME = ? AND ACTIVE = 1';
  
    const safeRedirectWithError = (msg) => {
      if (wantsJson(req)) {
        return res.status(401).json({ success: false, error: msg });
      }
      // connect-flash requires sessions; if session is missing, fallback to query param
      if (req.session) {
        req.flash('error', msg);
        return res.redirect('/login');
      }
      return res.redirect('/login?error=' + encodeURIComponent(msg));
    };
  
    try {
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
          // Check if user has PERMISSIONS = 2 (Tablet App only) - block web login
          if (user.PERMISSIONS === 2) {
            return safeRedirectWithError('This account is for tablet app only. Please use the tablet application to login.');
          }

          // Optional: auto-upgrade legacy MD5 password to Argon2
          if (isLegacy) {
            const newHash = await argon2.hash(password);
            await pool.execute(`UPDATE user_info SET PASSWORD = ?, SALT = NULL WHERE IDNo = ?`, [newHash, user.IDNo]);
          }
  
          req.session.username = username;
          req.session.firstname = user.FIRSTNAME;
          req.session.lastname = user.LASTNAME;
          req.session.user_id = user.IDNo;
          req.session.permissions = user.PERMISSIONS;
          // IMPORTANT:
          // - Admin (PERMISSIONS = 1) should default to ALL branches (no branch filter)
          // - Non-admin users must be assigned EXACTLY ONE branch
          
          // Get user's accessible branches
          const UserBranchModel = require('../models/userBranchModel');
          let userBranches = [];
          try {
            if (user.PERMISSIONS === 1) {
              // Admin can access all branches
              const [allBranches] = await pool.execute(
                'SELECT IDNo, BRANCH_CODE, BRANCH_NAME FROM branches WHERE ACTIVE = 1'
              );
              userBranches = allBranches;
            } else {
              // Regular users get their assigned branches
              userBranches = await UserBranchModel.getBranchesByUserId(user.IDNo);
            }
            
            if (user.PERMISSIONS === 1) {
              // Admin: default to ALL branches (no branch_id in session)
              req.session.branch_id = null;
              req.session.branch_name = null;
              req.session.branch_code = null;
              // Still store list for optional switching UI
              req.session.available_branches = userBranches;
            } else {
              // Non-admin: MUST have exactly one branch
              if (userBranches.length !== 1) {
                const msg = 'This account is not assigned to a branch yet (or has multiple branches). Please contact admin.';
                // Use query param so message still shows even if we destroy session
                if (req.session) {
                  return req.session.destroy(() => res.redirect('/login?error=' + encodeURIComponent(msg)));
                }
                return res.redirect('/login?error=' + encodeURIComponent(msg));
              }
              req.session.branch_id = userBranches[0].IDNo;
              req.session.branch_name = userBranches[0].BRANCH_NAME;
              req.session.branch_code = userBranches[0].BRANCH_CODE;
            }
          } catch (branchError) {
            console.error('Error getting user branches during login:', branchError);
            // Continue without branch selection - user can select later
          }

          if (!req.session) {
            return res.redirect('/login?error=' + encodeURIComponent('Session error, please try again.'));
          }
  
          req.session.save(err => {
            if (err) {
              return safeRedirectWithError('Session error, please try again.');
            }

            if (wantsJson(req)) {
              const tokenPayload = {
                user_id: req.session.user_id,
                username: req.session.username,
                permissions: req.session.permissions,
                firstname: req.session.firstname || null,
                lastname: req.session.lastname || null,
                branch_id: req.session.branch_id || null
              };
              const tokens = generateTokenPair(tokenPayload);
              return res.json({
                success: true,
                data: {
                  user_id: req.session.user_id,
                  username: req.session.username,
                  firstname: req.session.firstname,
                  lastname: req.session.lastname,
                  permissions: req.session.permissions,
                  branch_id: req.session.branch_id || null,
                  branch_name: req.session.branch_name || null,
                  branch_code: req.session.branch_code || null,
                  available_branches: req.session.available_branches || []
                },
                tokens: {
                  accessToken: tokens.accessToken,
                  expiresIn: tokens.expiresIn
                }
              });
            }

            return res.redirect('/dashboard');
          });
        } else {
          return safeRedirectWithError('Incorrect password');
        }
      } else {
        return safeRedirectWithError('User not found or inactive');
      }
    } catch (error) {
      console.error('Login error:', error);
      return safeRedirectWithError('Internal server error');
    }
  });
  
// Verify Password route using async/await
router.post('/verify-password', async (req, res) => {
    try {
      const { password } = req.body;
      const query = 'SELECT * FROM user_info WHERE PERMISSIONS = 1 AND ACTIVE = 1';
      const [results] = await pool.execute(query);
      
      if (results.length > 0) {
        const manager = results[0]; // Assume there's only one manager
        const salt = manager.SALT;
        const hashedPassword = generateMD5(salt + password);
        
        // Verify if the password matches the manager's password
        if (hashedPassword === manager.PASSWORD) {
          return res.json({ permissions: manager.PERMISSIONS });
        } else {
          return res.status(403).json({ message: 'Incorrect password' });
        }
      } else {
        return res.status(404).json({ message: 'Manager not found' });
      }
    } catch (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      return res.status(500).json({ message: 'Error during password verification' });
    }
  });

// Check Permission route
router.post('/check-permission', (req, res) => {
    if (!req.session.permissions) {
        return res.status(401).json({ message: 'Not logged in' });
    }
    if (req.session.permissions === 1) {
        return res.json({ permissions: 1 });
    } else {
        return res.json({ permissions: req.session.permissions });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

/// ADD USER ROLE
router.post('/add_user_role', async (req, res) => {
	try {
		const { role } = req.body;
		const date_now = new Date();
		const query = `INSERT INTO user_role (ROLE, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?)`;

		await pool.execute(query, [role, req.session.user_id, date_now]);
		
		// Check if it's an AJAX request
		if (req.xhr || req.headers.accept.indexOf('json') > -1) {
			res.json({ success: true, message: 'User role created successfully' });
		} else {
			res.redirect('/userRoles');
		}
	} catch (err) {
		console.error('Error inserting user role:', err);
		if (req.xhr || req.headers.accept.indexOf('json') > -1) {
			res.status(500).json({ error: 'Error inserting user role' });
		} else {
			res.status(500).send('Error inserting user');
		}
	}
});

// GET USER ROLE
router.get('/user_role_data', async (req, res) => {
	try {
		const perm = parseInt(req.session?.permissions);

		let sql = 'SELECT * FROM user_role WHERE ACTIVE = 1';
		const params = [];

		// Non-admin users should NOT see the Administrator role in dropdowns
		if (perm !== 1) {
			sql += ' AND IDNo <> 1';
		}

		const [results] = await pool.execute(sql, params);
		res.json(results);
	} catch (error) {
		console.error('Error fetching data:', error);
		res.status(500).send('Error fetching data');
	}
});

// UPDATE USER ROLE
router.put('/user_role/:id', async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const { role } = req.body;
		const date_now = new Date();
		const query = `UPDATE user_role SET ROLE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;

		await pool.execute(query, [role, req.session.user_id, date_now, id]);
		res.send('User role updated successfully');
	} catch (err) {
		console.error('Error updating user role:', err);
		res.status(500).send('Error updating user role');
	}
});

// ARCHIVE USER ROLE
router.put('/user_role/remove/:id', async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const date_now = new Date();
		const query = `UPDATE user_role SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;

		await pool.execute(query, [0, req.session.user_id, date_now, id]);
		res.send('User role updated successfully');
	} catch (err) {
		console.error('Error archiving user role:', err);
		res.status(500).send('Error updating user role');
	}
});


// GET USERS
router.get('/users', async (req, res) => {
	try {
		const perm = parseInt(req.session?.permissions);
		const currentBranchId = req.session?.branch_id;

		// Admin: see ALL users (or filter by selected branch if set)
		if (perm === 1) {
			let query = `
				SELECT 
					u.*,
					ur.ROLE AS role,
					u.IDNo AS user_id,
					rt.TABLE_NUMBER AS TABLE_NUMBER,
					CASE 
						WHEN u.PERMISSIONS = 1 THEN 'ALL'
						ELSE COALESCE(
						NULLIF(GROUP_CONCAT(DISTINCT b.BRANCH_NAME ORDER BY b.BRANCH_NAME SEPARATOR ', '), ''),
							'—'
						)
					END AS BRANCH_LABEL
				FROM user_info u
				JOIN user_role ur ON ur.IDno = u.PERMISSIONS
				LEFT JOIN restaurant_tables rt ON rt.IDNo = u.TABLE_ID
				LEFT JOIN user_branches ub ON ub.USER_ID = u.IDNo
				LEFT JOIN branches b ON b.IDNo = ub.BRANCH_ID
				WHERE u.ACTIVE = 1
			`;

			const params = [];
			if (currentBranchId) {
				query += ` AND ub.BRANCH_ID = ?`;
				params.push(parseInt(currentBranchId));
			}

			query += `
				GROUP BY u.IDNo
				ORDER BY u.LASTNAME ASC, u.FIRSTNAME ASC
			`;

			const [results] = await pool.execute(query, params);
			return res.json(results);
		}

		// Non-admin: see ONLY users within current branch
		if (!currentBranchId) {
			return res.json([]); // no branch selected/assigned -> show none
		}

		const query = `
			SELECT 
				u.*,
				ur.ROLE AS role,
				u.IDNo AS user_id,
				rt.TABLE_NUMBER AS TABLE_NUMBER,
				MAX(b.BRANCH_CODE) AS BRANCH_CODE,
				MAX(b.BRANCH_NAME) AS BRANCH_NAME
			FROM user_info u
			JOIN user_role ur ON ur.IDno = u.PERMISSIONS
			LEFT JOIN restaurant_tables rt ON rt.IDNo = u.TABLE_ID
			INNER JOIN user_branches ub ON ub.USER_ID = u.IDNo
			INNER JOIN branches b ON b.IDNo = ub.BRANCH_ID
			WHERE u.ACTIVE = 1 
			  AND u.PERMISSIONS <> 1
			  AND ub.BRANCH_ID = ?
			GROUP BY u.IDNo
			ORDER BY u.LASTNAME ASC, u.FIRSTNAME ASC
		`;
		const [results] = await pool.execute(query, [parseInt(currentBranchId)]);
		res.json(results);
	} catch (error) {
		console.error('Error fetching data:', error);
		res.status(500).send('Error fetching data');
	}
});

// ADD USER
router.post('/add_user', async (req, res) => {
	try {
		const {
			txtFirstName,
			txtLastName,
			txtUserName,
			txtPassword,
			txtPassword2,
			user_role,
			table_id,
			salt,
			branch_id
		} = req.body;

		let date_now = new Date();

		if (txtPassword !== txtPassword2) {
			return res.status(500).json({ error: 'password' });
		}

		// 1-to-1 validation: if role=2 (Table-TabletMenu), TABLE_ID is required and must be unique among ACTIVE users
		const roleId = parseInt(user_role);
		let tableIdToSave = null;

		// Only admins (PERMISSIONS = 1) are allowed to create Administrator accounts
		const creatorPermForNewUser = parseInt(req.session.permissions);
		if (roleId === 1 && creatorPermForNewUser !== 1) {
			return res.status(403).json({ error: 'Only admin can create Administrator accounts.' });
		}
		if (roleId === 2) {
			if (!table_id) {
				return res.status(400).json({ error: 'Table is required for this role.' });
			}
			tableIdToSave = parseInt(table_id);
			const [existing] = await pool.execute(
				`SELECT IDNo FROM user_info WHERE TABLE_ID = ? AND ACTIVE = 1 LIMIT 1`,
				[tableIdToSave]
			);
			if (existing.length > 0) {
				return res.status(400).json({ error: 'Selected table is already assigned to another user.' });
			}
		}

		const generated_pw = await argon2.hash(txtPassword);
		const query = `
			INSERT INTO user_info 
			(FIRSTNAME, LASTNAME, USERNAME, PASSWORD, SALT, PERMISSIONS, TABLE_ID, LAST_LOGIN, ENCODED_BY, ENCODED_DT) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;

		const [result] = await pool.execute(query, [
			txtFirstName,
			txtLastName,
			txtUserName,
			generated_pw,
			salt,
			user_role,
			tableIdToSave,
			date_now,
			req.session.user_id,
			date_now
		]);

		const newUserId = result.insertId;

		// ================================
		// BRANCH ASSIGNMENT LOGIC
		// ================================
		const creatorPerm = parseInt(req.session.permissions);
		const creatorId = req.session.user_id;

		if (roleId === 1) {
			// New ADMIN user: automatically give access to ALL existing active branches
			const [branches] = await pool.execute(
				'SELECT IDNo AS BRANCH_ID FROM branches WHERE ACTIVE = 1'
			);
			if (branches.length > 0) {
				const values = branches.map(b => [newUserId, b.BRANCH_ID]);
				// Idempotent: if some rows already exist (e.g. admin already assigned), skip duplicates
				await pool.query(
					'INSERT IGNORE INTO user_branches (USER_ID, BRANCH_ID) VALUES ?',
					[values]
				);
			}
		} else {
			// Non-admin user: exactly ONE branch
			let targetBranchId = null;

			if (creatorPerm === 1 && branch_id) {
				// Admin creating user: use selected branch from form
				targetBranchId = parseInt(branch_id);
			} else {
				// Non-admin creator: new user gets same branch as creator
				if (req.session.branch_id) {
					targetBranchId = parseInt(req.session.branch_id);
				} else {
					// Fallback: look up creator's branch from user_branches
					const [ub] = await pool.execute(
						'SELECT BRANCH_ID FROM user_branches WHERE USER_ID = ? LIMIT 1',
						[creatorId]
					);
					if (ub.length > 0) {
						targetBranchId = parseInt(ub[0].BRANCH_ID);
					}
				}
			}

			if (targetBranchId && !isNaN(targetBranchId)) {
				await pool.execute(
					`INSERT INTO user_branches (USER_ID, BRANCH_ID)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE BRANCH_ID = VALUES(BRANCH_ID)`,
					[newUserId, targetBranchId]
				);
			}
		}

		res.redirect('/manageUsers');
	} catch (err) {
		console.error('Error inserting user:', err);
		res.status(500).send('Error inserting user');
	}
});

// UPDATE USER
router.put('/user/:id', async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const {
			txtFirstName,
			txtLastName,
			txtUserName,
			user_role,
			table_id
		} = req.body;

		const date_now = new Date();

		// 1-to-1 validation: if role=2, TABLE_ID required and must not be used by other ACTIVE users
		const roleId = parseInt(user_role);
		let tableIdToSave = null;
		if (roleId === 2) {
			if (!table_id) {
				return res.status(400).json({ error: 'Table is required for this role.' });
			}
			tableIdToSave = parseInt(table_id);
			const [existing] = await pool.execute(
				`SELECT IDNo FROM user_info WHERE TABLE_ID = ? AND ACTIVE = 1 AND IDNo <> ? LIMIT 1`,
				[tableIdToSave, id]
			);
			if (existing.length > 0) {
				return res.status(400).json({ error: 'Selected table is already assigned to another user.' });
			}
		}

		const query = `
			UPDATE user_info 
			SET FIRSTNAME = ?, LASTNAME = ?, USERNAME = ?, PERMISSIONS = ?, TABLE_ID = ?, EDITED_BY = ?, EDITED_DT = ? 
			WHERE IDNo = ?
		`;

		await pool.execute(query, [
			txtFirstName,
			txtLastName,
			txtUserName,
			user_role,
			tableIdToSave,
			req.session.user_id,
			date_now,
			id
		]);

		res.send('User role updated successfully');
	} catch (err) {
		console.error('Error updating user role:', err);
		res.status(500).send('Error updating user role');
	}
});

// ARCHIVE USER
router.put('/user/remove/:id', async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const date_now = new Date();

		const query = `
			UPDATE user_info 
			SET ACTIVE = ?, TABLE_ID = NULL, EDITED_BY = ?, EDITED_DT = ? 
			WHERE IDNo = ?
		`;

		await pool.execute(query, [0, req.session.user_id, date_now, id]);

		res.send('User role removed successfully');
	} catch (err) {
		console.error('Error updating user:', err);
		res.status(500).send('Error updating user');
	}
});

module.exports = {
    router,
    checkSession,
    sessions
  };

