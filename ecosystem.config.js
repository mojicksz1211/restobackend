module.exports = {
    apps: [
      {
        name: "democage",
        script: "app.js", 
        env: {
          DB_HOST: "127.0.0.1",
          DB_USER: "3core",
          DB_PASSWORD: "2024.3core21",
          DB_NAME: "democage",
          DB_PORT: 3306,
          SESSION_SECRET: "your_secret_key",
          PORT: 4004
        }
      }
    ]
  };
  