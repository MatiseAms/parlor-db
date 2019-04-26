const bcrypt = require('bcrypt');
const { db, models } = require('../db');
const { Sequelize } = db;
const Op = Sequelize.Op;
const { User } = models;

module.exports = (passport) => {
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
				//check if there is already a user with that email or username
				const userExist = await User.findOne({
					where: {
						[Op.or]: [
							{
								email: req.body.email
							},
							{
								username: username.toLowerCase()
							}
						]
					}
				});

				if (userExist && userExist.email === req.body.email) {
					return done(null, false, {
						code: 5,
						message: 'That email is already taken',
						error: 'email'
					});
				} else if (userExist && userExist.username === username) {
					return done(null, false, {
						code: 5,
						message: 'That username is already taken',
						error: 'username'
					});
				} else {
					const hash = await bcrypt.hash(password, 10);
					try {
						const userCreated = await User.create({
							username: username.toLowerCase(),
							email: req.body.email,
							password: hash,
							firstName: req.body.fName,
							lastName: req.body.lName,
							image: 'uploads/avatar.png'
						});
						return done(null, userCreated);
					} catch (e) {
						return done(null, false, e);
					}
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

				const user = await User.findOne({
					raw: true,
					where: {
						[Op.or]: [
							{
								email: username
							},
							{
								username: username.toLowerCase()
							}
						]
					}
				});

				//still no user, there is no user
				if (!user) {
					return done(null, false, {
						code: 5,
						message: 'Username is incorrect, your username can also be your email',
						error: 'username'
					});
				}

				if (!isValidPassword(user.password, password)) {
					return done(null, false, {
						code: 5,
						message: 'Incorrect password',
						error: 'password'
					});
				}
				return done(null, user);
			}
		)
	);

	passport.serializeUser((user, done) => {
		done(null, user.id);
	});

	passport.deserializeUser(async (id, done) => {
		const user = await User.findByPk(id);
		if (user) {
			done(null, user);
		} else {
			done(user.errors, null);
		}
	});
};
