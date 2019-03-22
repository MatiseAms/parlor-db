const { isLoggedIn } = require('../methods');
const { uploadSketch } = require('../methods');
const { upload } = uploadSketch;
const AdmZip = require('adm-zip');

module.exports = (app) => {
	/**
	 * All projects
	 * @type GET
	 * @middleware isLoggedIn
	 * @param {Int} req.user.id - User session ID
	 */
	app.post(
		'/project/:id/upload',
		isLoggedIn,
		(req, res, next) => {
			//middleware is a curry
			upload.array('sketch')(req, res, (err) => {
				if (err) {
					res.status(403).json({
						code: 1,
						message: 'Something went wrong with your upload'
					});
				} else {
					next();
				}
			});
		},
		//handle rest of upload
		async (req, res) => {
			if (req.files) {
				console.log(req.files[0]);

				const zip = new AdmZip(req.files[0].path);
				await zip.extractAllToAsync(`${req.files[0].destination}/${req.files[0].originalname}`);
				res.send('ok');
			}
		}
	);
};
