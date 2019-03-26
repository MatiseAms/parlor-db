const path = require('path');
const multer = require('multer');
const { isLoggedIn } = require('../methods');
const { checkOrCreateFolder } = require('../methods');
const { models } = require('../db');
const { Project } = models;

const StreamZip = require('node-stream-zip');
const fs = require('fs');
var mkdirp = require('mkdirp');

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
		async (req, res, next) => {
			const projectID = req.params.id;
			//we need a version to extract the files into

			const project = await Project.findByPk(projectID);
			const newProject = await project.increment('version');
			const folders = ['uploads', 'projects', projectID, newProject.version + 1, 'sketch'];
			const localPath = checkOrCreateFolder(folders);

			const storage = multer.diskStorage({
				destination(req, file, cb) {
					//localPath is './uploads/projects'/PROJECTID/VERSION/sketch
					cb(null, localPath);
				},
				filename(req, file, cb) {
					const name = file.originalname.split('.sketch');
					cb(null, `${name[0]}.zip`);
				}
			});
			const upload = multer({
				storage,
				fileFilter(req, file, callback) {
					const ext = path.extname(file.originalname);
					if (ext !== '.sketch') {
						return callback(new Error('Only Sketch files are allowed'));
					}
					callback(null, true);
				}
			});
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
				const project = await Project.findByPk(req.params.id);
				const version = project.version;
				req.files.forEach(async (file) => {
					const zip = new StreamZip({
						file: file.path
					});
					zip.on('entry', function(entry) {
						var pathname = path.resolve(
							`./uploads/projects/${req.params.id}/${version}/${file.filename.split('.zip')[0]}`,
							entry.name
						);
						if (
							/\.\./.test(
								path.relative(`./uploads/projects/${req.params.id}/${version}/${file.filename.split('.zip')[0]}`, pathname)
							)
						) {
							console.warn('[zip warn]: ignoring maliciously crafted paths in zip file:', entry.name);
							return;
						}

						if (entry.name[entry.name.length - 1] === '/') {
							console.log('[DIR]', entry.name);
							return;
						}

						console.log('[FILE]', entry.name);
						mkdirp(path.dirname(pathname));
						zip.stream(entry.name, function(err, stream) {
							if (err) {
								console.error('Error:', err.toString());
								return;
							}
							stream.on('error', function(err) {
								console.log('[ERROR]', err);
								return;
							});
							stream.pipe(fs.createWriteStream(pathname));
						});
					});
					zip.close();
				});
				res.send('ok');
			}
		}
	);
};
