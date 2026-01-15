module.exports = {
    apps: [
      {
        name: "RestoAdmin",
        script: "app.js", 
        env: {
          DB_HOST: "127.0.0.1",
          DB_USER: "3core",
          DB_PASSWORD: "2024.3core21",
          DB_NAME: "restaurant",
          DB_PORT: 3306,
          SESSION_SECRET: "your_secret_key",
          PORT: 2026
          // Note: JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN
          // are loaded from .env file via dotenv.config() in app.js
        }
      }
    ]
  };
  