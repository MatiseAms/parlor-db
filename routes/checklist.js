const { isLoggedIn, sketch } = require('../methods');
const { uploadSketchFiles, unzipSketchFiles } = sketch;

module.exports = (app) => {
	/**
	 * Upload a sketch file
	 * @type Post
	 * @middleware isLoggedIn
	 * @middleware uploadSketchFiles
	 * @middleware unzipSketchFiles
	 */
	app.post(
		'/project/:id/upload',
		//check if user is logged in
		isLoggedIn,
		//upload the sketch file
		uploadSketchFiles,
		//unzip the sketch files
		unzipSketchFiles,
		(req, res) => {
			res.send('hoi');
		}
	);
};
