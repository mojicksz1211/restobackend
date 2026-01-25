# Google Cloud Translation API Setup Guide

This guide will help you set up Google Cloud Translation API for automatic translation of menu names and categories.

## Option 1: Service Account (Recommended for Production)

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "restaurant-translation")
5. Click "Create"

### Step 2: Enable Translation API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Cloud Translation API"
3. Click on "Cloud Translation API"
4. Click "Enable"

### Step 3: Create Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Enter a name (e.g., "translation-service")
4. Click "Create and Continue"
5. Grant role: "Cloud Translation API User"
6. Click "Continue" then "Done"

### Step 4: Create and Download Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create" - the JSON file will download automatically

### Step 5: Configure Environment Variable

**Windows:**
1. Save the downloaded JSON file to a secure location (e.g., `C:\keys\translation-service-key.json`)
2. Open your `.env` file in the project root
3. Add this line:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=C:\keys\translation-service-key.json
   ```
   (Use forward slashes or double backslashes: `C:/keys/translation-service-key.json` or `C:\\keys\\translation-service-key.json`)

**Linux/Mac:**
1. Save the downloaded JSON file to a secure location (e.g., `~/keys/translation-service-key.json`)
2. Open your `.env` file in the project root
3. Add this line:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/home/username/keys/translation-service-key.json
   ```

### Step 6: Restart Your Application

Restart your Node.js application to load the new environment variable.

---

## Option 2: API Key (Simpler, but Less Secure) ✅ RECOMMENDED FOR QUICK SETUP

### Step 1: Enable Translation API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Go to "APIs & Services" > "Library"
4. Search for "Cloud Translation API"
5. Click "Enable"

### Step 2: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key
4. (Recommended) Click "Restrict Key" to:
   - Restrict to "Cloud Translation API" only
   - Add IP restrictions if needed
   - Click "Save"

### Step 3: Configure Environment Variable

Add to your `.env` file:
```
GOOGLE_TRANSLATE_API_KEY=your-api-key-here
```

**That's it!** This is the simplest method. Just restart your application.

---

## Option 3: Application Default Credentials (For Cloud Deployment)

If you're running on Google Cloud Platform (GCP), you can use Application Default Credentials:

1. Set the project ID in your `.env`:
   ```
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   ```

2. The service will automatically use the default credentials from the environment.

---

## Testing the Setup

After configuration, restart your application. You should see:
```
[TRANSLATION SERVICE] Google Cloud Translation initialized
```

If you still see the warning, check:
1. The `.env` file is in the project root
2. The path to the JSON file is correct (use absolute path)
3. The JSON file is valid
4. You've restarted the application after adding the environment variable

---

## Usage

Once configured, the API endpoints will automatically translate Korean text:

```
GET /api/menu?lang=en      # English
GET /api/menu?lang=ja      # Japanese
GET /api/menu?lang=zh      # Chinese
GET /api/menu?lang=ko      # Korean (original, no translation)

GET /api/categories?lang=en
```

---

## Pricing

Google Cloud Translation API offers:
- **Free tier**: 500,000 characters per month
- **Paid tier**: $20 per million characters after free tier

Check current pricing at: https://cloud.google.com/translate/pricing

---

## Troubleshooting

### Error: "Could not load the default credentials"
- Make sure the path in `GOOGLE_APPLICATION_CREDENTIALS` is correct
- Use absolute path, not relative path
- On Windows, use forward slashes or escaped backslashes

### Error: "Permission denied"
- Make sure the service account has "Cloud Translation API User" role
- Check that Translation API is enabled in your project

### Translation not working
- Check that the API is enabled in Google Cloud Console
- Verify your billing account is set up (even for free tier)
- Check the console logs for specific error messages

---

## Security Best Practices

1. **Never commit** the service account JSON file or API key to version control
2. Add `.env` and key files to `.gitignore` (already done)
3. Use environment variables, not hardcoded credentials
4. Restrict API keys to specific APIs and IPs if possible
5. Rotate keys periodically

