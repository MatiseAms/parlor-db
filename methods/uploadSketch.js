const path = require('path');
const multer = require('multer');
const checkOrCreateFolder = require('./checkOrCreateFolder');
const { models } = require('../db');
const { Project, User, Color } = models;
const ntc = require('ntc');
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
	res.locals.fileNames = [];
	if (req.files) {
		try {
			await unzipAllFiles(req, res, projectID, version);
			next();
		} catch (e) {
			res.status(500).json({
				code: 3,
				message: 'Something went wrong'
			});
		}
	}
};

const scanAllColors = async (req, res, next) => {
	const projectId = res.locals.projectID;
	// uncomment this but for testing it is 1
	// const projectVersion = res.locals.projectVersion;
	const fileNames = res.locals.fileNames;
	let colorsSet = [];
	let colorNames = [];
	let values = [];
	try {
		fileNames.forEach((file) => {
			const rawdata = fs.readFileSync(`${file}/document.json`);
			const documentData = JSON.parse(rawdata);

			if (documentData) {
				const rawColors = documentData.assets.colorAssets;
				rawColors.forEach((colorObject) => {
					const color = colorObject.color;
					const colorInstance = new ColorFormatter({
						r: Math.round(color.red * 255),
						g: Math.round(color.green * 255),
						b: Math.round(color.blue * 255),
						a: color.alpha
					});
					if (!values.includes(colorInstance.hexToCss)) {
						values.push(colorInstance.hexToCss);
						let double = false;
						const indexOf = colorNames.indexOf(colorInstance.colorName);
						if (indexOf > -1) {
							double = true;
							colorsSet[indexOf].doubleName = true;
						}

						colorNames.push(colorInstance.colorName);

						colorsSet.push({
							name: colorObject.name || colorInstance.colorName,
							ogName: colorInstance.colorName,
							value: colorInstance.hexToCss,
							projectId,
							checked: false,
							doubleName: double
						});
					}
				});
			}
		});
		colorsSet.forEach(async (color) => {
			const colorExist = await Color.findOne({
				raw: true,
				where: {
					value: color.value,
					projectId,
					ogName: color.ogName
				}
			});
			if (!colorExist) {
				await Color.create(color);
			}
		});
		next();
	} catch (e) {
		res.status(500).json({
			code: 3,
			message: 'Something went wrong, please try it again',
			e
		});
	}
};

class ColorFormatter {
	constructor(value) {
		this.rgba = value;
	}
	get rgba() {
		return this._rgba;
	}
	set rgba(value) {
		this._rgba = value;
		this.changeRgbaToHex(value);
		return this._rgba;
	}
	get hex() {
		return this._hex;
	}
	set hex(value) {
		this._hex = value;
		this.colorName = this.hexToCss;
		return this._hex;
	}
	get hexToCss() {
		return `#${this._hex.r}${this._hex.g}${this._hex.b}`;
	}
	changeRgbaToHex(val) {
		let hex = {};
		Object.keys(val).forEach((color) => {
			if (color === 'a') {
				hex.a = val[color];
			} else {
				const s = Math.round(val[color]).toString(16);
				hex[color] = s.length === 1 ? `0${s}` : s;
			}
		});
		this.hex = hex;
	}
	set colorName(value) {
		const name = ntc.name(value);
		this.name = name[1];
	}
	get colorName() {
		return this.name;
	}
}

module.exports = {
	uploadSketchFiles,
	unzipSketchFiles,
	scanAllColors
};

//loop trough all files
const unzipAllFiles = async (req, res, projectID, version) => {
	return new Promise((resolve) => {
		req.files.forEach(async (file, i) => {
			await unzipThings(req, res, projectID, version, file);
			if (i === req.files.length - 1) {
				resolve();
			}
		});
	});
};

const streamShizzle = async (stream, pathname) => {
	return new Promise((resolve) => {
		const file = fs.createWriteStream(pathname);
		file.on('error', (err) => {
			console.log('error', err);
		});
		stream.pipe(file);
		file.on('finish', resolve);
	});
};

const unzipThings = async (req, res, projectID, version, file) => {
	return new Promise((resolve) => {
		let index = 0;
		//create zip instance of file
		const zip = new StreamZip({
			file: file.path
		});
		//on entry check zip file
		res.locals.fileNames.push(
			`./uploads/projects/${projectID}/${version}/unzip/${file.filename
				.split('.zip')[0]
				.toLowerCase()
				.split(' ')
				.join('_')}`
		);
		let count = 0;
		zip.on('ready', () => {
			count = zip.entriesCount;
		});

		zip.on('entry', async (entry) => {
			var pathname = path.resolve(
				`./uploads/projects/${projectID}/${version}/unzip/${file.filename
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
						`./uploads/projects/${projectID}/${version}/unzip/${file.filename
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
			await folderCreate(pathname);
			//enter stream
			zip.stream(entry.name, async (err, stream) => {
				if (err) {
					console.error('Error:', err.toString());
					return;
				}
				await streamShizzle(stream, pathname);
				index++;
				if (index === count) {
					resolve();
					zip.close();
				}
			});
		});
	});
};

const folderCreate = (pathname) => {
	return new Promise((resolve) => {
		//create folders if there is one needed
		mkdirp(path.dirname(pathname), resolve);
	});
};
