const { Sequelize } = require('sequelize');

const dbPath = process.env.DB_PATH || './database.sqlite';

const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: dbPath,
	logging: false,
});

console.log(`Database initialized at: ${dbPath}`);

module.exports = sequelize;