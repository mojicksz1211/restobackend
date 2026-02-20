# Loyverse Integration Setup Guide

## Overview
This integration allows you to sync orders/receipts from Loyverse POS system to your local database in real-time.

## Prerequisites
1. Loyverse account with API access
2. Access token from Loyverse (OAuth token)
3. Node.js dependencies installed

## Installation

### 1. Install Dependencies
```bash
npm install axios
```

### 2. Environment Variables
Add the following variables to your `.env` file:

```env
# Loyverse API Configuration
LOYVERSE_ACCESS_TOKEN=your_access_token_here
LOYVERSE_DEFAULT_BRANCH_ID=1
LOYVERSE_SYNC_INTERVAL=10000
LOYVERSE_AUTO_SYNC=true
LOYVERSE_AUTO_SYNC_LIMIT=500
LOYVERSE_SYNC_MAX_RECEIPTS=0
LOYVERSE_SYNC_MAX_PAGES=0
```

**Configuration Details:**
- `LOYVERSE_ACCESS_TOKEN`: Your Loyverse OAuth access token (get from OAuth flow)
- `LOYVERSE_DEFAULT_BRANCH_ID`: Default branch ID to assign synced orders (optional)
- `LOYVERSE_SYNC_INTERVAL`: Sync interval in milliseconds (default: 30000 = 30 seconds)
- `LOYVERSE_AUTO_SYNC`: Set to `true` to enable automatic background syncing
- `LOYVERSE_AUTO_SYNC_LIMIT`: Receipts per sync call during auto-sync (default: 500, max: 1000)
- `LOYVERSE_SYNC_MAX_RECEIPTS`: Safety cap for manual/auto sync runs (0 = unlimited)
- `LOYVERSE_SYNC_MAX_PAGES`: Safety cap for manual/auto sync runs (0 = unlimited)

## Getting Your Access Token

### Step 1: OAuth Authorization
1. Go to Loyverse Developer Portal
2. Create an OAuth application
3. Get your `client_id` and `client_secret`
4. Set redirect URI (e.g., `https://webhook.site/your-unique-id`)

### Step 2: Get Authorization Code
Visit this URL (replace with your client_id and redirect_uri):
```
https://api.loyverse.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=RECEIPTS_READ
```

### Step 3: Exchange Code for Token
After authorization, you'll get a code. Exchange it for an access token:

**POST** `https://api.loyverse.com/oauth/token`
```
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&redirect_uri=YOUR_REDIRECT_URI
&code=AUTHORIZATION_CODE
```

### Step 4: Use Access Token
Copy the `access_token` from the response and add it to your `.env` file.

## API Endpoints

### 1. Get Sync Status
**GET** `/api/loyverse/status`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Response**:
```json
{
  "success": true,
  "message": "Sync status retrieved successfully",
  "data": {
    "isSyncing": false,
    "lastSyncTime": "2026-02-20T10:30:00.000Z",
    "stats": {
      "totalFetched": 150,
      "totalInserted": 120,
      "totalUpdated": 30,
      "totalErrors": 0,
      "lastError": null
    },
    "autoSyncActive": true
  }
}
```

### 2. Manual Sync
**POST** `/api/loyverse/sync`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Body** (optional):
```json
{
  "branch_id": 1,
  "limit": 50
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Sync completed successfully",
  "data": {
    "stats": {
      "totalFetched": 50,
      "totalInserted": 45,
      "totalUpdated": 5,
      "totalErrors": 0
    },
    "message": "Sync completed: 45 inserted, 5 updated, 0 errors"
  }
}
```

### 3. Start Auto-Sync
**POST** `/api/loyverse/auto-sync/start`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Body** (optional):
```json
{
  "branch_id": 1,
  "interval": 30000
}
```

### 4. Stop Auto-Sync
**POST** `/api/loyverse/auto-sync/stop`
- **Headers**: `Authorization: Bearer <your_jwt_token>`

## How It Works

### Data Mapping

**Loyverse Receipt → Local Order:**
- `receipt_number` → `ORDER_NO` (prefixed with "LOY-")
- `total_money` → `GRAND_TOTAL`
- `total_tax` → `TAX_AMOUNT`
- `total_discount` → `DISCOUNT_AMOUNT`
- `receipt_date` → `ENCODED_DT`
- `dining_option` → `ORDER_TYPE` (DINE_IN, TAKE_OUT, DELIVERY)

**Loyverse Line Items → Local Order Items:**
- `item_name` → Matched to `menu.MENU_NAME`
- `quantity` → `QTY`
- `price` → `UNIT_PRICE`
- `total_money` → `LINE_TOTAL`

**Loyverse Payments → Local Billing:**
- Payment type → `PAYMENT_METHOD` (CASH, CARD, GCASH, MAYA)
- `money_amount` → `AMOUNT_PAID`
- Status set to `PAID` (1) since receipts are already paid in Loyverse

### Menu Item Matching

The system matches Loyverse items to your local menu by:
1. Exact match on `MENU_NAME`
2. Partial match (LIKE) on `MENU_NAME`
3. If no match found, the item is skipped and logged as a warning

**Note:** Items that don't match will be logged but not inserted. You may want to:
- Ensure menu names match exactly between Loyverse and your database
- Add a SKU field to your menu table for better matching
- Review unmapped items periodically

### Order Status

Synced orders are automatically set to:
- **STATUS**: `1` (SETTLED) - since they're already paid in Loyverse
- **Order Items STATUS**: `1` (READY) - since they're already completed

### Duplicate Prevention

The system checks for existing orders by `ORDER_NO` before inserting:
- If order exists and receipt is cancelled → Order status set to `-1` (CANCELLED)
- If order exists → Order is updated with latest data
- If order doesn't exist → New order is created

## Troubleshooting

### Issue: "Access token not configured"
**Solution:** Add `LOYVERSE_ACCESS_TOKEN` to your `.env` file

### Issue: "Menu item not found" warnings
**Solution:** 
- Check that menu names in your database match Loyverse item names
- Review logs to see which items are unmapped
- Consider adding a menu item mapping table

### Issue: Sync not working
**Solution:**
1. Check access token is valid (not expired)
2. Verify API endpoint is accessible
3. Check server logs for errors
4. Try manual sync via API endpoint first

### Issue: Too many API calls
**Solution:**
- Increase `LOYVERSE_SYNC_INTERVAL` to reduce frequency
- Use manual sync instead of auto-sync
- Implement webhook-based sync (future enhancement)

## Best Practices

1. **Start with Manual Sync**: Test with manual sync first before enabling auto-sync
2. **Monitor Logs**: Check console logs for warnings about unmapped items
3. **Sync Frequency**: Don't set interval too low (minimum 30 seconds recommended)
4. **Menu Matching**: Ensure menu names are consistent between systems
5. **Error Handling**: Review sync stats regularly to catch issues early

## Future Enhancements

- Webhook support for real-time updates (instead of polling)
- SKU-based menu matching
- Custom menu item mapping table
- Sync history and audit logs
- Support for refunds and cancellations
- Multi-branch sync with branch mapping

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Review sync status via API endpoint
3. Test with manual sync first
4. Verify access token is valid and not expired

