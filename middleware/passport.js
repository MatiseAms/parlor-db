const bcrypt = require('bcrypt');
const { db } = require('../db');
const { Sequelize } = db;
const Op = Sequelize.Op;
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
				//check if there is already a user with that email or username
				const userExist = await User.findOne({
					where: {
						[Op.or]: [
							{
								email: req.body.email
							},
							{
								username
							}
						]
					}
				});

				if (userExist && userExist.email === req.body.email) {
					return done(null, false, {
						code: 1, // 1 stands for: your request can't be procesed
						message: 'That email is already taken'
					});
				} else if (userExist && userExist.username === username) {
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
						lastName: req.body.lName,
						image: 'uploads/avatar.png'
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

				const user = await User.findOne({
					raw: true,
					where: {
						[Op.or]: [
							{
								email: username
							},
							{
								username
							}
						]
					}
				});

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
