const { DataTypes } = require('sequelize');
const sequelize = require('./dbInit');

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

const LotteryTickets = sequelize.define('LotteryTickets', {
	user_id: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	tickets: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
});

const LotteryState = sequelize.define('LotteryState', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	prize_pool: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
});
const SwearOffense = sequelize.define('SwearOffense', {
	user_id: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	count: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
});

sequelize.sync()
	.then(() => console.log('Database & tables synchronized!'))
	.catch(error => console.error('Error synchronizing database', error));

module.exports = { sequelize, User, LotteryTickets, LotteryState, SwearOffense };