module.exports = (app) => {
	app.get('/isloggedin', (req, res) => {
		if (req.session.passport) {
			res.send({
				code: 0,
				status: true
			});
		} else {
			res.send({
				code: 0,
				status: false
			});
		}
	});
};
