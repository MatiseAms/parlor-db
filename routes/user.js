const { logOut } = require('../middleware/loginSession');
const { dbFunctions } = require('../db');
const { getUserInfo } = dbFunctions;

module.exports = (app, passport) => {
	/**
	 * Single project
	 * @type POST
	 * @middleware passport.authenticate - local-signup
	 * @param {Object} user - User object after create
	 * @param {Object} info - Information when something went wrong
	 */
	app.post('/signup', (req, res, next) => {
		passport.authenticate('local-signup', (err, user, info) => {
			//return err if there is one
			if (err) return next(err);
			//when there is a user try to log it in
			if (user) {
				req.login(user, (err) => {
					if (err) return next(err);
					//save session and redirect to projects or dasboard
					req.session.save(() => {
						res.redirect('/projects');
					});
				});
			} else {
				res.status(400).json(info);
			}
		})(req, res, next);
	});

	/**
	 * Single project
	 * @type GET
	 * @middleware isLoggedIn
	 * @param {Int} req.user.id - User session ID
	 * @param {Int} req.params.id - Project ID
	 */
	app.post('/login', (req, res, next) => {
		passport.authenticate('local-signin', (err, user, info) => {
			if (err) return next(err);
			if (user) {
				req.logIn(user, (err) => {
					if (err) return next(err);

					const rest = getUserInfo(user);
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
	app.post('/logout', logOut, (req, res) => {
		res.send({
			code: 0,
			message: 'logout succesful'
		});
	});
};
