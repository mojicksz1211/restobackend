const express = require('express');
const path = require('path');
const routes = require('./routes');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const i18n = require('i18n');
require('dotenv').config();

// Telegram bot removed - not needed for template
// const { startTelegramBot } = require('./utils/telegram');
// startTelegramBot(); // run once when server starts

const compression = require('compression');
const app = express();
app.use(compression());

// i18n configuration
i18n.configure({
  locales: ['en', 'ko', 'ja', 'zh'], // Supported languages including Chinese
  directory: path.join(__dirname, 'locales'), // Directory where translation files are stored
  defaultLocale: 'en', // Default language
  cookie: 'lang', // Store language preference in a cookie
  queryParameter: 'lang', // Allow the language to be passed in the query string
  autoReload: true, // Automatically reload translation files when changed
  syncFiles: true, // Sync translation files with the current configuration
  objectNotation: true // Use object notation to access translations
});

// Middleware setup
app.use(cookieParser());
app.use(i18n.init);

// Middleware to set the language for each request
app.use((req, res, next) => {
  const lang = req.cookies.lang || 'en'; // Default to English if no language cookie is set
  i18n.setLocale(req, lang); // Set the language for the current request
  res.locals.currentLang = lang; // Make the current language available in the view templates
  next();
});

// Body parser middleware for handling form submissions
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS middleware for static files (images, etc.)
app.use((req, res, next) => {
  // Add CORS headers for all requests (including static files)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Static file serving with cache headers
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y', // Cache for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set proper Content-Type for WebP images
    if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
    // Cache images aggressively
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Serve uploaded images with CORS and cache headers
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set proper Content-Type for WebP images
    if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
    // Cache images aggressively
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  }
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  }
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});


app.use(passport.initialize());
app.use(passport.session());

// Set the view engine and routes
app.set('port', process.env.PORT || 4004);
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");

// Serve static files (images, CSS, JS, etc.)
app.use('/login/images/flags', express.static(path.join(__dirname, 'public/login/images/flags')));

// Language switch route
app.get('/change-lang', (req, res) => {
  const lang = req.query.lang;
  if (['en', 'ko', 'ja', 'zh'].includes(lang)) {
    res.cookie('lang', lang); // Set the selected language in the cookie
    i18n.setLocale(req, lang); // Apply language immediately after cookie update
  }
  res.redirect('back'); // Redirect back to the previous page
});

// CORS middleware for API endpoints (for Android app)
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Register API routes with /api prefix (public endpoints for Android app)
app.use('/api', require('./routes/apiRoutes'));

// Register other routes
routes.forEach(router => app.use('/', router));

// Start the server
app.listen(app.get('port'), function () {
  console.log('Server started on port ' + app.get('port'));
});
