const { isLoggedIn, logOut } = require('../middleware/loginSession');
const { dbFunctions, models } = require('../db');
const { User } = models;
const { getUserInfo } = dbFunctions;
const path = require('path');

const multer = require('multer');

const storage = multer.diskStorage({
	destination(req, file, cb) {
		cb(null, 'uploads/profile');
	},
	filename(req, file, cb) {
		cb(null, `${Date.now()}.${path.extname(file.originalname)}`);
	}
});

const upload = multer({
	storage,
	fileFilter(req, file, callback) {
		const ext = path.extname(file.originalname);
		if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
			return callback(new Error('Only images are allowed'));
		}
		callback(null, true);
	},
	limits: {
		fileSize: 1024 * 1024
	}
});

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

	/**
	 * Logout
	 * @middleware logOut - middleware function
	 * @type POST
	 */
	app.post('/logout', logOut, (req, res) => {
		res.send({
			code: 0,
			message: 'logout succesful'
		});
	});

	app.post('/user/image', isLoggedIn, upload.single('image'), async (req, res) => {
		if (req.file) {
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
	});
};
