require('dotenv').config();

const { Client } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const client = new Client();

const token = process.env.DISCORD_TOKEN;
const dbPath = process.env.DB_PATH;

// Example of using the token to log in the bot
client.login(token);

// Example of connecting to an SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
	if (err) {
		console.error('Error connecting to the database:', err);
		return;
	}
	console.log('Connected to the SQLite database');
});

// Example of querying the database
db.serialize(() => {
	db.each('SELECT * FROM Users', (err, row) => {
		if (err) {
			console.error('Error querying the database:', err);
			return;
		}
		console.log(row);
	});
});