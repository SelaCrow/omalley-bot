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
sequelize.sync({ force: true })
	.then(() => {
		console.log('Database & tables created!');
	})
	.catch(error => {
		console.error('Error creating database & tables:', error);
	});

module.exports = { User };