const { models } = require('../db');
const { User } = models;
module.exports = (app) => {
	app.get('/isloggedin', async (req, res) => {
		if (req.session.passport) {
			const userId = req.session.passport.user;
			const user = await User.findByPk(userId);
			res.send({
				code: 0,
				status: true,
				fName: user.firstName
			});
		} else {
			res.send({
				code: 0,
				status: false
			});
		}
	});
};
