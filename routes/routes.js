const express = require('express');
const pageRouter = express.Router();
const path = require('path');



// module.exports = function(pageRouter) {
//     pageRouter.use((req, res, next) => {
//         const allowUrls = ['/login'];
//         if (allowUrls.indexOf(req.path) !==1) {
//             return res.redirect('/');
//         }
//         next();
//     })

//     pageRouter.get ('/', (req, res, next) => {
//         res.render('login');
//     })

//     pageRouter.get('/login', (req, res, next) => {
//         res.render('login');
//     })

//     pageRouter.get("/dashboard", (req, res, next) => {
//       res.render("login");
//     });  
// }




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

pageRouter.get("/manage_users", function (req, res) {
  res.render("user_accounts/manage_users");
});


module.exports = pageRouter;
