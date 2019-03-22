const { promisify } = require('util');
const fs = require('fs');
const unlinkAsync = promisify(fs.unlink);
const path = require('path');
const multer = require('multer');

//multer settings
const storage = multer.diskStorage({
	destination(req, file, cb) {
		console.log(req);
		const projectID = req.params.id;
		const projectFolder = `./uploads/projects/${projectID}`;

		if (!fs.existsSync(projectFolder)) {
			fs.mkdirSync(projectFolder);
		}

		const localPath = `./uploads/projects/${projectID}/sketch`;
		if (!fs.existsSync(localPath)) {
			fs.mkdirSync(localPath);
		}
		cb(null, localPath);
	},
	filename(req, file, cb) {
		cb(null, `${Date.now()}${path.extname(file.originalname)}`);
	}
});

//functions
const uploadFunctions = {
	upload: multer({
		storage,
		fileFilter(req, file, callback) {
			const ext = path.extname(file.originalname);
			if (ext !== '.sketch') {
				return callback(new Error('Only Sketch files are allowed'));
			}
			callback(null, true);
		}
	}),
	checkOrCreateFolder(path) {
		if (!fs.existsSync(path)) {
			fs.mkdirSync(path);
		}
		return path;
	},
	async clearFolderOnUpload(file) {
		fs.readdir(file.destination, (err, filenames) => {
			filenames.forEach(async (filename) => {
				if (filename !== file.filename) {
					await unlinkAsync(`${file.destination}/${filename}`);
				}
			});
		});
	}
};

module.exports = uploadFunctions;
