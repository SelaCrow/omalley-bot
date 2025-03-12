const { DataTypes } = require('sequelize');
const sequelize = require('./dbInit');

// Define the User model
const User = sequelize.define('User', {
	user_id: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	balance: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
});

// Sync the model with the database
sequelize.sync({ alter: true })
	.then(() => {
		console.log('Database & tables synchronized!');
	})
	.catch(error => {
		console.error('Error synchronizing database', error);
	});

module.exports = { sequelize, User };
