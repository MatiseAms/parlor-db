module.exports = (app, passport) => {
	app.post('/signup', (req, res, next) => {
		passport.authenticate('local-signup', (err, user, info) => {
			if (err) return next(err);
			if (user) {
				req.logIn(user, (err) => {
					if (err) return next(err);
					res.send('succes');
				});
				// Register failed, flash message is in info
			} else {
				res.status(400).json(info);
			}
		})(req, res, next);
	});
};
