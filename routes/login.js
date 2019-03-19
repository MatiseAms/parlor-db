module.exports = (app, passport) => {
	app.post('/login', (req, res, next) => {
		passport.authenticate('local-signin', (err, user, info) => {
			if (err) return next(err);
			if (user) {
				req.logIn(user, (err) => {
					if (err) return next(err);

					const { password, ...rest } = user; // eslint-disable-line
					res.send({
						code: 0, //0 is succes
						message: rest
					});
				});
			} else {
				res.status(400).json(info);
			}
		})(req, res, next);
	});
};
