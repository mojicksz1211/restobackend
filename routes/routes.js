const express = require('express');
const pageRouter = express.Router();
const path = require('path');

pageRouter.get('/', function (req, res) {
  console.log('Listing on port 3000');
  res.render('dashboard');
});

module.exports = pageRouter;

// module.exports = function (route) {
//     route.use((req, res, next) => {
//         // var uemail = req.session.useremail;
//         const allowUrls = ["/dashboard"];
//         if (allowUrls.indexOf(req.path) !== -1) {
//             // if (uemail != null && uemail != undefined) {
//                 return res.redirect('/');
//             // }

//         } else  {
//             return res.redirect('/login');
//         }
//         next();
//     })
    
//     route.get('/dashboard', (req, res, next)=>{
//         res.render('dashboard', {layout: layout});
//     })
// }