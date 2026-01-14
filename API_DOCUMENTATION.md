# Restaurant API Documentation

## Public API Endpoints for Android App

### Base URL
```
http://your-server-url:4004/api
```

---

## 1. Get All Categories

Get all active categories for the filter button.

**Endpoint:** `GET /api/categories`

**Authentication:** Not required (public endpoint)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Appetizers",
      "description": "Start your meal with these"
    },
    {
      "id": 2,
      "name": "Main Course",
      "description": "Main dishes"
    }
  ]
}
```

---

## 2. Get Menu Items

Get all menu items, optionally filtered by category.

**Endpoint:** `GET /api/menu`

**Query Parameters:**
- `category_id` (optional) - Filter menu items by category ID

**Examples:**
- Get all menu items: `GET /api/menu`
- Get menu items by category: `GET /api/menu?category_id=1`

**Authentication:** Not required (public endpoint)

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
      "description": "Crispy spring rolls with vegetables",
      "image": "http://your-server-url:4004/uploads/menu/spring-rolls.jpg",
      "price": 150.00,
      "is_available": true
    },
    {
      "id": 2,
      "category_id": 2,
      "category_name": "Main Course",
      "name": "Grilled Chicken",
      "description": "Tender grilled chicken with herbs",
      "image": "http://your-server-url:4004/uploads/menu/grilled-chicken.jpg",
      "price": 350.00,
      "is_available": true
    }
  ],
  "count": 2
}
```

**Notes:**
- Only returns menu items that are `ACTIVE = 1` and `IS_AVAILABLE = 1`
- Image URLs are full URLs including the server base URL
- If no image is available, the `image` field will be `null`
- Price is returned as a float number

---

## Error Response Format

If an error occurs, the API will return:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**HTTP Status Codes:**
- `200` - Success
- `500` - Server error

---

## Usage Example (Android/Kotlin)

```kotlin
// Get categories
val categoriesResponse = client.get("http://your-server:4004/api/categories")
val categories = categoriesResponse.body<CategoriesResponse>()

// Get all menu items
val menuResponse = client.get("http://your-server:4004/api/menu")
val menuItems = menuResponse.body<MenuResponse>()

// Get menu items by category
val filteredMenuResponse = client.get("http://your-server:4004/api/menu?category_id=1")
val filteredMenuItems = filteredMenuResponse.body<MenuResponse>()
```

