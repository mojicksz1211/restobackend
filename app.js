const express = require('express');
const path = require('path');
const pageRouter = require('./routes/routes');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));


// const connection=mysql.createConnection({
//   host:'localhost',
//   user:'root',
//   password:'',
//   database:'cagex'
// });

// connection.connect((error) => {
//   if (error) {
//     console.error('Error connecting to MySQL Server: ', error);
//   } else {
//     console.log('Connected to MySQL Database!');
//   }
// })

app.use(express.static(__dirname + "/public"));

app.set('port', process.env.PORT || 3000);

app.set('views', path.join (__dirname, 'views'));
app.set("view engine", "ejs");

app.use(pageRouter);

app.listen(app.get('port'), function () {
  console.log('Server started on port ' + app.get('port'));
})