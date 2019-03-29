const path = require('path');
const multer = require('multer');
const checkOrCreateFolder = require('./checkOrCreateFolder');
const { models } = require('../db');
const { Project, User } = models;

const StreamZip = require('node-stream-zip');
const fs = require('fs');
var mkdirp = require('mkdirp');

/**
 * uploadSketchFiles
 * @param {Int} req.params.id - Project ID
 * @param {Int} req.user.id - User session ID
 * @return Next() or Err
 */
const uploadSketchFiles = async (req, res, next) => {
	const projectID = req.params.id;

	//we need a version to extract the files into
	const project = await Project.findByPk(projectID);
	const user = await User.findByPk(req.user.id);
	//check if user belongs to project
	const projectHasUser = await project.hasUser(user);
	//if there is a user continue
	if (projectHasUser) {
		//increment project (returns old project)
		const newProject = await project.increment('version');
		const version = newProject.version + 1;
		//create folder structure
		const folders = ['uploads', 'projects', projectID, version, 'sketch'];
		//check or create all these folders
		const localPath = checkOrCreateFolder(folders);
		//save sketch to destination
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
		//create upload function
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

		// upload file
		upload.array('sketch')(req, res, (err) => {
			if (err) {
				res.status(403).json({
					code: 1,
					message: 'Something went wrong with your upload'
				});
			} else {
				//save project ID for unzipping
				res.locals.projectID = projectID;
				res.locals.projectVersion = version;
				next();
			}
		});
	} else {
		res.status(404).json({
			code: 3,
			message: 'No project found with this ID'
		});
	}
};

/**
 * uploadSketchFiles
 * @param {Int} res.locals.projectID - Project ID
 * @param {Int} res.locals.projectVersion - User session ID
 * @return Next() or Err
 */
const unzipSketchFiles = async (req, res, next) => {
	const projectID = res.locals.projectID;
	const version = res.locals.projectVersion;
	if (req.files) {
		//loop trough all files
		req.files.forEach((file) => {
			//create zip instance of file
			const zip = new StreamZip({
				file: file.path
			});
			//on entry check zip file
			zip.on('entry', (entry) => {
				var pathname = path.resolve(
					`./uploads/projects/${projectID}/${version}/${file.filename
						.split('.zip')[0]
						.toLowerCase()
						.split(' ')
						.join('_')}`,
					entry.name
				);
				//test if url is not malicious
				if (
					/\.\./.test(
						path.relative(
							`./uploads/projects/${projectID}/${version}/${file.filename
								.split('.zip')[0]
								.toLowerCase()
								.split(' ')
								.join('_')}`,
							pathname
						)
					)
				) {
					console.warn('[zip warn]: ignoring maliciously crafted paths in zip file:', entry.name);
					return;
				}
				//create folders if there is one needed
				mkdirp(path.dirname(pathname));
				//enter stream
				zip.stream(entry.name, (err, stream) => {
					if (err) {
						console.error('Error:', err.toString());
						return;
					}
					stream.on('error', (err) => {
						console.log('[ERROR]', err);
						return;
					});
					//pipe stream to right place
					stream.pipe(fs.createWriteStream(pathname));
				});
			});
			//close is important, otherwise hell breaks lose
			zip.close();
		});
		next();
	}
};

module.exports = {
	uploadSketchFiles,
	unzipSketchFiles
};
