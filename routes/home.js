const { port, env } = require('../config');

const obj = {
	env,
	port
};

module.exports = (app) => {
	app.get('/', (req, res) => {
		res.send(obj);
	});
};
