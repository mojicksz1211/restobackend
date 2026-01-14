# 📁 File Structure Documentation

## Restaurant Management System - MVC Pattern

### 📂 Project Structure

```
restaurant/
├── app.js                          # Main application entry point
├── package.json                    # Dependencies
│
├── config/                         # Configuration files
│   └── db.js                       # Database connection
│
├── models/                         # Database Layer (Models)
│   ├── categoryModel.js            # Category database operations
│   ├── menuModel.js                # Menu database operations
│   ├── menuModel.js                # Menu database operations
│   └── tableModel.js               # Restaurant table database operations
│
├── controllers/                    # Business Logic Layer (Controllers)
│   ├── apiController.js            # Public API controller
│   ├── categoryController.js       # Category business logic
│   ├── menuController.js           # Menu business logic
│   ├── menuController.js           # Menu business logic
│   └── tableController.js          # Restaurant table business logic
│
├── routes/                         # Routing Layer (Routes)
│   ├── apiRoutes.js               # Public API routes
│   ├── authRoutes.js              # Authentication routes
│   ├── categoryRoutes.js          # Category routes
│   ├── dashboardRoutes.js         # Dashboard routes
│   ├── index.js                   # Route aggregator (alphabetical order)
│   ├── menuRoutes.js              # Menu routes
│   ├── menuRoutes.js              # Menu routes
│   └── tableRoutes.js             # Restaurant table routes
│
├── views/                          # View Layer (EJS Templates)
│   ├── category/
│   │   └── manageCategory.ejs      # Category management page
│   ├── menu/
│   │   └── manageMenu.ejs          # Menu management page
│   ├── table/
│   │   └── manageTable.ejs            # Restaurant table management page
│   ├── user_accounts/
│   │   ├── manageUsers.ejs         # User management page
│   │   └── userRoles.ejs          # User role management page
│   ├── modals/
│   │   ├── category/
│   │   │   ├── edit_category.ejs  # Edit category modal
│   │   │   └── new_category.ejs   # New category modal
│   │   ├── menu/
│   │   │   ├── editMenu.ejs            # Edit menu modal
│   │   │   └── newMenu.ejs             # New menu modal
│   │   ├── table/
│   │   │   ├── editTable.ejs           # Edit table modal
│   │   │   └── newTable.ejs            # New table modal
│   │   └── user_accounts/
│   │       ├── editUserAccount.ejs     # Edit user account modal
│   │       ├── editUserRole.ejs        # Edit user role modal
│   │       ├── newUserAccount.ejs      # New user account modal
│   │       └── newUserRole.ejs         # New user role modal
│   └── partials/                  # Reusable partials
│       ├── footer.ejs
│       ├── header.ejs
│       ├── loader.ejs
│       ├── sidebar.ejs
│       └── topbar.ejs
│
└── public/                         # Static files
    └── assets/
        └── js/
            └── functions/
                ├── common.js                    # Common JavaScript functions
                ├── manageCategory.js            # Category JavaScript functions
                ├── manageMenu.js                # Menu JavaScript functions
                ├── manageTable.js               # Restaurant table JavaScript functions
                ├── manageUsers.js               # User JavaScript functions
                ├── userRoles.js                 # User role JavaScript functions
                └── reset.js                      # Reset JavaScript functions
```

---

## 🔄 MVC Flow

```
Request → Routes → Controllers → Models → Database
                ↓
              Views (Response)
```

### Example Flow: Create Menu

1. **Route** (`routes/menuRoutes.js`)
   ```javascript
   router.post("/menu", checkSession, MenuController.create);
   ```

2. **Controller** (`controllers/menuController.js`)
   ```javascript
   static async create(req, res) {
       // Business logic & validation
       const menuId = await MenuModel.create({...});
   }
   ```

3. **Model** (`models/menuModel.js`)
   ```javascript
   static async create(data) {
       // Database operation
       const [result] = await pool.execute(query, [...]);
   }
   ```

---

## 📋 File Organization Rules

### 1. **Alphabetical Order**
- All files in each folder are organized alphabetically
- Routes in `routes/index.js` are imported alphabetically

### 2. **Naming Convention**
- **Models**: `[name]Model.js` (e.g., `menuModel.js`)
- **Controllers**: `[name]Controller.js` (e.g., `menuController.js`)
- **Routes**: `[name]Routes.js` (e.g., `menuRoutes.js`)
- **Views**: `[name]/manage_[name].ejs` (e.g., `menu/manage_menu.ejs`)
- **JavaScript**: `[name].js` (e.g., `manageMenu.js`)

### 3. **File Structure Pattern**
Each feature follows this pattern:
```
models/[name]Model.js           → Database operations
controllers/[name]Controller.js → Business logic
routes/[name]Routes.js          → Routing
views/[name]/manage_[name].ejs  → Main view
views/modals/[name]/
  ├── new_[name].ejs            → Create modal
  └── edit_[name].ejs           → Edit modal
public/assets/js/functions/
  └── [name].js                 → Client-side logic
```

---

## ✅ Current Features

### 1. **Category Management**
- ✅ Model: `models/categoryModel.js`
- ✅ Controller: `controllers/categoryController.js`
- ✅ Route: `routes/categoryRoutes.js`
- ✅ View: `views/category/manage_category.ejs`
- ✅ Modals: `views/modals/category/`
- ✅ JavaScript: `public/assets/js/functions/manageCategory.js`

### 2. **Menu Management**
- ✅ Model: `models/menuModel.js`
- ✅ Controller: `controllers/menuController.js`
- ✅ Route: `routes/menuRoutes.js`
- ✅ View: `views/menu/manageMenu.ejs`
- ✅ Modals: `views/modals/menu/`
- ✅ JavaScript: `public/assets/js/functions/manageMenu.js`

---

## 📝 Adding New Features

When adding a new feature (e.g., "Order"):

1. **Create Model**: `models/orderModel.js`
2. **Create Controller**: `controllers/orderController.js`
3. **Create Route**: `routes/orderRoutes.js`
4. **Add to routes/index.js**: `require('./order')`
5. **Create View**: `views/order/manage_order.ejs`
6. **Create Modals**: `views/modals/order/new_order.ejs`, `edit_order.ejs`
7. **Create JavaScript**: `public/assets/js/functions/manage_order.js`
8. **Update Sidebar**: Add link in `views/partials/sidebar.ejs`

---

## 🎯 Best Practices

1. **Separation of Concerns**
   - Models: Only database operations
   - Controllers: Business logic & validation
   - Routes: Only routing

2. **Consistent Naming**
   - Use singular form for models/controllers
   - Use plural for routes/views when appropriate

3. **File Comments**
   - Each file has header comments with description
   - Sections are clearly marked

4. **Alphabetical Organization**
   - Keep files in alphabetical order
   - Makes it easier to find files

---

**Last Updated**: 2026-01-13

