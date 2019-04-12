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

const Color = Database.define('color', {
	name: {
		type: Sequelize.STRING,
		validate: {
			notEmpty: true
		}
	},
	value: {
		primaryKey: true,
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
		primaryKey: true,
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
		type: Sequelize.NUMBER,
		validate: {
			notEmpty: true
		}
	},
	baseSize: {
		type: Sequelize.NUMBER,
		validate: {
			notEmpty: true
		}
	},
	hasItalic: {
		type: Sequelize.BOOLEAN,
		validate: {
			notEmpty: true
		}
	},
	weight: {
		type: Sequelize.STRING,
		validate: {
			notEmpty: true
		},
		get() {
			const value = this.getDataValue('weight');
			return JSON.parse(value);
		},
		set(val) {
			this.setDataValue('weight', JSON.stringify(val));
		}
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
