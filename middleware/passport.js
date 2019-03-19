const bcrypt = require('bcrypt');
module.exports = (passport, User) => {
	const LocalStrategy = require('passport-local').Strategy;
	passport.use(
		'local-signup',
		new LocalStrategy(
			{
				usernameField: 'username',
				email: 'email',
				firstName: 'firstName',
				lastName: 'lastName',
				passwordField: 'password',
				passReqToCallback: true // allows us to pass back the entire request to the callback
			},
			async (req, username, password, done) => {
				const emailUser = await User.findOne({
					where: {
						email: req.body.email
					}
				});

				const usernameUser = await User.findOne({
					where: {
						username
					}
				});

				if (emailUser) {
					return done(null, false, {
						code: 1, // 1 stands for: your request can't be procesed
						message: 'That email is already taken'
					});
				} else if (usernameUser) {
					return done(null, false, {
						code: 1, // 1 stands for: your request can't be procesed
						message: 'That username is already taken'
					});
				} else {
					const hash = await bcrypt.hash(password, 10);
					const userCreated = await User.create({
						username: username,
						email: req.body.email,
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
				usernameField: 'username',
				passwordField: 'password',
				passReqToCallback: true // allows us to pass back the entire request to the callback
			},
			async (req, username, password, done) => {
				const isValidPassword = (userpass, password) => {
					return bcrypt.compareSync(password, userpass);
				};

				//first find an user with an email as username
				let user;
				user = await User.findOne({
					where: {
						email: username
					}
				});

				//if there is not user find a user with a username
				if (!user) {
					user = await User.findOne({
						where: {
							username
						}
					});
				}

				//still no user, there is no user
				if (!user) {
					return done(null, false, {
						code: 1,
						message: 'Username is incorrect, your username can also be your email'
					});
				}

				if (!isValidPassword(user.password, password)) {
					return done(null, false, {
						code: 1,
						message: 'Incorrect password.'
					});
				}

				const userinfo = user.get();
				return done(null, userinfo);
			}
		)
	);

	passport.serializeUser((user, done) => {
		done(null, user.id);
	});

	passport.deserializeUser(async (id, done) => {
		const user = await User.findOne({
			where: {
				id
			}
		});
		if (user) {
			done(null, user);
		} else done(user.errors, null);
	});
};
