import mysql from "mysql2/promise";

function createPool() {
  const url = process.env.DATABASE_URL;
  if (url) {
    return mysql.createPool({
      uri: url,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ozy_cafe",
    waitForConnections: true,
    connectionLimit: 10,
  });
}

const pool = createPool();

export default pool;