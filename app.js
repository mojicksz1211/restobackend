const express = require('express');
const app = express();
const path = require('path');
const pageRouter = require('./routes/routes');
// const route = require('./routes/routes');

app.use(express.static(__dirname + "/public"));

app.set('port', process.env.PORT || 3000);

app.set('views', path.join (__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(pageRouter);

app.listen(app.get('port'), function () {
  console.log('Server started on port ' + app.get('port'));
})