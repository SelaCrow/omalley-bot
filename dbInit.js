const { Sequelize } = require('sequelize');

// Create a new instance of Sequelize
const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	storage: 'path/to/database.sqlite',
	logging: false,
});

console.log('Database initialized.');

module.exports = sequelize;