import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Database configuration is duplicated here to create an isolated connection for seeding.
const dbConfig = {
  host: "srv1750.hstgr.io",
  user: "u383989558_erp",
  password: "@#@Nitish91@",
  database: "u383989558_erp",
  multipleStatements: true, // Necessary for running the whole .sql file
  timezone: '+00:00',
};

async function seedDatabase() {
  let connection;
  try {
    console.log('Attempting to connect to the database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Database connection successful.');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const sqlFilePath = path.join(__dirname, '..', 'src', 'seed.sql');
    console.log(`Reading SQL file from: ${sqlFilePath}`);
    const sql = await fs.readFile(sqlFilePath, 'utf-8');
    console.log('SQL file read successfully.');

    console.log('Executing SQL script...');
    await connection.query(sql);
    console.log('Database has been successfully seeded!');

    console.log('Hashing and updating superadmin password...');
    const plainPassword = 'superadmin';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const updateUserQuery = `
      UPDATE users 
      SET password = ? 
      WHERE email = 'superadmin@example.com'
    `;
    await connection.execute(updateUserQuery, [hashedPassword]);
    console.log('Superadmin password has been successfully updated.');

  } catch (error) {
    console.error('An error occurred during the seeding process:', error);
    process.exit(1); // Exit with an error code
  } finally {
    if (connection) {
      console.log('Closing the database connection.');
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

seedDatabase();

