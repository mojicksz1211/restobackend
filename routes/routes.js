const express = require('express');
const pageRouter = express.Router();
const path = require('path');
const crypto = require('crypto');

const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cagex'
});

function generateMD5(input) {
  return crypto.createHash('md5').update(input).digest('hex');
}

pageRouter.get("/", function (req, res) {
  res.render("login");
});

pageRouter.get("/login", function (req, res) {
  res.render("login");
});

pageRouter.get("/dashboard", function (req, res) {
  res.render("dashboard");
});

pageRouter.get("/agency", function (req, res) {
  res.render("accounts/agency");
});

pageRouter.get("/agent", function (req, res) {
  res.render("accounts/agent");
});

pageRouter.get("/account_ledger", function (req, res) {
  res.render("accounts/account_ledger");
});


//=============== JUNKET =============
pageRouter.get("/capital", function (req, res) {
  res.render("junket/capital");
});

pageRouter.get("/house_expense", function (req, res) {
  res.render("junket/house_expense");
});

pageRouter.get("/credit", function (req, res) {
  res.render("junket/credit");
});

pageRouter.get("/concierge", function (req, res) {
  res.render("junket/concierge");
});

pageRouter.get("/main_cage", function (req, res) {
  res.render("junket/main_cage");
});

//========== USER ACCOUNTS ================
pageRouter.get("/user_roles", function (req, res) {
  res.render("user_accounts/user_roles");
});

pageRouter.get("/manage_users", function (req, res) {
  res.render("user_accounts/manage_users");
});


//============= POP UPS ====================
pageRouter.get("/cage_category", function (req, res) {
  res.render("popups/cage_category");
});


//Add User Role
pageRouter.post('/add_user_role', (req, res) => {
  const { role } = req.body;
  let date_now = new Date();

  const query = `INSERT INTO user_role (ROLE, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?)`;
  connection.query(query, [role, 1, date_now], (err, result) => {
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
  const { role } = req.body;
  let date_now = new Date();

  const query = `UPDATE user_role SET ROLE = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
  connection.query(query, [role, 1, date_now, id], (err, result) => {
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
  connection.query(query, [0, 1, date_now, id], (err, result) => {
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
  const { txtFirstName, txtLastName, txtUserName, txtPassword, txtPassword2, user_role, salt } = req.body;
  let date_now = new Date();

  if (txtPassword != txtPassword2) {
    res.status(500).json({ error: 'password' });
  } else {
    const generated_pw = generateMD5(salt + txtPassword);
    const query = `INSERT INTO user_info (FIRSTNAME, LASTNAME, USERNAME, PASSWORD, SALT, PERMISSIONS, LAST_LOGIN, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    connection.query(query, [txtFirstName, txtLastName, txtUserName, generated_pw, salt, user_role, date_now, 1, date_now], (err, result) => {
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
  const { txtFirstName, txtLastName, txtUserName, user_role } = req.body;
  let date_now = new Date();

  const query = `UPDATE user_info SET FIRSTNAME = ?, LASTNAME = ?, USERNAME = ?, PERMISSIONS = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
  connection.query(query, [txtFirstName, txtLastName, txtUserName, user_role, 1, date_now, id], (err, result) => {
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
  connection.query(query, [0, 1, date_now, id], (err, result) => {
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
  const { txtAgencyCode, txtAgency } = req.body;
  let date_now = new Date();

  const query = `INSERT INTO agency (CODE, AGENCY, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?)`;
  connection.query(query, [txtAgencyCode, txtAgency, 1, date_now], (err, result) => {
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
  const { txtAgencyCode, txtAgency } = req.body;
  let date_now = new Date();

  const query = `UPDATE agency SET CODE = ?, AGENCY = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
  connection.query(query, [txtAgencyCode, txtAgency, 1, date_now, id], (err, result) => {
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
  connection.query(query, [0, 1, date_now, id], (err, result) => {
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
  const { txtAgencyLine, txtAgenctCode, txtFirstname, txtMiddleName, txtLastname, txtContact } = req.body;
  let date_now = new Date();

  const agency = txtAgencyLine.split('-');
  const query = `INSERT INTO agent (AGENCY, AGENT_CODE, FIRSTNAME, MIDDLENAME, LASTNAME, CONTACTNo, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  connection.query(query, [agency[0], txtAgenctCode, txtFirstname, txtMiddleName, txtLastname, txtContact, 1, date_now], (err, result) => {
    if (err) {
      console.error('Error inserting agent:', err);
      res.status(500).send('Error inserting agent');
      return;
    }

    res.redirect('/agent');
  });
});

//GET AGENT
pageRouter.get('/agent_data', (req, res) => {
  connection.query('SELECT *, agency.CODE AS agency_code, agency.AGENCY AS agency_name, agency.IDNo AS agency_id, agent.AGENT_CODE AS agent_code, agent.IDNo AS agent_id, agent.ACTIVE as active FROM agent JOIN agency ON agent.AGENCY = agency.IDNo WHERE agent.ACTIVE = 1', (error, results, fields) => {
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
  const { txtAgencyLine, txtAgenctCode, txtFirstname, txtMiddleName, txtLastname, txtContact } = req.body;
  let date_now = new Date();

  const agency = txtAgencyLine.split('-');
  const account_code = agency[1] + '-' + txtAgenctCode;

  const query = `UPDATE agent SET  AGENCY = ?, AGENT_CODE = ?, FIRSTNAME = ?, MIDDLENAME = ?, LASTNAME = ?, CONTACTNo = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
  connection.query(query, [agency[0], txtAgenctCode, txtFirstname, txtMiddleName, txtLastname, txtContact, 1, date_now, id], (err, result) => {
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
  const { agent_id, txtGuestNo, txtFirstname, txtMiddlename, txtLastname, txtMembershipNo } = req.body;
  let date_now = new Date();

  const query = `INSERT INTO account (AGENT_ID, GUESTNo, FIRSTNAME, MIDDLENAME, LASTNAME, MEMBERSHIPNo, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  connection.query(query, [agent_id, txtGuestNo, txtFirstname, txtMiddlename, txtLastname, txtMembershipNo, 1, date_now], (err, result) => {
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
  const query = `SELECT *, account.FIRSTNAME AS account_firstname, account.MIDDLENAME AS account_middlename, account.LASTNAME AS account_lastname, agency.AGENCY AS agency_name, agency.CODE AS agency_code, account.IDNo AS account_id, agent.AGENT_CODE AS agent_code, account.ACTIVE as active,  CONCAT_WS(" ", agent.FIRSTNAME,  agent.MIDDLENAME, agent.LASTNAME) AS agent_name
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
  const { agent_id, txtGuestNo, txtFirstname, txtMiddlename, txtLastname, txtMembershipNo } = req.body;
  let date_now = new Date();


  const query = `UPDATE account SET  AGENT_ID = ?, GUESTNo = ?, FIRSTNAME = ?, MIDDLENAME = ?, LASTNAME = ?, MEMBERSHIPNo = ?, EDITED_BY = ?, EDITED_DT = ? WHERE IDNo = ?`;
  connection.query(query, [agent_id, txtGuestNo, txtFirstname, txtMiddlename, txtLastname, txtMembershipNo, 1, date_now, id], (err, result) => {
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
  connection.query(query, [0, 1, date_now, id], (err, result) => {
    if (err) {
      console.error('Error updating agency:', err);
      res.status(500).send('Error updating agency');
      return;
    }

    res.send('Agency updated successfully');
  });
});


// ================================================= POP UPS ===================================================

// ================== ADD CAGE CATEGORY ========================

pageRouter.post('/add_cage_category', (req, res) => {
  const { txtCategory } = req.body;
  let date_now = new Date();

  const query = `INSERT INTO cage_category(CATEGORY, ENCODED_BY, ENCODED_DT) VALUES (?, ?, ?)`;
  connection.query(query, [txtCategory, 1, date_now], (err, result) => {
    if (err) {
      console.error('Error inserting Cage Category', err);
      res.status(500).send('Error inserting Cage Category');
      return;
    }
    res.redirect('/cage_category');
  });
});

// ================= GET CAGE CATEGORY ==========================
pageRouter.get('/cage_category_data', (res, req) => {
  connection.query('SELECT * FROM cage_category WHERE cage_category.ACTIVE=1 ORDER BY CATEGORY ASC', (error, result, fields) => {
    if (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Error fetching data');
      return;
    }
    res.json(result);
  });
});

module.exports = pageRouter;
