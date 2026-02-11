# 🍽️ Restaurant Management System - Complete API Documentation

## 📋 Table of Contents

1. [Base Information](#base-information)
2. [Authentication](#authentication)
3. [Mobile/Tablet API Endpoints](#mobiletablet-api-endpoints)
4. [Web Admin API Endpoints](#web-admin-api-endpoints)
5. [Response Format](#response-format)
6. [Error Handling](#error-handling)

---

## Base Information

### Base URL
```
http://your-server-url:4004
```

### API Base URL (Mobile/Tablet)
```
http://your-server-url:4004/api
```

### Authentication Methods
- **JWT (Bearer Token)** - For mobile/tablet apps and API clients
- **Session-based** - For web admin interface (backward compatible)

### JWT Authentication Header
```
Authorization: Bearer <accessToken>
```

---

## Authentication

### 1. Login (Mobile/Tablet App)
**Endpoint:** `POST /api/login`

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "username": "admin",
    "firstname": "John",
    "lastname": "Doe",
    "permissions": 1,
    "branch_id": 1
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### 2. Refresh Access Token
**Endpoint:** `POST /api/refresh`

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### 3. Get Current User (Web)
**Endpoint:** `GET /me`

**Authentication:** Optional (JWT or Session)

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "username": "admin",
    "firstname": "John",
    "lastname": "Doe",
    "permissions": 1,
    "branch_id": 1,
    "branch_name": "Main Branch",
    "branch_code": "BR001"
  }
}
```

### 4. Forgot Password
**Endpoint:** `POST /auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```
or
```json
{
  "username": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset instructions sent (if email exists)",
  "reset_token": "token_string"
}
```

### 5. Reset Password
**Endpoint:** `POST /auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_string",
  "new_password": "newpassword123",
  "confirm_password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## Mobile/Tablet API Endpoints

All endpoints under `/api/*` require JWT authentication.

### Categories

#### Get All Categories
**Endpoint:** `GET /api/categories`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Appetizers",
      "description": "Start your meal"
    }
  ]
}
```

### Tables

#### Get All Tables
**Endpoint:** `GET /api/tables`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "table_number": "T01",
      "capacity": 4,
      "status": 1,
      "branch_id": 1
    }
  ]
}
```

### Menu Items

#### Get All Menu Items
**Endpoint:** `GET /api/menu`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `category_id` (optional) - Filter by category

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category_id": 1,
      "category_name": "Appetizers",
      "name": "Spring Rolls",
      "description": "Crispy spring rolls",
      "image": "http://server/uploads/menu/spring-rolls.webp",
      "price": 150.00,
      "is_available": true
    }
  ],
  "count": 1
}
```

### Orders

#### Get User Orders
**Endpoint:** `GET /api/orders`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "order_id": 1,
      "order_no": "ORD-001",
      "table_id": 1,
      "status": 2,
      "grand_total": 500.00,
      "items": [...]
    }
  ]
}
```

#### Create Order
**Endpoint:** `POST /api/orders`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "order_no": "ORD-001",
  "table_id": 1,
  "order_type": "DINE_IN",
  "items": [
    {
      "menu_id": 1,
      "qty": 2,
      "unit_price": 150.00,
      "status": 3
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_id": 1,
    "order_no": "ORD-001",
    "table_id": 1,
    "status": 3,
    "grand_total": 300.00,
    "items_count": 1
  }
}
```

#### Add Items to Order
**Endpoint:** `POST /api/orders/:order_id/items`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "items": [
    {
      "menu_id": 2,
      "qty": 1,
      "unit_price": 200.00,
      "status": 3
    }
  ]
}
```

#### Replace Order Items
**Endpoint:** `PUT /api/orders/:order_id/items`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "items": [
    {
      "menu_id": 1,
      "qty": 3,
      "unit_price": 150.00,
      "status": 3
    }
  ]
}
```

### Kitchen Orders

#### Get Kitchen Orders
**Endpoint:** `GET /api/kitchen/orders`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "order_id": 1,
      "order_no": "ORD-001",
      "table_id": 1,
      "table_number": "T01",
      "status": 3,
      "items": [
        {
          "id": 1,
          "menu_id": 1,
          "menu_name": "Spring Rolls",
          "qty": 2,
          "status": 3
        }
      ]
    }
  ]
}
```

#### Update Kitchen Order Status
**Endpoint:** `PATCH /api/kitchen/orders/:order_id/status` or `POST /api/kitchen/orders/:order_id/status`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "status": 2
}
```

**Status Values:**
- `3` = PENDING
- `2` = PREPARING
- `1` = READY
- `-1` = CANCELLED

### Waiter Orders

#### Get Waiter Orders
**Endpoint:** `GET /api/waiter/orders`

**Headers:**
```
Authorization: Bearer <accessToken>
```

#### Update Waiter Order Status
**Endpoint:** `PATCH /api/waiter/orders/:order_id/status`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "status": 2
}
```

**Status Values:**
- `3` = PENDING
- `2` = CONFIRMED

### User Management (Mobile API)

#### Get Users
**Endpoint:** `GET /api/user-management/users`

**Headers:**
```
Authorization: Bearer <accessToken>
```

#### Get Roles
**Endpoint:** `GET /api/user-management/roles`

**Headers:**
```
Authorization: Bearer <accessToken>
```

#### Create User
**Endpoint:** `POST /api/user-management/users`

**Headers:**
```
Authorization: Bearer <accessToken>
```

#### Update User
**Endpoint:** `PUT /api/user-management/users/:id`

**Headers:**
```
Authorization: Bearer <accessToken>
```

#### Delete User
**Endpoint:** `DELETE /api/user-management/users/:id`

**Headers:**
```
Authorization: Bearer <accessToken>
```

#### Create Role
**Endpoint:** `POST /api/user-management/roles`

**Headers:**
```
Authorization: Bearer <accessToken>
```

#### Update Role
**Endpoint:** `PUT /api/user-management/roles/:id`

**Headers:**
```
Authorization: Bearer <accessToken>
```

#### Delete Role
**Endpoint:** `DELETE /api/user-management/roles/:id`

**Headers:**
```
Authorization: Bearer <accessToken>
```

---

## Web Admin API Endpoints

All endpoints require authentication (JWT or Session).

### Dashboard

#### Get Dashboard Statistics
**Endpoint:** `GET /dashboard/stats`

**Query Parameters:**
- `branch_id` (optional) - Filter by branch

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "todaysRevenue": 5000.00,
      "totalOrders": 25,
      "activeTables": 8,
      "pendingOrders": 5,
      "popularItems": 12
    },
    "currentBranch": {...},
    "permissions": 1
  }
}
```

#### Get Individual Stats
- `GET /dashboard/revenue` - Today's revenue only
- `GET /dashboard/orders` - Total orders count only
- `GET /dashboard/tables` - Active tables count only
- `GET /dashboard/pending` - Pending orders count only
- `GET /dashboard/popular` - Popular items count only

### Categories

#### Get All Categories
**Endpoint:** `GET /categories_list`

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

#### Get Category by ID
**Endpoint:** `GET /category/:id`

#### Create Category
**Endpoint:** `POST /category`

**Request Body:**
```json
{
  "CATEGORY_NAME": "Appetizers",
  "DESCRIPTION": "Start your meal"
}
```

#### Update Category
**Endpoint:** `PUT /category/:id`

**Request Body:**
```json
{
  "CATEGORY_NAME": "Appetizers",
  "DESCRIPTION": "Updated description"
}
```

#### Delete Category
**Endpoint:** `DELETE /category/:id`

### Menu Items

#### Get All Menu Items
**Endpoint:** `GET /menus`

#### Get Menu Item by ID
**Endpoint:** `GET /menu/:id`

#### Get Categories (for dropdown)
**Endpoint:** `GET /categories`

#### Create Menu Item
**Endpoint:** `POST /menu`

**Request:** `multipart/form-data`
- `MENU_NAME` (string)
- `CATEGORY_ID` (number)
- `MENU_PRICE` (number)
- `DESCRIPTION` (string, optional)
- `IS_AVAILABLE` (number, 0 or 1)
- `MENU_IMG` (file, optional) - Auto-converted to WebP

#### Update Menu Item
**Endpoint:** `PUT /menu/:id`

**Request:** `multipart/form-data` (same as create)

#### Delete Menu Item
**Endpoint:** `DELETE /menu/:id`

### Orders

#### Get All Orders
**Endpoint:** `GET /orders/data`

**Query Parameters:**
- `branch_id` (optional)
- `status` (optional)
- `start_date` (optional)
- `end_date` (optional)

#### Get Order by ID
**Endpoint:** `GET /orders/:id`

#### Get Order Items
**Endpoint:** `GET /orders/:id/items`

#### Create Order
**Endpoint:** `POST /orders`

**Request Body:**
```json
{
  "order_no": "ORD-001",
  "table_id": 1,
  "order_type": "DINE_IN",
  "items": [...]
}
```

#### Update Order
**Endpoint:** `PUT /orders/:id`

#### Update Order Status
**Endpoint:** `PATCH /orders/:id/status`

**Request Body:**
```json
{
  "status": 1
}
```

**Status Values:**
- `1` = SETTLED
- `2` = CONFIRMED
- `3` = PENDING

#### Update Order Item Status
**Endpoint:** `PUT /order_items/:id/status`

**Request Body:**
```json
{
  "status": 2
}
```

#### Get Order Item by ID
**Endpoint:** `GET /order_items/:id`

#### Update Order Item
**Endpoint:** `PUT /order_items/:id`

**Request Body:**
```json
{
  "qty": 3,
  "unit_price": 150.00,
  "status": 2
}
```

#### Delete Order Item
**Endpoint:** `DELETE /order_items/:id`

### Tables

#### Get All Tables
**Endpoint:** `GET /restaurant_tables`

#### Get Table Transaction History
**Endpoint:** `GET /restaurant_table/:id/transactions`

#### Create Table
**Endpoint:** `POST /restaurant_table`

**Request Body:**
```json
{
  "TABLE_NUMBER": "T01",
  "CAPACITY": 4,
  "BRANCH_ID": 1
}
```

#### Update Table
**Endpoint:** `PUT /restaurant_table/:id`

#### Update Table Status
**Endpoint:** `PATCH /restaurant_table/:id/status`

**Request Body:**
```json
{
  "status": 2
}
```

**Status Values:**
- `1` = AVAILABLE
- `2` = OCCUPIED

#### Delete Table
**Endpoint:** `DELETE /restaurant_table/:id`

### Employees

#### Get Page Metadata
**Endpoint:** `GET /employee/metadata`

**Response:**
```json
{
  "success": true,
  "data": {
    "branches": [...],
    "users": [...],
    "roles": [...],
    "departments": [...]
  }
}
```

#### Get All Employees
**Endpoint:** `GET /employees_list`

#### Get Employee by ID
**Endpoint:** `GET /employee/:id`

#### Create Employee
**Endpoint:** `POST /employee`

**Request Body:**
```json
{
  "EMPLOYEE_NAME": "John Doe",
  "BRANCH_ID": 1,
  "DEPARTMENT": "Kitchen",
  "POSITION": "Chef",
  "PHONE": "1234567890",
  "EMAIL": "john@example.com"
}
```

#### Update Employee
**Endpoint:** `PUT /employee/:id`

#### Delete Employee
**Endpoint:** `DELETE /employee/:id`

### Billing

#### Get All Billing Records
**Endpoint:** `GET /billing/data`

**Query Parameters:**
- `branch_id` (optional)

#### Get Billing by Order ID
**Endpoint:** `GET /billing/:orderId`

#### Get Payment History
**Endpoint:** `GET /billing/:orderId/payments`

#### Create Billing Record
**Endpoint:** `POST /billing`

**Request Body:**
```json
{
  "order_id": 1,
  "payment_method": "CASH",
  "amount_due": 500.00,
  "amount_paid": 500.00,
  "payment_ref": "REF-001",
  "status": 1
}
```

#### Update Billing
**Endpoint:** `PUT /billing/:id`

**Request Body:**
```json
{
  "payment_method": "CARD",
  "amount_paid": 500.00,
  "status": 1
}
```

### Branches

**Base Path:** `/branch` (registered separately in app.js)

#### Get Branch Options
**Endpoint:** `GET /branch/options`

#### Set Current Branch
**Endpoint:** `POST /branch/set-current`

**Request Body:**
```json
{
  "branch_id": 1
}
```

#### Get All Branches
**Endpoint:** `GET /branch`

#### Get Branch by ID
**Endpoint:** `GET /branch/:id` (Admin only)

#### Create Branch
**Endpoint:** `POST /branch` (Admin only)

#### Update Branch
**Endpoint:** `PUT /branch/:id` (Admin only)

#### Delete Branch
**Endpoint:** `DELETE /branch/:id` (Admin only)

#### Get Users by Branch
**Endpoint:** `GET /branch/:branchId/users` (Admin only)

#### Assign User to Branch
**Endpoint:** `POST /branch/assign` (Admin only)

#### Remove User from Branch
**Endpoint:** `POST /branch/remove` (Admin only)

#### Set User Branches
**Endpoint:** `POST /branch/set-user-branches` (Admin only)

### Reports & Analytics

#### Revenue Report
**Endpoint:** `GET /reports/revenue`

**Query Parameters:**
- `period` (required) - `daily`, `weekly`, or `monthly`
- `start_date` (optional) - Format: `YYYY-MM-DD`
- `end_date` (optional) - Format: `YYYY-MM-DD`
- `branch_id` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "daily",
    "data": [
      {
        "date": "2024-01-01",
        "revenue": 5000.00,
        "order_count": 25,
        "average_order_value": 200.00
      }
    ],
    "total_revenue": 5000.00,
    "total_orders": 25
  }
}
```

#### Order Report
**Endpoint:** `GET /reports/orders`

**Query Parameters:**
- `start_date` (optional)
- `end_date` (optional)
- `branch_id` (optional)
- `status` (optional)

#### Popular Menu Items
**Endpoint:** `GET /reports/menu-items`

**Query Parameters:**
- `start_date` (optional)
- `end_date` (optional)
- `branch_id` (optional)
- `limit` (optional, default: 10)

#### Table Utilization Report
**Endpoint:** `GET /reports/tables`

**Query Parameters:**
- `start_date` (optional)
- `end_date` (optional)
- `branch_id` (optional)

#### Employee Performance Report
**Endpoint:** `GET /reports/employees`

**Query Parameters:**
- `start_date` (optional)
- `end_date` (optional)
- `branch_id` (optional)
- `employee_id` (optional)

### Notifications

#### Get Notifications
**Endpoint:** `GET /notifications`

**Query Parameters:**
- `unread_only` (optional) - `true` or `false`
- `limit` (optional, default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "IDNo": 1,
        "USER_ID": 1,
        "TITLE": "New Order",
        "MESSAGE": "Order ORD-001 has been created",
        "TYPE": "info",
        "LINK": "/orders/1",
        "IS_READ": 0,
        "CREATED_DT": "2024-01-01T10:00:00Z"
      }
    ],
    "unread_count": 5
  }
}
```

#### Create Notification
**Endpoint:** `POST /notifications`

**Request Body:**
```json
{
  "user_id": 1,
  "title": "New Order",
  "message": "Order created",
  "type": "info",
  "link": "/orders/1"
}
```

#### Mark Notification as Read
**Endpoint:** `POST /notifications/:id/mark-read`

#### Mark All Notifications as Read
**Endpoint:** `POST /notifications/mark-read`

#### Clear All Notifications
**Endpoint:** `POST /notifications/clear`

### User Profile

#### Get Profile
**Endpoint:** `GET /user/profile`

**Response:**
```json
{
  "success": true,
  "data": {
    "IDNo": 1,
    "USERNAME": "admin",
    "FIRSTNAME": "John",
    "LASTNAME": "Doe",
    "EMAIL": "john@example.com",
    "AVATAR_URL": "/uploads/avatars/user1.webp",
    "PERMISSIONS": 1,
    "LAST_LOGIN": "2024-01-01T10:00:00Z",
    "role_name": "Admin"
  }
}
```

#### Update Profile
**Endpoint:** `PUT /user/profile`

**Request Body:**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "avatar_url": "/uploads/avatars/user1.webp"
}
```

#### Change Password
**Endpoint:** `PUT /user/password`

**Request Body:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123",
  "confirm_password": "newpassword123"
}
```

#### Get Activity History
**Endpoint:** `GET /user/activity`

**Query Parameters:**
- `limit` (optional, default: 50)

### File Upload

#### Generic File Upload
**Endpoint:** `POST /upload`

**Request:** `multipart/form-data`
- `file` (file) - Image or document

**Query Parameters:**
- `subdir` (optional) - Subdirectory name (default: `general`)
- `webp` (optional) - `true` to convert images to WebP

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "http://server/uploads/avatars/file-1234567890.webp",
    "filename": "file-1234567890.webp",
    "size": 12345,
    "mimetype": "image/webp",
    "original_filename": "photo.jpg"
  }
}
```

### Audit Logs

#### Get All Audit Logs
**Endpoint:** `GET /audit-logs`

**Query Parameters:**
- `user_id` (optional)
- `branch_id` (optional)
- `table_name` (optional)
- `action` (optional) - `CREATE`, `UPDATE`, `DELETE`
- `start_date` (optional)
- `end_date` (optional)
- `limit` (optional, default: 100)
- `offset` (optional, default: 0)

#### Get Audit Logs by Branch
**Endpoint:** `GET /audit-logs/branch/:branchId`

**Query Parameters:**
- `limit` (optional, default: 100)

#### Get Audit Logs by User
**Endpoint:** `GET /audit-logs/user/:userId`

**Query Parameters:**
- `limit` (optional, default: 100)

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

---

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

### Common Error Messages
- `"User not found"` - Invalid credentials
- `"Unauthorized"` - Missing or invalid token
- `"Forbidden"` - Insufficient permissions
- `"Validation error"` - Invalid request data
- `"Resource not found"` - Requested resource doesn't exist

---

## Notes

1. **Branch Filtering**: Most endpoints automatically filter by user's branch unless user is admin (permissions = 1)
2. **Soft Delete**: Delete operations are soft deletes (sets `ACTIVE = 0`)
3. **File Uploads**: Menu images are automatically converted to WebP format
4. **Real-time Updates**: Order status changes emit Socket.io events for real-time updates
5. **Multi-language**: System supports English, Japanese, Korean, and Chinese
6. **JWT Expiry**: Access tokens expire in 1 hour, refresh tokens in 7 days

---

## Version
**API Version:** 2.0.0  
**Last Updated:** 2024

---

**For questions or support, please contact the development team.**
