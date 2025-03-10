const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Example of creating a table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0 NOT NULL
  )
`).run();

// Check if the user already exists
const userExists = db.prepare('SELECT COUNT(*) AS count FROM users WHERE user_id = ?').get('user123').count;

if (userExists === 0) {
	// Example of inserting a user
	const insertUser = db.prepare('INSERT INTO users (user_id, balance) VALUES (?, ?)');
	insertUser.run('user123', 100);
}
else {
	console.log('User already exists');
}

module.exports = { db };