const { isLoggedIn, sketch } = require('../methods');
const {
	uploadSketchFiles,
	unzipSketchFiles,
	scanAllData,
	uploadFonts,
	confirmTypo,
	confirmColors,
	confirmGrid
} = sketch;

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
		async (req, res) => {
			//unzip the sketch files
			res.send({
				code: 0,
				message: 'succes'
			});
			await unzipSketchFiles(req, res);
			req.params.element = 'typo';
			await scanAllData(req, res, false);
			req.params.element = 'colors';
			await scanAllData(req, res, false);
			req.params.element = 'grid';
			await scanAllData(req, res, false);
		}
	);

	/**
	 * Upload a sketch file
	 * @type Post
	 * @middleware isLoggedIn
	 * @middleware uploadSketchFiles
	 * @middleware unzipSketchFiles
	 */
	app.get('/project/:id/upload/:element', isLoggedIn, scanAllData);

	app.post('/project/:id/upload/fonts', isLoggedIn, uploadFonts);

	app.post('/project/:id/upload/typo', isLoggedIn, confirmTypo);

	app.post('/project/:id/upload/colors', isLoggedIn, confirmColors);

	app.post('/project/:id/upload/grid', isLoggedIn, confirmGrid);
};
