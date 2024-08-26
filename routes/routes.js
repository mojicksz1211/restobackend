const express = require('express');
const pageRouter = express.Router();
const path = require('path');
const crypto = require('crypto');
const session = require('express-session');
const ExcelJS = require('exceljs');

const mysql2 = require('mysql2/promise');

const bodyParser = require('body-parser');
const mysql = require('mysql');

const multer = require('multer');

const app = express();

app.use(bodyParser.urlencoded({
	extended: true
}));

const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'cagex'
});

// Set up multer storage (in memory)
const storage = multer.memoryStorage();
const upload = multer({
	storage: storage,
	limits: {
		fileSize: 10000000
	},
	fileFilter: function (req, file, cb) {
		checkFileType(file, cb);
	}
}).single('photo');

// Check file type
function checkFileType(file, cb) {
	// Allowed ext
	const filetypes = /jpeg|jpg|png|gif/;
	// Check ext
	const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
	// Check mime
	const mimetype = filetypes.test(file.mimetype);

	if (mimetype && extname) {
		return cb(null, true);
	} else {
		cb('Error: Images Only!');
	}
}

pageRouter.use(session({
	secret: 'username',
	resave: false,
	saveUninitialized: true
}));

app.set('view engine', 'ejs');

app.use(express.static('public'));


function generateMD5(input) {
	return crypto.createHash('md5').update(input).digest('hex');
}

const checkSession = (req, res, next) => {
	if (!req.session || !req.session.username) {
		res.redirect('/login');
	} else {
		next();
	}
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


pageRouter.get("/", function (req, res) {
	res.render("login");
});


pageRouter.get("/login", function (req, res) {
	res.render("login");
});

pageRouter.get("/", function (req, res) {
	res.render("dashboard", sessions(req, 'dashboard'));
});

pageRouter.get("/dashboard", checkSession, function (req, res) {

	let sqlCashDeposit = 'SELECT  SUM(AMOUNT) AS CASH_DEPOSIT FROM JUNKET_CAPITAL WHERE ACTIVE=1 AND TRANSACTION_ID=1';
	let sqlCashWithdraw = 'SELECT  SUM(AMOUNT) AS CASH_WITHDRAW FROM JUNKET_CAPITAL WHERE ACTIVE=1 AND TRANSACTION_ID=2';
	let sqlAccountDeposit = 'SELECT SUM(AMOUNT) AS ACCOUNT_DEPOSIT FROM ACCOUNT_LEDGER WHERE ACTIVE =1 AND TRANSACTION_ID = 1';

	let sqlAccountCCChips = 'SELECT SUM(CC_CHIPS) AS TOTAL_CC FROM game_record WHERE ACTIVE =1';
	let sqlAccountNNChips = 'SELECT SUM(NN_CHIPS) AS TOTAL_NN FROM game_record WHERE ACTIVE =1';

	let sqlMarkerIssueGame = 'SELECT SUM(NN_CHIPS + CC_CHIPS) AS TOTAL_ISSUE_GAME FROM game_record WHERE ACTIVE =1 AND TRANSACTION = 3';
	let sqlMarkerIssueAccount = 'SELECT SUM(AMOUNT) AS TOTAL_ISSUE_RECORD FROM account_ledger WHERE ACTIVE =1 AND TRANSACTION_ID = 3';

	let sqlTotalRealRolling = 'SELECT SUM(NN_CHIPS + CC_CHIPS) AS TOTAL_REAL_ROLLING FROM game_record WHERE ACTIVE =1 AND CAGE_TYPE = 4';
	let sqlTotalRolling = 'SELECT SUM(NN_CHIPS + CC_CHIPS) AS TOTAL_ROLLING FROM game_record WHERE ACTIVE =1 AND CAGE_TYPE IN (3,4)';
	let sqlTotalCashOutRolling = 'SELECT SUM(NN_CHIPS) AS TOTAL_CASHOUT FROM game_record WHERE ACTIVE =1 AND CAGE_TYPE = 2';
	let sqlTotalCashOut = 'SELECT SUM(NN_CHIPS + CC_CHIPS) AS TOTAL_CASHOUT FROM game_record WHERE ACTIVE =1 AND CAGE_TYPE = 2';

	let sqlWinLoss = 'SELECT SUM(NN_CHIPS + CC_CHIPS) AS TOTAL_CASHIN FROM game_record WHERE ACTIVE =1 AND CAGE_TYPE = 1';

	let sqlCommisionRolling = `SELECT SUM(game_record.NN_CHIPS + game_record.CC_CHIPS) AS TOTAL_ROLLING, game_list.COMMISSION_PERCENTAGE AS percentage FROM game_record 
			LEFT JOIN game_list ON game_list.IDNo = game_record.GAME_ID
			WHERE game_list.ACTIVE IN (1,2) AND game_list.COMMISSION_TYPE = 1 AND game_record.CAGE_TYPE IN (3,4) GROUP BY game_record.GAME_ID`;

	let sqlCommisionCashout = `SELECT SUM(game_record.NN_CHIPS + game_record.CC_CHIPS) AS TOTAL_CASHOUT FROM game_record 
			LEFT JOIN game_list ON game_list.IDNo = game_record.GAME_ID
			WHERE game_list.ACTIVE IN (1,2) AND game_list.COMMISSION_TYPE = 1 AND game_record.CAGE_TYPE = 2 GROUP BY game_record.GAME_ID`;

	let sqlSharedRolling = `SELECT SUM(game_record.NN_CHIPS) AS TOTAL_ROLLING, game_list.COMMISSION_PERCENTAGE AS percentage FROM game_record 
			LEFT JOIN game_list ON game_list.IDNo = game_record.GAME_ID
			WHERE game_list.ACTIVE IN (1,2) AND game_list.COMMISSION_TYPE = 2 AND game_record.CAGE_TYPE IN (3,4) GROUP BY game_record.GAME_ID`;

	let sqlSharedCashout = `SELECT SUM(game_record.NN_CHIPS) AS TOTAL_CASHOUT FROM game_record 
			LEFT JOIN game_list ON game_list.IDNo = game_record.GAME_ID
			WHERE game_list.ACTIVE IN (1,2) AND game_list.COMMISSION_TYPE = 2 AND game_record.CAGE_TYPE = 2 GROUP BY game_record.GAME_ID`;

	connection.query(sqlCashDeposit, (err, cashDepositResult) => {
		if (err) throw err;

		connection.query(sqlCashWithdraw, (err, cashWithdrawResult) => {
			if (err) throw err;

			connection.query(sqlAccountDeposit, (err, accountDepositResult) => {
				if (err) throw err;

				connection.query(sqlAccountCCChips, (err, accountCCChips) => {
					if (err) throw err;

					connection.query(sqlAccountNNChips, (err, accountNNChips) => {
						if (err) throw err;
						
						connection.query(sqlMarkerIssueGame, (err, markerIssueGame) => {
							if (err) throw err;

							connection.query(sqlMarkerIssueAccount, (err, markerIssueAccount) => {
								if (err) throw err;

								connection.query(sqlTotalRealRolling, (err, totalRealRolling) => {
									if (err) throw err;

									connection.query(sqlTotalRolling, (err, totalRolling) => {
										if (err) throw err;

										connection.query(sqlTotalCashOut, (err, totalCashOut) => {
											if (err) throw err;

											connection.query(sqlTotalCashOutRolling, (err, totalCashOutRolling) => {
												if (err) throw err;
		
												connection.query(sqlWinLoss, (err, totalWinLoss) => {
													if (err) throw err;

													connection.query(sqlCommisionRolling, (err, totalCommisionRolling) => {
														if (err) throw err;

														connection.query(sqlCommisionCashout, (err, totalCommisionCashout) => {
															if (err) throw err;

															let totalCommission = 0;

															for(let i=0; i<totalCommisionRolling.length; i++) {
																let cashout = 0;
																if(totalCommisionCashout[i]) {
																	cashout = totalCommisionCashout[i].TOTAL_CASHOUT;
																}

																totalCommission += (totalCommisionRolling[i].TOTAL_ROLLING - cashout) * (totalCommisionRolling[i].percentage / 100);
															}

															connection.query(sqlSharedRolling, (err, totalSharedRolling) => {
																if (err) throw err;

																connection.query(sqlSharedCashout, (err, totalSharedCashout) => {
																	if (err) throw err;

																	let totalShared = 0;

																	for(let j=0; j<totalSharedRolling.length; j++) {
																		let cashout_shared = 0;

																		if(totalSharedCashout[j]) {
																			cashout_shared = totalSharedCashout[j].TOTAL_CASHOUT;
																		}

																		totalShared += (totalSharedRolling[j].TOTAL_ROLLING - cashout_shared) * (totalSharedRolling[j].percentage / 100);
																	}


																	res.render('dashboard', {

																		username: req.session.username,
																		firstname: req.session.firstname,
																		lastname: req.session.lastname,
																		user_id: req.session.user_id,
																		currentPage: 'dashboard',

																		sqlCashDeposit: cashDepositResult,
																		sqlCashWithdraw: cashWithdrawResult,
																		sqlAccountDeposit: accountDepositResult,
																		sqlAccountCCChips: accountCCChips,
																		sqlAccountNNChips: accountNNChips,
																		sqlMarkerIssueGame: markerIssueGame,
																		sqlMarkerIssueAccount: markerIssueAccount,
																		sqlTotalRealRolling: totalRealRolling,
																		sqlTotalRolling: totalRolling,
																		sqlTotalCashOut: totalCashOut,
																		sqlTotalCashOutRolling: totalCashOutRolling,
																		sqlWinLoss: totalWinLoss,
																		sqlCommision: totalCommission,
																		sqlShared: totalShared,

																	});

																});
															});
														});
													});
												});
											});
										});
									});
								});
							});
						});
					});
				});
			});
		});
	});

});

pageRouter.get("/agency", checkSession, function (req, res) {
	res.render("accounts/agency", sessions(req, 'agency'));
});

pageRouter.get("/agent", checkSession, function (req, res) {
	res.render("accounts/agent", sessions(req, 'agent'));
});

pageRouter.get("/account_ledger", checkSession, function (req, res) {
	res.render("accounts/account_ledger", sessions(req, 'account_ledger'));
});

//=============== JUNKET =============
pageRouter.get("/capital", function (req, res) {
	res.render("junket/capital", sessions(req, 'capital'));
});

pageRouter.get("/house_expense", function (req, res) {
	res.render("junket/house_expense", sessions(req, 'house_expense'));
});

pageRouter.get("/credit", function (req, res) {
	res.render("junket/credit", sessions(req, 'credit'));
});

pageRouter.get("/commission", function (req, res) {
	res.render("junket/commission", sessions(req, 'commission'));
});


pageRouter.get("/concierge", function (req, res) {
	res.render("junket/concierge", sessions(req, 'concierge'));
});

pageRouter.get("/main_cage", function (req, res) {
	res.render("junket/main_cage", sessions(req, 'main_cage'));
});

//========== USER ACCOUNTS ================
pageRouter.get("/user_roles", function (req, res) {
	res.render("user_accounts/user_roles", sessions(req, 'user_roles'));
});

pageRouter.get("/user_roles", checkSession, function (req, res) {
	res.render("user_accounts/user_roles", sessions(req, 'user_roles'));
});

pageRouter.get("/manage_users", checkSession, function (req, res) {
	res.render("user_accounts/manage_users", sessions(req, 'manage_users'));
});

// ======================= GAME LIST ==================

pageRouter.get("/game_list", checkSession, function (req, res) {
	res.render("gamebook/game_list", sessions(req, 'game_list'));
});

pageRouter.get("/game_list2", checkSession, function (req, res) {
	res.render("gamebook/game_list2", sessions(req, 'game_list'));
});

pageRouter.get("/game_record/:id", checkSession, function (req, res) {
	const pageId = parseInt(req.params.id);
	const query = `SELECT *
	FROM game_list  
	JOIN account ON game_list.ACCOUNT_ID = account.IDNo
	JOIN agent ON agent.IDNo = account.AGENT_ID
	JOIN agency ON agency.IDNo = agent.AGENCY
	WHERE game_list.ACTIVE != 0 AND game_list.IDNo = ?`;

	connection.query(query, [pageId], (error, results) => {
		if (error) {
			console.error('Error executing MySQL query: ' + error.stack);
			res.send('Error during login');
			return;
		}
		if (results) {
			res.render('gamebook/game_record', {
				username: req.session.username,
				firstname: req.session.firstname,
				lastname: req.session.lastname,
				user_id: req.session.user_id,
				page_id: pageId,
				reference: results[0].GAME_NO,
				currentPage: 'game_record'
			});
		}
	});

});

//LOGIN
pageRouter.post('/login', (req, res) => {
	const {
		username,
		password
	} = req.body;
	const query = 'SELECT * FROM user_info WHERE USERNAME = ? AND ACTIVE = 1';

	connection.query(query, [username], (error, results) => {
		if (error) {
			console.error('Error executing MySQL query: ' + error.stack);
			res.send('Error during login');
			return;
		}

		if (results.length > 0) {
			const user = results[0];
			const salt = user.SALT;
			const username1 = user.USERNAME;
			const hashedPassword = generateMD5(salt + password);

			const query1 = 'SELECT * FROM user_info WHERE USERNAME = ? AND PASSWORD = ? AND ACTIVE = 1';
			connection.query(query1, [username1, hashedPassword], (errors, result) => {
				if (errors) {
					console.error('Error executing MySQL query: ' + errors.stack);
					res.send('Error during login');
					return;
				}

				if (result.length > 0) {
					req.session.username = username;
					req.session.firstname = user.FIRSTNAME;
					req.session.lastname = user.LASTNAME;
					req.session.user_id = user.IDNo;
					res.redirect('/dashboard');
				} else {
					res.redirect('/login');
				}
			});
		} else {
			res.redirect('/login');
		}
	});
});

//LOGOUT
pageRouter.get('/logout', (req, res) => {
	req.session.destroy();
	res.redirect('/login');
});

//============= POP UPS ====================
pageRouter.get("/cage_category", function (req, res) {
	res.render("popups/cage_category", sessions(req, 'cage_category'));
});

pageRouter.get("/capital_category", function (req, res) {
	res.render("popups/capital_category", sessions(req, 'capital_category'));
});

pageRouter.get("/concierge_category", function (req, res) {
	res.render("popups/concierge_category", sessions(req, 'concierge_category'));
});

pageRouter.get("/credit_status", function (req, res) {
	res.render("popups/credit_status", sessions(req, 'credit_status'));
});

pageRouter.get("/expense_category", function (req, res) {
	res.render("popups/expense_category", sessions(req, 'expense_category'));
});

pageRouter.get("/transaction_type", function (req, res) {
	res.render("popups/transaction_type", sessions(req, 'transaction_type'));
});

// ================= DENOMINATION =======================

pageRouter.get("/cash", function (req, res) {
	res.render("denomination/cash", sessions(req, 'cash'));
});

pageRouter.get("/cash_chips", function (req, res) {
	res.render("denomination/cash_chips", sessions(req, 'cash_chips'));
});

pageRouter.get("/non_negotiable_chips", function (req, res) {
	res.render("denomination/non_negotiable_chips", sessions(req, 'non_nego'));
});

//Add User Role
pageRouter.post('/add_user_role', (req, res) => {
	const {
		role
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO user_role (ROLE, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?)`;
	connection.query(query, [role, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting user role:', err);
			res.status(500).send('Error inserting user');
			return;
		}

		res.redirect('/user_roles');
	});
});

//Get User Role
pageRouter.get('/user_role_data', (req, res) => {
	connection.query('SELECT * FROM user_role WHERE ACTIVE = 1', (error, results, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(results);
	});
});

// UPDATE USER ROLE
pageRouter.put('/user_role/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		role
	} = req.body;
	let date_now = new Date();

	const query = `UPDATE user_role SET ROLE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [role, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating user role:', err);
			res.status(500).send('Error updating user role');
			return;
		}

		res.send('User role updated successfully');
	});
});

// ARCHIVE USER ROLE
pageRouter.put('/user_role/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE user_role SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating user role:', err);
			res.status(500).send('Error updating user role');
			return;
		}

		res.send('User role updated successfully');
	});
});

//Get Users
pageRouter.get('/users', (req, res) => {
	connection.query('SELECT *, user_role.ROLE AS role, user_info.IDNo AS user_id FROM user_info JOIN user_role ON user_role.IDno = user_info.PERMISSIONS WHERE user_info.ACTIVE = 1', (error, results, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(results);
	});
});


//Add User
pageRouter.post('/add_user', (req, res) => {
	const {
		txtFirstName,
		txtLastName,
		txtUserName,
		txtPassword,
		txtPassword2,
		user_role,
		salt
	} = req.body;
	let date_now = new Date();

	if (txtPassword != txtPassword2) {
		res.status(500).json({
			error: 'password'
		});
	} else {
		const generated_pw = generateMD5(salt + txtPassword);
		const query = `INSERT INTO user_info (FIRSTNAME, LASTNAME, USERNAME, PASSWORD, SALT, PERMISSIONS, LAST_LOGIN, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
		connection.query(query, [txtFirstName, txtLastName, txtUserName, generated_pw, salt, user_role, date_now, req.session.user_id, date_now], (err, result) => {
			if (err) {
				console.error('Error inserting user:', err);
				res.status(500).send('Error inserting user');
				return;
			}

			res.redirect('/users');
		});
	}
});

// UPDATE USER
pageRouter.put('/user/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtFirstName,
		txtLastName,
		txtUserName,
		user_role
	} = req.body;
	let date_now = new Date();

	const query = `UPDATE user_info SET FIRSTNAME = ?, LASTNAME = ?, USERNAME = ?, PERMISSIONS = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtFirstName, txtLastName, txtUserName, user_role, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating user role:', err);
			res.status(500).send('Error updating user role');
			return;
		}

		res.send('User role updated successfully');
	});
});

// ARCHIVE USER
pageRouter.put('/user/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE user_info SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating user:', err);
			res.status(500).send('Error updating user');
			return;
		}

		res.send('User role removed successfully');
	});
});

// ADD AGENCY
pageRouter.post('/add_agency', (req, res) => {
	const {
		txtAgency
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO agency (AGENCY, ENCODED_BY, ENCODED_DT) VALUES ( ?, ?, ?)`;
	connection.query(query, [txtAgency, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting agency:', err);
			res.status(500).send('Error inserting agency');
			return;
		}

		res.redirect('/agency');
	});
});

//Get AGENCY
pageRouter.get('/agency_data', (req, res) => {
	connection.query('SELECT * FROM agency WHERE agency.ACTIVE = 1 ORDER BY AGENCY ASC', (error, results, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(results);
	});
});

// EDIT AGENCY
pageRouter.put('/agency/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtAgency
	} = req.body;
	let date_now = new Date();

	const query = `UPDATE agency SET AGENCY = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtAgency, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating agency:', err);
			res.status(500).send('Error updating agency');
			return;
		}

		res.send('Agency updated successfully');
	});
});

pageRouter.put('/agency/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE agency SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating agency:', err);
			res.status(500).send('Error updating agency');
			return;
		}

		res.send('Agency updated successfully');
	});
});

// ADD AGENT
pageRouter.post('/add_agent', (req, res) => {
	const {
		txtAgencyLine,
		txtAgenctCode,
		txtName,
		txtRemarks,
		txtContact
	} = req.body;
	let date_now = new Date();


	const query = `INSERT INTO agent (AGENCY, AGENT_CODE, NAME, CONTACTNo, REMARKS, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?)`;
	connection.query(query, [txtAgencyLine, txtAgenctCode, txtName, txtContact, txtRemarks, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting agent:', err);
			res.status(500).send('Error inserting agent');
			return;
		}

		const agent_id = result.insertId;

		const account = `INSERT INTO account (AGENT_ID, GUESTNo, MEMBERSHIPNo, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?)`;

		connection.query(account, [agent_id, '', '', req.session.user_id, date_now], (err, results2) => {
			if (err) throw err;

			res.redirect('/agent');
		});


	});
});

//GET AGENT
pageRouter.get('/agent_data', (req, res) => {
	connection.query('SELECT *, agency.AGENCY AS agency_name, agency.IDNo AS agency_id, agent.AGENT_CODE AS agent_code, agent.IDNo AS agent_id, agent.ACTIVE as active FROM agent JOIN agency ON agent.AGENCY = agency.IDNo WHERE agent.ACTIVE = 1', (error, results, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(results);
	});
});

//GET AGENT DATA
pageRouter.get('/agent_data/:id', (req, res) => {
	const id = parseInt(req.params.id);

	connection.query('SELECT CONCAT_WS(" ", FIRSTNAME,  MIDDLENAME, LASTNAME) AS agent_name, agent.IDNo AS agent_id, agency.AGENCY AS agency, agency.IDNo AS agency_id FROM agent JOIN agency ON agent.AGENCY = agency.IDNo WHERE agent.IDNo = ' + id + ' AND agent.ACTIVE = 1', (error, results, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(results);
	});
});

// EDIT AGENT
pageRouter.put('/agent/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtAgencyLine,
		txtAgenctCode,
		txtName,
		txtRemarks,
		// txtFirstname,
		// txtMiddleName,
		// txtLastname,
		txtContact
	} = req.body;
	let date_now = new Date();

	const agency = txtAgencyLine.split('-');
	const account_code = agency[1] + '-' + txtAgenctCode;

	const query = `UPDATE agent SET  AGENCY = ?, AGENT_CODE = ?, NAME = ?, CONTACTNo = ?, REMARKS = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [agency[0], txtAgenctCode, txtName, txtContact, txtRemarks, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating agent:', err);
			res.status(500).send('Error updating agent');
			return;
		}

		res.send('Agent updated successfully');
	});
});

// REMOVE AGENT
pageRouter.put('/agent/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE agent SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, 1, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating agency:', err);
			res.status(500).send('Error updating agency');
			return;
		}

		res.send('Agency updated successfully');
	});
});


// ADD ACCOUNT
pageRouter.post('/add_account', (req, res) => {
	const {
		agent_id,
		txtGuestNo,
		txtFirstname,
		txtMiddlename,
		txtLastname,
		txtMembershipNo
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO account (AGENT_ID, GUESTNo, FIRSTNAME, MIDDLENAME, LASTNAME, MEMBERSHIPNo, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
	connection.query(query, [agent_id, txtGuestNo, txtFirstname, txtMiddlename, txtLastname, txtMembershipNo, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting agent:', err);
			res.status(500).send('Error inserting agent');
			return;
		}

		res.redirect('/account_ledger');
	});
});

//GET ACCOUNT
pageRouter.get('/account_data', (req, res) => {
	const query = `SELECT *, agency.AGENCY AS agency_name, account.IDNo AS account_id, agent.AGENT_CODE AS agent_code, account.ACTIVE as active,  agent.NAME AS agent_name
  FROM account 
  JOIN agent ON agent.IDNo = account.AGENT_ID
  JOIN agency ON agency.IDNo = agent.AGENCY
  WHERE account.ACTIVE = 1`;
	connection.query(query, (error, results, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(results);
	});
});

// EDIT ACCOUNT
pageRouter.put('/account/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtGuestNo,
		txtMembershipNo
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE account SET  GUESTNo = ?, MEMBERSHIPNo = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtGuestNo, txtMembershipNo, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating account:', err);
			res.status(500).send('Error updating account');
			return;
		}

		res.send('Account updated successfully');
	});
});

// REMOVE ACCOUNT
pageRouter.put('/account/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE account SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating agency:', err);
			res.status(500).send('Error updating agency');
			return;
		}

		res.send('Agency updated successfully');
	});
});

// ADD CAGE CATEGORY
pageRouter.post('/add_cage_category', (req, res) => {
	const {
		txtCategory
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO cage_category(CATEGORY, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?)`;
	connection.query(query, [txtCategory, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting Cage Category', err);
			res.status(500).send('Error inserting Cage Category');
			return;
		}
		res.redirect('/cage_category');
	});
});

// GET CAGE CATEGORY
pageRouter.get('/cage_category_data', (req, res) => {
	connection.query('SELECT * FROM cage_category WHERE ACTIVE=1 ORDER BY CATEGORY ASC', (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// EDIT CAGE CATEGORY
pageRouter.put('/cage_category/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtCategory
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE cage_category SET  CATEGORY = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtCategory, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating cage category:', err);
			res.status(500).send('Error updating cage category');
			return;
		}

		res.send('Cage category updated successfully');
	});
});


// DELETE CAGE CATEGORY
pageRouter.put('/cage_category/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE cage_category SET  ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating cage category:', err);
			res.status(500).send('Error updating cage category');
			return;
		}

		res.send('Cage category updated successfully');
	});
});


// ADD CAPITAL CATEGORY
pageRouter.post('/add_capital_category', (req, res) => {
	const {
		txtCategory
	} = req.body;
	let date_now = new Date();



	const query = `INSERT INTO capital_category(CATEGORY, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?)`;
	connection.query(query, [txtCategory, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting Capital Category', err);
			res.status(500).send('Error inserting Capital Category');
			return;
		}
		res.redirect('/capital_category');
	});
});

// GET CAPITAL CATEGORY
pageRouter.get('/capital_category_data', (req, res) => {
	connection.query('SELECT * FROM capital_category WHERE ACTIVE=1 ORDER BY CATEGORY ASC', (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// EDIT CAPITAL CATEGORY
pageRouter.put('/capital_category/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtCategory
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE capital_category SET  CATEGORY = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtCategory, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating cage category:', err);
			res.status(500).send('Error updating cage category');
			return;
		}

		res.send('Capital category updated successfully');
	});
});


// DELETE CAPITAL CATEGORY
pageRouter.put('/capital_category/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE capital_category SET  ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating capital category:', err);
			res.status(500).send('Error updating capital category');
			return;
		}

		res.send('Capital category updated successfully');
	});
});


// ADD Concierge CATEGORY
pageRouter.post('/add_concierge_category', (req, res) => {
	const {
		txtCategory
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO concierge_category(CATEGORY, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?)`;
	connection.query(query, [txtCategory, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting Concierge Category', err);
			res.status(500).send('Error inserting Concierge Category');
			return;
		}
		res.redirect('/concierge_category');
	});
});

// GET Concierge CATEGORY
pageRouter.get('/concierge_category_data', (req, res) => {
	connection.query('SELECT * FROM concierge_category WHERE ACTIVE=1 ORDER BY CATEGORY ASC', (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// EDIT Concierge CATEGORY
pageRouter.put('/concierge_category/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtCategory
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE concierge_category SET  CATEGORY = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtCategory, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Concierge category:', err);
			res.status(500).send('Error updating Concierge category');
			return;
		}

		res.send('Concierge category updated successfully');
	});
});


// DELETE Concierge CATEGORY
pageRouter.put('/concierge_category/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE concierge_category SET  ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Concierge category:', err);
			res.status(500).send('Error updating Concierge category');
			return;
		}

		res.send('Concierge category updated successfully');
	});
});


// ADD CREDIT STATUS
pageRouter.post('/add_credit_status', (req, res) => {
	const {
		txtCreditStatus
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO credit_status(STATUS, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?)`;
	connection.query(query, [txtCreditStatus, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting Credit Status', err);
			res.status(500).send('Error inserting Credit Status');
			return;
		}
		res.redirect('/credit_status');
	});
});

// GET CREDIT STATUS
pageRouter.get('/credit_status_data', (req, res) => {
	connection.query('SELECT * FROM credit_status WHERE ACTIVE=1 ORDER BY STATUS ASC', (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// EDIT CREDIT STATUS
pageRouter.put('/credit_status/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtCreditStatus
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE credit_status SET  STATUS = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtCreditStatus, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Credit Status:', err);
			res.status(500).send('Error updating Credit Status');
			return;
		}

		res.send('Credit Status updated successfully');
	});
});


// DELETE CREDIT STATUS
pageRouter.put('/credit_status/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE credit_status SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Credit Status:', err);
			res.status(500).send('Error updating Credit Status');
			return;
		}

		res.send('Credit Status updated successfully');
	});
});


// ADD EXPENSE CATEGORY
pageRouter.post('/add_expense_category', (req, res) => {
	const {
		txtCategory
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO expense_category(CATEGORY, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?)`;
	connection.query(query, [txtCategory, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting Expense Category', err);
			res.status(500).send('Error inserting Expense Category');
			return;
		}
		res.redirect('/expense_category');
	});
});

// GET EXPENSE CATEGORY
pageRouter.get('/expense_category_data', (req, res) => {
	connection.query('SELECT * FROM expense_category WHERE ACTIVE=1 ORDER BY CATEGORY ASC', (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// EDIT EXPENSE CATEGORY
pageRouter.put('/expense_category/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtCategory
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE expense_category SET  CATEGORY = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtCategory, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Expense category:', err);
			res.status(500).send('Error updating Expense category');
			return;
		}

		res.send('Expense category updated successfully');
	});
});


// DELETE EXPENSE CATEGORY
pageRouter.put('/expense_category/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE expense_category SET  ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Expense category:', err);
			res.status(500).send('Error updating Expense category');
			return;
		}

		res.send('Expense category updated successfully');
	});
});


// ADD TRASACTION TYPE
pageRouter.post('/add_transaction_type', (req, res) => {
	const {
		txtTransactionType
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO transaction_type(TRANSACTION, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?)`;
	connection.query(query, [txtTransactionType, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting Transaction Type', err);
			res.status(500).send('Error inserting Transaction Type');
			return;
		}
		res.redirect('/transaction_type');
	});
});

// GET TRASACTION TYPE
pageRouter.get('/transaction_type_data', (req, res) => {
	connection.query('SELECT * FROM transaction_type WHERE ACTIVE=1 ORDER BY TRANSACTION ASC', (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// EDIT TRASACTION TYPE
pageRouter.put('/transaction_type/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtTransactionType
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE transaction_type SET  TRANSACTION = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtTransactionType, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Transaction Type:', err);
			res.status(500).send('Error updating Transaction Type');
			return;
		}

		res.send('Transaction Type updated successfully');
	});
});


// DELETE TRASACTION TYPE
pageRouter.put('/transaction_type/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE transaction_type SET  ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Transaction Type:', err);
			res.status(500).send('Error updating Transaction Type');
			return;
		}

		res.send('Transaction Type updated successfully');
	});
});


// ADD CASH DENOMINATION
pageRouter.post('/add_cash', (req, res) => {
	const {
		txtDenomination
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO cash(DENOMINATION, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?)`;
	connection.query(query, [txtDenomination, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting cash', err);
			res.status(500).send('Error inserting cash');
			return;
		}
		res.redirect('/cash');
	});
});

// GET CASH DENOMINATION
pageRouter.get('/cash_data', (req, res) => {
	connection.query('SELECT * FROM cash WHERE ACTIVE=1 ORDER BY DENOMINATION ASC', (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// EDIT CASH DENOMINATION
pageRouter.put('/cash/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtDenomination,
		txtQTY
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE cash SET  DENOMINATION = ?, QTY = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtDenomination, txtQTY, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating cash:', err);
			res.status(500).send('Error updating cash');
			return;
		}

		res.send('cash updated successfully');
	});
});


// DELETE CASH DENOMINATION
pageRouter.put('/cash/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE cash SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating cash:', err);
			res.status(500).send('Error updating cash');
			return;
		}

		res.send('cash updated successfully');
	});
});


// ADD CASH CHIPS DENOMINATION
pageRouter.post('/add_cash_chips', (req, res) => {
	const {
		txtDenomination
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO cash_chips(DENOMINATION, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?)`;
	connection.query(query, [txtDenomination, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting cash', err);
			res.status(500).send('Error inserting cash');
			return;
		}
		res.redirect('/cash_chips');
	});
});

// GET CASH CHIPS DENOMINATION
pageRouter.get('/cash_chips_data', (req, res) => {
	connection.query('SELECT * FROM cash_chips WHERE ACTIVE=1 ORDER BY DENOMINATION ASC', (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// EDIT CASH CHIPS DENOMINATION
pageRouter.put('/cash_chips/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtDenomination,
		txtQTY
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE cash_chips SET  DENOMINATION = ?, QTY = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtDenomination, txtQTY, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating cash:', err);
			res.status(500).send('Error updating cash');
			return;
		}

		res.send('cash updated successfully');
	});
});


// DELETE CASH CHIPS DENOMINATION
pageRouter.put('/cash_chips/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE cash_chips SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating cash:', err);
			res.status(500).send('Error updating cash');
			return;
		}

		res.send('cash updated successfully');
	});
});


// ADD NON NEGOTIABLE DENOMINATION
pageRouter.post('/add_non_negotiable', (req, res) => {
	const {
		txtDenomination
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO non_negotiable(DENOMINATION, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?)`;
	connection.query(query, [txtDenomination, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting cash', err);
			res.status(500).send('Error inserting cash');
			return;
		}
		res.redirect('/non_negotiable_chips');
	});
});

// GET NON NEGOTIABLE DENOMINATION
pageRouter.get('/non_negotiable_data', (req, res) => {
	connection.query('SELECT * FROM non_negotiable WHERE ACTIVE=1 ORDER BY DENOMINATION ASC', (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// EDIT NON NEGOTIABLE DENOMINATION
pageRouter.put('/non_negotiable/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtDenomination,
		txtQTY
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE non_negotiable SET  DENOMINATION = ?, QTY = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtDenomination, txtQTY, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Non negotiable:', err);
			res.status(500).send('Error updating Non negotiable');
			return;
		}

		res.send('Non negotiable updated successfully');
	});
});


// DELETE NON NEGOTIABLE DENOMINATION
pageRouter.put('/non_negotiable/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE non_negotiable SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Non negotiable:', err);
			res.status(500).send('Error updating Non negotiable');
			return;
		}

		res.send('Non negotiable updated successfully');
	});
});



// ADD JUNKET CAPITAL 
pageRouter.post('/add_junket_capital', (req, res) => {
	const {

		txtFullname,
		txtAmount,
		Remarks,
		optWithdrawDeposit

	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO junket_capital(TRANSACTION_ID, FULLNAME, AMOUNT, REMARKS, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?)`;
	connection.query(query, [optWithdrawDeposit, txtFullname, txtAmount, Remarks, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting junket', err);
			res.status(500).send('Error inserting junket');
			return;
		}
		res.redirect('/capital');
	});
});

// GET JUNKET CAPITAL 
pageRouter.get('/junket_capital_data', (req, res) => {
	const query = `SELECT * FROM junket_capital WHERE junket_capital.ACTIVE=1 ORDER BY junket_capital.IDNo DESC`;
	connection.query(query, (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// EDIT JUNKET CAPITAL 
pageRouter.put('/junket_capital/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtTrans,
		txtCategory,
		txtFullname,
		txtDescription,
		txtAmount,
		Remarks
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE junket_capital SET FULLNAME = ?, AMOUNT = ?, REMARKS = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtFullname, txtAmount, Remarks, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Junket:', err);
			res.status(500).send('Error updating Junket');
			return;
		}

		res.send('Junket updated successfully');
	});
});


// DELETE JUNKET CAPITAL 
pageRouter.put('/junket_capital/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE junket_capital SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Junket:', err);
			res.status(500).send('Error updating Junket');
			return;
		}

		res.send('Junket updated successfully');
	});
});


// ADD JUNKET EXPENSE
pageRouter.post('/add_junket_house_expense', (req, res) => {
	const {
		txtCategory,
		txtReceiptNo,
		txtDateandTime,
		txtDescription,
		txtAmount,
		txtOfficerInCharge
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO junket_house_expense(CATEGORY_ID, RECEIPT_NO, DATE_TIME, DESCRIPTION, AMOUNT, OIC, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
	connection.query(query, [txtCategory, txtReceiptNo, txtDateandTime, txtDescription, txtAmount, txtOfficerInCharge, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting junket', err);
			res.status(500).send('Error inserting junket');
			return;
		}
		res.redirect('/house_expense');
	});
});

// GET JUNKET EXPENSE
pageRouter.get('/junket_house_expense_data', (req, res) => {
	const query = `SELECT *,junket_house_expense.IDNo AS expense_id, expense_category.IDNo AS expense_category_id, expense_category.CATEGORY as expense_category, agent.IDNo AS agent_id, agent.NAME AS agent_name
  FROM junket_house_expense 
  JOIN expense_category ON expense_category.IDNo = junket_house_expense.CATEGORY_ID
  JOIN agent ON agent.IDNo = junket_house_expense.OIC
  WHERE junket_house_expense.ACTIVE=1 ORDER BY junket_house_expense.IDNo DESC`;
	connection.query(query, (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// EDIT JUNKET EXPENSE
pageRouter.put('/junket_house_expense/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtCategory,
		txtReceiptNo,
		txtDateandTime,
		txtDescription,
		txtAmount,
		txtOfficerInCharge
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE junket_house_expense SET CATEGORY_ID = ?, RECEIPT_NO = ?, DATE_TIME = ?, DESCRIPTION = ?, AMOUNT = ?, OIC = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtCategory, txtReceiptNo, txtDateandTime, txtDescription, txtAmount, txtOfficerInCharge, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Junket:', err);
			res.status(500).send('Error updating Junket');
			return;
		}

		res.send('Junket updated successfully');
	});
});


// DELETE JUNKET EXPENSE
pageRouter.put('/junket_house_expense/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE junket_house_expense SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Junket:', err);
			res.status(500).send('Error updating Junket');
			return;
		}

		res.send('Junket updated successfully');
	});
});



// ADD JUNKET CREDIT
pageRouter.post('/add_junket_credit', (req, res) => {
	const {
		txtAccountCode,
		txtStatus,
		txtAmount,
		Remarks
	} = req.body;
	let date_now = new Date();
	const account = txtAccountCode.split('-');

	const query = `INSERT INTO junket_credit(ACCOUNT_ID, AMOUNT, REMARKS, STATUS_ID, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?)`;
	connection.query(query, [account[0], txtAmount, Remarks, txtStatus, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting junket', err);
			res.status(500).send('Error inserting junket');
			return;
		}
		res.redirect('/house_expense');
	});
});

// GET JUNKET CREDIT
pageRouter.get('/junket_credit_data', (req, res) => {
	const query = `SELECT *, junket_credit.IDNo AS credit_id, CONCAT(account.FIRSTNAME, ' ', account.MIDDLENAME, ' ', account.LASTNAME) AS account_name
  FROM junket_credit 
  JOIN account ON account.IDNo = junket_credit.ACCOUNT_ID
  JOIN agent ON agent.IDNo = account.AGENT_ID
  JOIN agency ON agency.IDNo = agent.AGENCY
  JOIN credit_status ON credit_status.IDNo = junket_credit.STATUS_ID
  WHERE junket_credit.ACTIVE=1 ORDER BY junket_credit.IDNo DESC`;
	connection.query(query, (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// EDIT JUNKET CREDIT
pageRouter.put('/junket_credit/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtStatus,
		txtAmount,
		Remarks,
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE junket_credit SET AMOUNT = ?, REMARKS = ?, STATUS_ID = ?,  EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtAmount, Remarks, txtStatus, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Junket:', err);
			res.status(500).send('Error updating Junket');
			return;
		}

		res.send('Junket updated successfully');
	});
});


// DELETE JUNKET CREDIT
pageRouter.put('/junket_credit/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE junket_credit SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Junket:', err);
			res.status(500).send('Error updating Junket');
			return;
		}

		res.send('Junket updated successfully');
	});
});



// ADD JUNKET CONCIERGE
pageRouter.post('/add_junket_concierge', (req, res) => {
	const {
		txtCategory,
		txtDateTime,
		txtDescription,
		txtTransaction,
		txtAmount
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO junket_concierge(CONCIERGE_ID, DATE_TIME, DESCRIPTION, TRANSACTION_ID, AMOUNT, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?)`;
	connection.query(query, [txtCategory, txtDateTime, txtDescription, txtTransaction, txtAmount, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting junket', err);
			res.status(500).send('Error inserting junket');
			return;
		}
		res.redirect('/house_expense');
	});
});

// GET JUNKET CONCIERGE
pageRouter.get('/junket_concierge_data', (req, res) => {
	const query = `SELECT *, junket_concierge.IDNo AS junket_concierge_id
  FROM junket_concierge 
  JOIN concierge_category ON concierge_category.IDNo = junket_concierge.CONCIERGE_ID
  JOIN transaction_type ON transaction_type.IDNo = junket_concierge.TRANSACTION_ID
  WHERE junket_concierge.ACTIVE=1 ORDER BY junket_concierge.IDNo DESC`;
	connection.query(query, (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// EDIT JUNKET CONCIERGE
pageRouter.put('/junket_concierge/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtCategory,
		txtDateTime,
		txtDescription,
		txtTransaction,
		txtAmount
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE junket_concierge SET CONCIERGE_ID = ?, DATE_TIME = ?, DESCRIPTION = ?, TRANSACTION_ID = ?, AMOUNT = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtCategory, txtDateTime, txtDescription, txtTransaction, txtAmount, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Junket:', err);
			res.status(500).send('Error updating Junket');
			return;
		}

		res.send('Junket updated successfully');
	});
});


// DELETE JUNKET CONCIERGE
pageRouter.put('/junket_concierge/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE junket_concierge SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Junket:', err);
			res.status(500).send('Error updating Junket');
			return;
		}

		res.send('Junket updated successfully');
	});
});



// ADD JUNKET CAGE
pageRouter.post('/add_junket_main_cage', (req, res) => {
	const {
		txtCategory,
		txtDateTime,
		txtTransaction,
		txtAmount
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO junket_main_cage(CAGE_ID, DATE_TIME, TRANSACTION_ID, AMOUNT, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?)`;
	connection.query(query, [txtCategory, txtDateTime, txtTransaction, txtAmount, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting junket', err);
			res.status(500).send('Error inserting junket');
			return;
		}
		res.redirect('/house_expense');
	});
});

// GET JUNKET CAGE
pageRouter.get('/junket_main_cage_data', (req, res) => {
	const query = `SELECT *, junket_main_cage.IDNo AS junket_cage_id
  FROM junket_main_cage 
  JOIN cage_category ON cage_category.IDNo = junket_main_cage.CAGE_ID
  JOIN transaction_type ON transaction_type.IDNo = junket_main_cage.TRANSACTION_ID
  WHERE junket_main_cage.ACTIVE=1 ORDER BY junket_main_cage.IDNo DESC`;
	connection.query(query, (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// EDIT JUNKET CAGE
pageRouter.put('/junket_main_cage/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtCategory,
		txtDateTime,
		txtTransaction,
		txtAmount
	} = req.body;
	let date_now = new Date();


	const query = `UPDATE junket_main_cage SET CAGE_ID = ?, DATE_TIME = ?, TRANSACTION_ID = ?, AMOUNT = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtCategory, txtDateTime, txtTransaction, txtAmount, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Junket:', err);
			res.status(500).send('Error updating Junket');
			return;
		}

		res.send('Junket updated successfully');
	});
});


// DELETE JUNKET CAGE
pageRouter.put('/junket_main_cage/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE junket_main_cage SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Junket:', err);
			res.status(500).send('Error updating Junket');
			return;
		}

		res.send('Junket updated successfully');
	});
});

// ADD ACCOUNT DETAILS
pageRouter.post('/add_account_details', (req, res) => {
	const {
		txtAccountId,
		txtTrans,
		txtAmount,
		txtRemarks
	} = req.body;
	let date_now = new Date();

	let txtAmountNum = txtAmount.split(',').join('');

	const query = `INSERT INTO  account_ledger(ACCOUNT_ID, TRANSACTION_ID, AMOUNT, REMARKS, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?)`;
	connection.query(query, [txtAccountId, txtTrans, txtAmountNum, txtRemarks, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting details', err);
			res.status(500).send('Error inserting details');
			return;
		}
		res.redirect('/account_ledger');
	});
});

// ADD ACCOUNT DETAILS TRANSFER
pageRouter.post('/add_account_details/transfer', (req, res) => {
	const {
		txtAccountId,
		txtAccount,
		txtAmount
	} = req.body;
	let date_now = new Date();

	let txtAmountNum = txtAmount.split(',').join('');

	const query = `INSERT INTO  account_ledger(ACCOUNT_ID, TRANSACTION_ID, AMOUNT, TRANSFER, TRANSFER_AGENT, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?)`;
	connection.query(query, [txtAccountId, 2, txtAmountNum, 1, txtAccount, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting details', err);
			res.status(500).send('Error inserting details');
			return;
		}
		const query1 = `INSERT INTO  account_ledger(ACCOUNT_ID, TRANSACTION_ID, AMOUNT, TRANSFER, TRANSFER_AGENT, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?)`;
		connection.query(query1, [txtAccount, 1, txtAmountNum, 1, txtAccountId, req.session.user_id, date_now], (err, result) => {
			res.redirect('/account_ledger');
		});
	});
});

// GET ACCOUNT DETAILS
pageRouter.get('/account_details_data/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const query = `SELECT *, account_ledger.IDNo AS account_details_id, account_ledger.ENCODED_DT AS encoded_date FROM account_ledger 
  JOIN transaction_type ON transaction_type.IDNo = account_ledger.TRANSACTION_ID
  WHERE account_ledger.ACTIVE=1 AND account_ledger.ACCOUNT_ID= ? ORDER BY account_ledger.IDNo DESC`;
	connection.query(query, [id], (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// DELETE ACCOUNT DETAILS
pageRouter.put('/account_details/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE account_ledger SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating Details:', err);
			res.status(500).send('Error updating Details');
			return;
		}

		res.send('Details updated successfully');
	});
});

// ADD GAME LIST
pageRouter.post('/add_game_list', (req, res) => {
	const {
		txtAccountCode,
		txtChips,
		txtGameNo,
		txtAmount,
		txtNN,
		txtCC,
		txtTransType,
		txtCommisionType,
		txtCommisionRate
	} = req.body;
	let date_now = new Date();

	let txtNNamount = txtNN.split(',').join("");
	let txtCCamount = txtCC.split(',').join("");

	if (txtNNamount == '') {
		txtNNamount = 0;
	}

	if (txtCCamount == '') {
		txtCCamount = 0;
	}

	const query = `INSERT INTO  game_list(ACCOUNT_ID, GAME_NO, WORKING_CHIPS, COMMISSION_TYPE, COMMISSION_PERCENTAGE, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?)`;
	connection.query(query, [txtAccountCode, txtGameNo, txtChips, txtCommisionType, txtCommisionRate, req.session.user_id, date_now], (err, result) => {

		const query2 = `INSERT INTO  game_record(GAME_ID, TRADING_DATE, CAGE_TYPE, AMOUNT, NN_CHIPS, CC_CHIPS, TRANSACTION, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
		connection.query(query2, [result.insertId, date_now, 1, 0, txtNNamount, txtCCamount, txtTransType, req.session.user_id, date_now], (err, result2) => {

			const query3 = `INSERT INTO  game_record(GAME_ID, TRADING_DATE, CAGE_TYPE, AMOUNT, NN_CHIPS, CC_CHIPS, TRANSACTION, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
			connection.query(query3, [result.insertId, date_now, 3, 0, txtNNamount, txtCCamount, txtTransType, req.session.user_id, date_now], (err, result3) => {

				if (txtTransType == 2) {
					const query4 = `INSERT INTO  account_ledger(ACCOUNT_ID, TRANSACTION_ID, AMOUNT, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?)`;
					connection.query(query4, [txtAccountCode, 2, parseFloat(txtNNamount) + parseFloat(txtCCamount), req.session.user_id, date_now], (err, result3) => {

						if (err) {
							console.error('Error inserting details', err);
							res.status(500).send('Error inserting details');
							return;
						}
						res.redirect('/game_list');
					});
				} else {
					if (err) {
						console.error('Error inserting details', err);
						res.status(500).send('Error inserting details');
						return;
					}
					res.redirect('/game_list');
				}
			});
		});
	});
});

// GET GAME LIST
pageRouter.get('/game_list_data', (req, res) => {
	const query = `SELECT *, game_list.IDNo AS game_list_id, game_list.ACTIVE AS game_status, account.IDNo AS account_no, agent.AGENT_CODE AS agent_code, agent.NAME AS agent_name FROM game_list 
	JOIN account ON game_list.ACCOUNT_ID = account.IDNo
	JOIN agent ON agent.IDNo = account.AGENT_ID
	JOIN agency ON agency.IDNo = agent.AGENCY
  	WHERE game_list.ACTIVE != 0 ORDER BY game_list.IDNo ASC`;
	connection.query(query, (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

pageRouter.get('/game_list/:id/record', (req, res) => {
	const id = parseInt(req.params.id);
	const query = `SELECT AMOUNT,NN_CHIPS,CC_CHIPS, CAGE_TYPE FROM game_record 
  	WHERE ACTIVE != 0 AND GAME_ID = ? ORDER BY IDNo ASC`;
	connection.query(query, [id], (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});


// DELETE GAME LIST
pageRouter.put('/game_list/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE game_list SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating GAME LIST:', err);
			res.status(500).send('Error updating GAME LIST');
			return;
		}

		res.send('GAME LIST updated successfully');
	});
});

// STATUS GAME LIST
pageRouter.put('/game_list/change_status/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const {
		txtStatus,
		txtAccountCode,
		txtAmount
	} = req.body;

	const query = `UPDATE game_list SET ACTIVE = ?, GAME_ENDED = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtStatus, date_now, req.session.user_id, date_now, id], (err, result) => {

		if (txtStatus == 1) {
			const query2 = `INSERT INTO  account_ledger(ACCOUNT_ID, TRANSACTION_ID, AMOUNT, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?)`;
			connection.query(query2, [txtAccountCode, 1, txtAmount, req.session.user_id, date_now], (err, result3) => {});

			if (err) {
				console.error('Error updating GAME LIST:', err);
				res.status(500).send('Error updating GAME LIST');
				return;
			}

			res.send('GAME LIST STATUS updated successfully');
		} else {
			const query2 = `UPDATE account_ledger SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE ACCOUNT_ID = ? AND AMOUNT = ?`;
			connection.query(query2, [0, req.session.user_id, date_now, txtAccountCode, txtAmount], (err, result3) => {});

			if (err) {
				console.error('Error updating GAME LIST:', err);
				res.status(500).send('Error updating GAME LIST');
				return;
			}

			res.send('GAME LIST STATUS updated successfully');
		}


	});
});

// EDIT GAME LIST COMMISSION
pageRouter.put('/game_list/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const {
		txtExpense,
		txtActualAgent,
		txtRemarks,
		txtCashier,
		txtManager
	} = req.body;

	let date_now = new Date();

	const query = `UPDATE game_list SET EXPENSE = ?, ACTUAL_TO_AGENT = ?, REMARKS = ?, CASHIER = ?, MANAGER = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [txtExpense, txtActualAgent, txtRemarks, txtCashier, txtManager, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating GAME LIST:', err);
			res.status(500).send('Error updating GAME LIST');
			return;
		}

		res.send('GAME LIST updated successfully');
	});
});

// ADD GAME RECORD
pageRouter.post('/add_game_record', (req, res) => {
	const {
		game_id,
		txtTradingDate,
		txtCategory,
		txtAmount,
		txtRemarks
	} = req.body;
	let date_now = new Date();

	const query = `INSERT INTO  game_record(GAME_ID, TRADING_DATE, CAGE_TYPE, AMOUNT,REMARKS, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?,?, ?)`;
	connection.query(query, [game_id, date_now, txtCategory, txtAmount, txtRemarks, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting details', err);
			res.status(500).send('Error inserting details');
			return;
		}
		res.redirect('/game_record/' + game_id);
	});
});

// ADD GAME RECORD BUYIN
pageRouter.post('/game_list/add/buyin', (req, res) => {
	const {
		game_id,
		// txtAmount,
		txtAccountCode,
		txtTransType,
		txtNN,
		txtCC
	} = req.body;
	let date_now = new Date();

	let txtNNamount = txtNN.split(',').join("");
	let txtCCamount = txtCC.split(',').join("");

	if (txtNNamount == '') {
		txtNNamount = 0;
	}

	if (txtCCamount == '') {
		txtCCamount = 0;
	}

	const query = `INSERT INTO  game_record(GAME_ID, TRADING_DATE, CAGE_TYPE, AMOUNT, NN_CHIPS, CC_CHIPS, TRANSACTION, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
	connection.query(query, [game_id, date_now, 1, 0, txtNNamount, txtCCamount, txtTransType, req.session.user_id, date_now], (err, result) => {

		const query2 = `INSERT INTO  game_record(GAME_ID, TRADING_DATE, CAGE_TYPE, AMOUNT, NN_CHIPS, CC_CHIPS, TRANSACTION, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
		connection.query(query2, [game_id, date_now, 3, 0, txtNNamount, txtCCamount, txtTransType, req.session.user_id, date_now], (err, result2) => {
			if (txtTransType == 2) {
				const query3 = `INSERT INTO  account_ledger(ACCOUNT_ID, TRANSACTION_ID, AMOUNT, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?)`;
				connection.query(query3, [txtAccountCode, 2, parseFloat(txtNNamount) + parseFloat(txtCCamount), req.session.user_id, date_now], (err, result3) => {

					if (err) {
						console.error('Error inserting details', err);
						res.status(500).send('Error inserting details');
						return;
					}
					res.redirect('/game_list');
				});
			} else {
				if (err) {
					console.error('Error inserting details', err);
					res.status(500).send('Error inserting details');
					return;
				}
				res.redirect('/game_list');
			}

		});
	});
});

// ADD GAME RECORD CASH OUT
pageRouter.post('/game_list/add/cashout', (req, res) => {
	const {
		game_id,
		// txtAmount,
		txtAccountCode,
		txtTransType,
		txtNN,
		txtCC
	} = req.body;
	let date_now = new Date();

	let txtNNamount = txtNN.split(',').join("");
	let txtCCamount = txtCC.split(',').join("");

	if (txtNNamount == '') {
		txtNNamount = 0;
	}

	if (txtCCamount == '') {
		txtCCamount = 0;
	}

	const query = `INSERT INTO  game_record(GAME_ID, TRADING_DATE, CAGE_TYPE, AMOUNT, NN_CHIPS, CC_CHIPS,TRANSACTION, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
	connection.query(query, [game_id, date_now, 2, 0, txtNNamount, txtCCamount, txtTransType, req.session.user_id, date_now], (err, result) => {

		const query2 = `INSERT INTO  account_ledger(ACCOUNT_ID, TRANSACTION_ID, AMOUNT, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?)`;
		connection.query(query2, [txtAccountCode, 1, parseFloat(txtNNamount) + parseFloat(txtCCamount), req.session.user_id, date_now], (err, result3) => {
			if (err) {
				console.error('Error inserting details', err);
				res.status(500).send('Error inserting details');
				return;
			}
			res.redirect('/game_list');
		});
	});
});

// ADD GAME RECORD ROLLING
pageRouter.post('/game_list/add/rolling', (req, res) => {
	const {
		game_id,
		txtAmount,
		txtNN,
		txtCC
	} = req.body;
	let date_now = new Date();

	let txtAmountNum = txtAmount.split(',').join("");
	let txtNNamount = txtNN.split(',').join("");
	let txtCCamount = txtCC.split(',').join("");

	const query = `INSERT INTO  game_record(GAME_ID, TRADING_DATE, CAGE_TYPE, AMOUNT, NN_CHIPS, CC_CHIPS, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
	connection.query(query, [game_id, date_now, 4, txtAmountNum, txtNNamount, txtCCamount, req.session.user_id, date_now], (err, result) => {
		if (err) {
			console.error('Error inserting details', err);
			res.status(500).send('Error inserting details');
			return;
		}
		res.redirect('/game_list');
	});
});

// GET GAME RECORD
pageRouter.get('/game_record_data/:id', (req, res) => {
	const id = parseInt(req.params.id);
	const query = `SELECT *, game_record.IDNo AS game_record_id, game_record.ENCODED_DT AS record_date FROM game_record 
	JOIN cage_category ON game_record.CAGE_TYPE = cage_category.IDNo
  	WHERE game_record.ACTIVE != 0 AND game_record.GAME_ID = ? ORDER BY game_record.IDNo ASC`;
	connection.query(query, [id], (error, result, fields) => {
		if (error) {
			console.error('Error fetching data:', error);
			res.status(500).send('Error fetching data');
			return;
		}
		res.json(result);
	});
});

// DELETE GAME RECORD
pageRouter.put('/game_record/remove/:id', (req, res) => {
	const id = parseInt(req.params.id);
	let date_now = new Date();

	const query = `UPDATE game_record SET ACTIVE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
	connection.query(query, [0, req.session.user_id, date_now, id], (err, result) => {
		if (err) {
			console.error('Error updating GAME LIST:', err);
			res.status(500).send('Error updating GAME LIST');
			return;
		}

		res.send('GAME LIST updated successfully');
	});
});

//EXPORT ACCOUNT DETAILS

const dbConfig = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'cagex'
};

pageRouter.get('/export', async (req, res) => {
	const accountId = req.query.id; // Assuming `id` is passed as a query parameter
	let connection;

	try {
		// Create a connection to the database
		connection = await mysql2.createConnection(dbConfig);

		// Perform the query
		const [rows] = await connection.query(`
		SELECT 
		  account_ledger.ENCODED_DT, 
		  transaction_type.TRANSACTION, 
		  account_ledger.AMOUNT, 
		  account_ledger.REMARKS  
		FROM account_ledger 
		JOIN transaction_type ON transaction_type.IDNo = account_ledger.TRANSACTION_ID
		WHERE account_ledger.ACTIVE=1 AND account_ledger.ACCOUNT_ID= ? 
		ORDER BY account_ledger.IDNo DESC`, [accountId]);

		// Create a new workbook and worksheet
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Data');

		// Define the columns
		worksheet.columns = [{
				header: 'Date',
				key: 'ENCODED_DT',
				width: 20
			},
			{
				header: 'Transaction',
				key: 'TRANSACTION',
				width: 30
			},
			{
				header: 'Amount',
				key: 'AMOUNT',
				width: 15
			},
			{
				header: 'Remarks',
				key: 'REMARKS',
				width: 30
			},
		];

		// Add rows from the database query
		rows.forEach(row => {
			worksheet.addRow(row);
		});

		// Write the workbook to a buffer
		const buffer = await workbook.xlsx.writeBuffer();

		const query1 = `SELECT NAME, AGENT_CODE FROM agent
	  JOIN account ON account.AGENT_ID = agent.IDNo
	  WHERE account.IDNo = ?`;

		let filename = 'Account Details - ';

		const agents = await connection.query(`
		SELECT NAME, AGENT_CODE FROM agent
	  JOIN account ON account.AGENT_ID = agent.IDNo
	  WHERE account.IDNo = ?`, [accountId]);

		if (agents) {
			const agent = agents[0];

			filename = 'Account Details - ' + agent[0].NAME + '(' + agent[0].AGENT_CODE + ')';
		}

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', 'attachment; filename=' + filename + '.xlsx');

		res.send(buffer);
	} catch (error) {
		console.error('Error exporting data:', error);
		res.status(500).send('Error exporting data');
	} finally {
		// Close the database connection if it was established
		if (connection) {
			try {
				await connection.end();
			} catch (err) {
				console.error('Error closing the connection:', err);
			}
		}
	}
});

module.exports = pageRouter;