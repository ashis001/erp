import mysql, { Pool } from 'mysql2/promise';

// Enhance the global object to include our pool
declare global {
  var pool: Pool | undefined;
}

const dbConfig = {
  host: "srv1750.hstgr.io",
  user: "u383989558_erp",
  password: "@#@Nitish91@",
  database: "u383989558_erp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  timezone: '+00:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  idleTimeout: 300000,
};

// Use a global variable to hold the connection pool
if (!global.pool) {
  global.pool = mysql.createPool(dbConfig);
}

const pool = global.pool;

export default pool;
