const bcrypt = require('bcrypt');
module.exports = (passport, User) => {
	const LocalStrategy = require('passport-local').Strategy;
	passport.use(
		'local-signup',
		new LocalStrategy(
			{
				usernameField: 'email',
				firstName: 'firstName',
				lastName: 'lastName',
				passwordField: 'password',
				passReqToCallback: true // allows us to pass back the entire request to the callback
			},
			async (req, username, password, done) => {
				const user = await User.findOne({
					where: {
						email: username
					}
				});

				if (user) {
					return done(null, false, {
						message: 'That email is already taken'
					});
				} else {
					const saltRounds = 10;
					const hash = await bcrypt.hash(password, saltRounds);
					const userCreated = User.create({
						email: username,
						password: hash,
						firstName: req.body.fName,
						lastName: req.body.lName
					});
					return done(null, userCreated);
				}
			}
		)
	);

	passport.use(
		'local-signin',
		new LocalStrategy(
			{
				// by default, local strategy uses username and password, we will override with email
				usernameField: 'email',
				passwordField: 'password',
				passReqToCallback: true // allows us to pass back the entire request to the callback
			},
			async (req, email, password, done) => {
				const isValidPassword = (userpass, password) => {
					return bcrypt.compareSync(password, userpass);
				};

				const user = await User.findOne({
					where: {
						email: email
					}
				});

				if (!user) {
					return done(null, false, {
						message: 'Email does not exist'
					});
				}

				if (!isValidPassword(user.password, password)) {
					return done(null, false, {
						message: 'Incorrect password.'
					});
				}

				const userinfo = user.get();
				return done(null, userinfo);
			}
		)
	);

	passport.serializeUser((user, done) => {
		done(null, user);
	});

	passport.deserializeUser((user, done) => {
		done(null, user);
	});
};
