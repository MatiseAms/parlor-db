const { Database, Sequelize } = require('./database');

const User = Database.define('user', {
	username: {
		type: Sequelize.STRING,
		unique: true,
		validate: {
			notEmpty: true,
			len: [3, 256]
		}
	},
	email: {
		type: Sequelize.STRING,
		unique: true,
		validate: {
			notEmpty: true,
			isEmail: true,
			len: [5, 256]
		}
	},
	password: {
		type: Sequelize.STRING,
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
	},
	image: {
		type: Sequelize.STRING
	}
});

const Project = Database.define('project', {
	name: {
		type: Sequelize.STRING,
		validate: {
			notEmpty: true
		}
	},
	image: {
		type: Sequelize.STRING
	},
	version: {
		type: Sequelize.NUMBER
	}
});

Project.belongsToMany(User, {
	through: 'projectsToUsers'
});

User.belongsToMany(Project, {
	through: 'projectsToUsers'
});

let settings = {
	User,
	Project
};

//create a database for every asset
const assets = ['Typography', 'Color', 'Static', 'Grid'];

assets.forEach((asset) => {
	settings[asset] = Database.define(asset.toLowerCase(), {
		name: {
			type: Sequelize.STRING,
			validate: {
				notEmpty: true
			}
		},
		value: {
			type: Sequelize.STRING,
			validate: {
				notEmpty: true
			}
		},
		checked: {
			type: Sequelize.BOOLEAN
		},
		doubleName: {
			type: Sequelize.BOOLEAN
		},
		ogName: {
			type: Sequelize.STRING,
			validate: {
				notEmpty: true
			}
		}
	});
	//all assets belong to the project
	Project.hasMany(settings[asset]);
});

//export the settings so we can use them
module.exports = settings;
