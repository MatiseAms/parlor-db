const Sequelize = require('sequelize');

const { database } = require('../config');

const Database = new Sequelize(database.name, null, null, {
	dialect: 'sqlite',
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000
	},
	storage: './database.sqlite'
});

async function loadDB() {
	try {
		await Database.authenticate();
		await Database.sync();
		console.log('Database connection has been succesfully established');
	} catch (error) {
		console.error('Unable to connect to the database due to', error);
	}
}

exports.Sequelize = Sequelize;
exports.database = Database;
exports.loadDB = loadDB;
