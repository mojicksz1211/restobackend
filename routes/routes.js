const express = require('express');
const pageRouter = express.Router();
const path = require('path');


module.exports = function(pageRouter) {
    pageRouter.get ('/', (req, res, next) => {
        res.render('login');
    })

    pageRouter.get('/login', (req, res, next) => {
        res.render('login');
    })

    pageRouter.get("/dashboard", (req, res, next) => {
      res.render("login");
    });  
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
  res.render("agency");
});

module.exports = pageRouter;
