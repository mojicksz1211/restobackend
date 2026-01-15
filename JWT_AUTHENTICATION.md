# JWT Authentication Documentation

## Overview
This restaurant admin system now uses **JWT (JSON Web Tokens)** for API authentication, while maintaining **Session-based** authentication for the web admin panel.

## Architecture

### Hybrid Authentication
- **Web Admin Panel** → Session-based (secure, easy logout)
- **API/Mobile/Tablets** → JWT-based (stateless, scalable)

## JWT Implementation

### Token Types

1. **Access Token** (Short-lived)
   - Expires in: 15 minutes (configurable via `JWT_EXPIRES_IN`)
   - Used for: API requests
   - Stored in: Client (mobile app, tablet)

2. **Refresh Token** (Long-lived)
   - Expires in: 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
   - Used for: Getting new access tokens
   - Stored in: Client (mobile app, tablet)

## API Endpoints

### 1. Login
**POST** `/api/login`

**Request Body:**
```json
{
  "username": "waiter1",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "username": "waiter1",
    "firstname": "John",
    "lastname": "Doe",
    "permissions": 3,
    "table_id": null
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

### 2. Refresh Token
**POST** `/api/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

### 3. Protected Endpoints

All protected endpoints require the access token in the Authorization header:

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Protected Endpoints:**
- `GET /api/categories` - Get all categories
- `GET /api/menu` - Get menu items (optional: `?category_id=X`)

**Example Request:**
```bash
curl -X GET http://localhost:2026/api/menu \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Error Responses

### Token Expired
```json
{
  "success": false,
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```

### Invalid Token
```json
{
  "success": false,
  "error": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

### No Authorization Header
```json
{
  "success": false,
  "error": "No authorization header provided"
}
```

### Refresh Token Expired
```json
{
  "success": false,
  "error": "Refresh token expired",
  "code": "REFRESH_TOKEN_EXPIRED"
}
```

## Client Implementation (Mobile/Tablet Apps)

### 1. Login Flow
```javascript
// Login and store tokens
const response = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

const { data, tokens } = await response.json();

// Store tokens securely
await AsyncStorage.setItem('accessToken', tokens.accessToken);
await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
```

### 2. Making Authenticated Requests
```javascript
// Get stored token
const accessToken = await AsyncStorage.getItem('accessToken');

// Make request with token
const response = await fetch('/api/menu', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### 3. Token Refresh Flow
```javascript
async function makeAuthenticatedRequest(url, options = {}) {
  let accessToken = await AsyncStorage.getItem('accessToken');
  
  // Try request with current token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  // If token expired, refresh it
  if (response.status === 401) {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const refreshResponse = await fetch('/api/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (refreshResponse.ok) {
      const { tokens } = await refreshResponse.json();
      await AsyncStorage.setItem('accessToken', tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
      
      // Retry original request
      accessToken = tokens.accessToken;
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`
        }
      });
    } else {
      // Refresh failed, redirect to login
      // Handle logout
    }
  }
  
  return response;
}
```

## Environment Variables

Add these to your `.env` file or `ecosystem.config.js`:

```env
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## Security Best Practices

1. **Change Default Secrets**: Always change `JWT_SECRET` and `JWT_REFRESH_SECRET` in production
2. **Use HTTPS**: Always use HTTPS in production to protect tokens in transit
3. **Secure Storage**: Store tokens securely on client devices (Keychain on iOS, Keystore on Android)
4. **Token Rotation**: Refresh tokens are rotated on each refresh for better security
5. **Short Expiration**: Access tokens expire quickly (15 minutes) to limit exposure if compromised

## File Structure

```
utils/
  └── jwt.js              # JWT utility functions

middleware/
  └── jwtAuth.js          # JWT authentication middleware

controllers/
  └── apiController.js    # API controller with JWT login/refresh

routes/
  └── apiRoutes.js        # API routes with JWT protection
```

## Testing

### Test Login
```bash
curl -X POST http://localhost:2026/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"waiter1","password":"password123"}'
```

### Test Protected Endpoint
```bash
curl -X GET http://localhost:2026/api/menu \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Refresh Token
```bash
curl -X POST http://localhost:2026/api/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

## Migration Notes

- **Web Admin**: Still uses session-based auth (no changes needed)
- **API Endpoints**: Now require JWT authentication
- **Existing Mobile Apps**: Need to be updated to use JWT tokens
- **Backward Compatibility**: None - API endpoints now require authentication

