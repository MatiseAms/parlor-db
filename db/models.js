const { database, Sequelize } = require('./database');

const User = database.define(
	'user',
	{
		email: {
			type: Sequelize.STRING,
			unique: true,
			primaryKey: true,
			validate: {
				notEmpty: true,
				isEmail: true,
				len: [5, 256]
			}
		},
		password: {
			type: Sequelize.VIRTUAL,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		firstName: {
			type: Sequelize.STRING,
			validate: {
				notEmpty: true
			}
		},
		lastName: {
			type: Sequelize.STRING,
			validate: {
				notEmpty: true
			}
		}
	},
	{
		getterMethods: {
			fullName() {
				return this.firstName + ' ' + this.lastName;
			}
		},
		setterMethods: {
			fullName(value) {
				const names = value.split(' ');
				this.setDataValue('firstName', names.slice(0, -1).join(' '));
				this.setDataValue('lastName', names.slice(-1).join(' '));
			}
		}
	}
);

const settings = {
	User
};

module.exports = settings;
