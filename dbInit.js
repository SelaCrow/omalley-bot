const { sequelize } = require('./dbObjects.js');

sequelize.sync({ force: true }).then(async () => {
	console.log('Database synced.');
}).catch(console.error);