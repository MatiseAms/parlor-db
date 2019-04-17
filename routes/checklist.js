const { isLoggedIn, sketch } = require('../methods');
const { uploadSketchFiles, unzipSketchFiles, scallAllData } = sketch;

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
		(req, res) => {
			//unzip the sketch files
			unzipSketchFiles(req, res);
			const fileNames = res.locals.fileNames;
			res.send(fileNames);
		}
	);

	/**
	 * Upload a sketch file
	 * @type Post
	 * @middleware isLoggedIn
	 * @middleware uploadSketchFiles
	 * @middleware unzipSketchFiles
	 */
	app.get('/project/:id/upload/:element', isLoggedIn, scallAllData);
};
