const { Database, Sequelize } = require('./database');
const { hostname } = require('../config');

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
		type: Sequelize.STRING,
		get() {
			const value = this.getDataValue('image');
			return `${hostname}/${value}`;
		}
	}
});

const Project = Database.define('project', {
	name: {
		type: Sequelize.STRING,
		validate: {
			notEmpty: true
		}
	},
	version: {
		type: Sequelize.NUMBER
	},
	gridStatus: {
		type: Sequelize.BOOLEAN
	},
	colorStatus: {
		type: Sequelize.BOOLEAN
	},
	typoStatus: {
		type: Sequelize.BOOLEAN
	}
});

const Color = Database.define('color', {
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

const Typography = Database.define('typography', {
	key: {
		type: Sequelize.STRING,
		validate: {
			notEmpty: true
		}
	},
	colors: {
		type: Sequelize.STRING,
		validate: {
			notEmpty: true
		},
		get() {
			const value = this.getDataValue('colors');
			return JSON.parse(value);
		},
		set(val) {
			this.setDataValue('colors', JSON.stringify(val));
		}
	},
	minSize: {
		type: Sequelize.NUMBER
	},
	baseSize: {
		type: Sequelize.NUMBER
	},
	hasItalic: {
		type: Sequelize.BOOLEAN
	},
	weight: {
		type: Sequelize.STRING,
		get() {
			const value = this.getDataValue('weight');
			return JSON.parse(value);
		},
		set(val) {
			this.setDataValue('weight', JSON.stringify(val));
		}
	},
	kerning: {
		type: Sequelize.INTEGER
	},
	lineheight: {
		type: Sequelize.INTEGER
	},
	family: {
		type: Sequelize.STRING,
		validate: {
			notEmpty: true
		}
	},
	checked: {
		type: Sequelize.BOOLEAN
	}
});

const Grid = Database.define('grid', {
	value: {
		type: Sequelize.INTEGER,
		validate: {
			notEmpty: true
		}
	},
	checked: {
		type: Sequelize.BOOLEAN
	}
});

//assosiations
Project.belongsToMany(User, {
	through: 'projectsToUsers'
});

User.belongsToMany(Project, {
	through: 'projectsToUsers'
});
Project.hasMany(Color);

Project.hasMany(Typography);

Project.hasMany(Grid);

const settings = {
	User,
	Color,
	Typography,
	Project,
	Grid
};

//export the settings so we can use them
module.exports = settings;
