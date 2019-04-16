const bcrypt = require('bcrypt');
const { isLoggedIn, logOut } = require('../methods');
const { models } = require('../db');
const { User } = models;
const { getUserInfo } = require('../methods');

const { uploadImage } = require('../methods');
const { clearFolderOnUpload, upload } = uploadImage;

module.exports = (app, passport) => {
	/**
	 * Signup
	 * @type POST
	 * @middleware passport.authenticate - local-signup
	 * @param {Object} user - User object after create
	 * @param {Object} info - Information when something went wrong
	 * @return {redirect || 400} Redirect to projects or get a 400
	 */
	app.post('/signup', (req, res, next) => {
		passport.authenticate('local-signup', (err, user, info) => {
			//return err if there is one
			if (err) return next(err);
			if (info && info.code === 5) {
				res.send(info);
				return;
			}
			//when there is a user try to log it in
			if (user) {
				req.login(user, (err) => {
					if (err) return next(err);
					//save session and redirect to projects or dasboard
					req.session.save(() => {
						res.status(200).json({
							code: 4,
							message: 'redirect',
							redirect: `/projects`,
							fName: user.firstName
						});
					});
				});
			} else {
				res.status(400).json(info);
			}
		})(req, res, next);
	});

	/**
	 * Login
	 * @type POST
	 * @middleware passport.authenticate - local-signin
	 * @param {Object} req.body.username - User email or username
	 * @param {Object} req.body.password - User password
	 * @return {redirect} Redirect to projects or get a message
	 */
	app.post('/login', (req, res, next) => {
		passport.authenticate('local-signin', (err, user, info) => {
			if (err) return next(err);
			if (info && info.code === 5) {
				res.send(info);
				return;
			}
			if (user) {
				req.logIn(user, (err) => {
					if (err) return next(err);
					req.session.save(() => {
						if (req.query.redirect) {
							res.status(200).json({
								code: 4,
								message: 'redirect',
								redirect: req.query.redirect,
								fName: user.firstName
							});
						} else {
							res.status(200).json({
								code: 4,
								message: 'redirect',
								redirect: '/projects',
								fName: user.firstName
							});
						}
					});
				});
			} else {
				res.status(400).json(info);
			}
		})(req, res, next);
	});

	/**
	 * Logout
	 * @middleware logOut - middleware function
	 * @type POST
	 */
	app.post('/logout', logOut);

	/**
	 * Change profile image
	 * @middleware isLoggedIn - middleware function
	 * @middleware single upload - middleware function
	 * @middleware handle upload to db - middleware function
	 * @type POST
	 * @return {Object} code 0 or 1
	 */
	app.post(
		'/user/image',
		//has to be logged in
		isLoggedIn,
		//upload
		(req, res, next) => {
			//middleware is a curry
			upload.single('image')(req, res, (err) => {
				if (err)
					res.status(403).json({
						code: 1,
						message: 'Something went wrong with your upload'
					});
				next();
			});
		},
		//handle rest of upload
		async (req, res) => {
			if (req.file) {
				await clearFolderOnUpload(req.file);

				await User.update(
					{
						image: req.file.path
					},
					{
						where: {
							id: req.user.id
						}
					}
				);
				res.send({
					code: 0,
					message: 'Image upload succesful'
				});
			}
		}
	);

	/**
	 * Change password
	 * @middleware isLoggedIn - middleware function
	 * @type POST
	 * @return {Object} code 0 or 1 - if 0 password is changed, session keeps the same
	 */
	app.post('/user/password', isLoggedIn, async (req, res) => {
		const userID = req.user.id;
		const user = await User.findOne({
			raw: true,
			where: {
				id: userID
			}
		});
		//dubble check if user is logged in
		if (!user) {
			res.status(200).json({
				code: 4,
				message: 'redirect',
				redirect: `/login`
			});
		}

		//isSamePassword check (bcrypt)
		const isSamePassword = (userpass, password) => {
			return bcrypt.compareSync(password, userpass);
		};

		const oldPass = req.body.oldPassword;
		const newPas = req.body.password;

		//Check if the user enters the same old pass, otherwise don't contintue
		if (!isSamePassword(user.password, oldPass)) {
			res.status(200).json({
				code: 5,
				message: 'Old Password is incorrect',
				error: true
			});
		} else if (isSamePassword(user.password, newPas)) {
			//check if it is not the same pass as the old one, bcrypt is a better check then old pass to new pass check
			res.status(200).json({
				code: 5,
				message: 'Password can not be an old password',
				error: true
			});
		} else {
			//if everything goes well change it
			const hash = await bcrypt.hash(newPas, 10);

			await User.update(
				{
					password: hash
				},
				{
					where: {
						id: userID
					}
				}
			);
			const restData = getUserInfo(user);
			res.send(restData);
		}
	});
};
