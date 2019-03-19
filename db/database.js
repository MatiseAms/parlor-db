const Sequelize = require('sequelize');
const session = require('express-session');
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

// initalize sequelize with session store
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const myStore = new SequelizeStore({
	db: Database
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
exports.myStore = myStore;
