const { logOut } = require('../middleware/loginSession');
module.exports = (app) => {
	app.post('/logout', logOut, (req, res) => {
		res.send('wow');
	});
};
