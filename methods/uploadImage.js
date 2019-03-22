const { promisify } = require('util');
const fs = require('fs');
const unlinkAsync = promisify(fs.unlink);
const path = require('path');
const multer = require('multer');

//multer settings
const storage = multer.diskStorage({
	destination(req, file, cb) {
		const localPath = `./uploads/profile/${req.session.passport.user}`;
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
			if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg' && ext !== '.svg') {
				return callback(new Error('Only images are allowed'));
			}
			callback(null, true);
		},
		limits: {
			fileSize: 1024 * 1024
		}
	}),
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
