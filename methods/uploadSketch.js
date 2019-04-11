const path = require('path');
const multer = require('multer');
const checkOrCreateFolder = require('./checkOrCreateFolder');
const { models } = require('../db');
const { Project, User, Color } = models;
const ntc = require('ntc');
const StreamZip = require('node-stream-zip');
const fs = require('fs');

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
		await project.increment('version');

		//create folder structure
		//dots on end have to be there cause mkdirp function only makes directorys and won't recognize if there is no end on the file
		const version = project.version + 1;
		const localPath = `./uploads/projects/${projectID}/${version}/sketch/.`;
		await checkOrCreateFolder(localPath);

		//save sketch to destination
		const storage = multer.diskStorage({
			destination(req, file, cb) {
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

		// Upload file
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
				//next function is unzipSketchFiles
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
 * unzipSketchFiles
 * @param {Int} res.locals.projectID - Project ID
 * @param {Int} res.locals.projectVersion - User session ID
 * @return Next() or Err
 */
const unzipSketchFiles = async (req, res) => {
	const projectID = res.locals.projectID;
	const version = res.locals.projectVersion;
	res.locals.fileNames = [];
	if (req.files) {
		try {
			await unzipAllFiles(req, res, projectID, version);
			return true;
		} catch (e) {
			return false;
		}
	}
};

const scanInfo = async (req, res, next) => {
	const projectId = req.params.id;
	const project = await Project.findByPk(projectId);
	const version = project.version;
	const fileNames = req.body.fileNames;
	if (!fs.existsSync(`./uploads/projects/${projectId}/${version}/unzip`)) {
		res.status(202).json({
			code: 0,
			message: 'Server is still processing the data, try again later'
		});
		return;
	}
	scanAllColors(projectId, fileNames);
	scanAllDocumentTypo(projectId, fileNames);
	res.send('ok');
	// next();
};

module.exports = {
	uploadSketchFiles,
	unzipSketchFiles,
	scanInfo
};

/**
 * Helper functions
 */
/**
 * unzipAllFiles - Unzip all files in req.riles async (waits for all files)
 * @param {Obj} req - Express req
 * @param {Obj} res - Express res
 * @return Promise
 */
const unzipAllFiles = (req, res, projectID, version) => {
	return Promise.all(
		req.files.map((file) => {
			const folderPath = `./uploads/projects/${projectID}/${version}/unzip/${file.filename
				.split('.zip')[0]
				.toLowerCase()
				.split(' ')
				.join('_')}`;

			//save folder names to next functiopn
			res.locals.fileNames.push(folderPath);
			return unzipSingleFile(folderPath, file);
		})
	);
};
const scanAllDocumentTypo = (projectId, fileNames) => {
	let allTypo = {};
	fileNames.map((file) => {
		const rawdata = fs.readFileSync(`${file}/document.json`);
		const documentData = JSON.parse(rawdata);
		// foreignTextStyles .localSharedStyle
		documentData.layerTextStyles.objects.forEach((typo) => {
			const name = typo.name.split('/').map((singleName) => singleName.toLowerCase());
			const possibilities = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'];
			name.forEach((singleName) => {
				if (possibilities.includes(singleName)) {
					const indexOf = name.indexOf(singleName);
					name.splice(indexOf, 1);
					const obj = {
						name,
						value: {
							color: typo.value.textStyle.encodedAttributes.MSAttributedStringColorAttribute,
							font: {
								name: typo.value.textStyle.encodedAttributes.MSAttributedStringFontAttribute.attributes.name,
								size: typo.value.textStyle.encodedAttributes.MSAttributedStringFontAttribute.attributes.size
							},
							kerning: typo.value.textStyle.encodedAttributes.kerning,
							size: typo.value.textStyle.encodedAttributes.paragraphStyle
						}
					};

					if (!allTypo[singleName]) {
						allTypo[singleName] = {
							allValues: [obj],
							allSizes: [typo.value.textStyle.encodedAttributes.MSAttributedStringFontAttribute.attributes.size]
						};
					} else {
						allTypo[singleName].allValues.push(obj);
						allTypo[singleName].allSizes.push(
							typo.value.textStyle.encodedAttributes.MSAttributedStringFontAttribute.attributes.size
						);
					}
				}
			});
		});
	});
	Object.keys(allTypo).forEach((key) => {
		// key is equal to h1 or lower
		const allValues = allTypo[key].allValues;
		const minSize = Math.min(...allTypo[key].allSizes);
		const maxSize = Math.max(...allTypo[key].allSizes);
		allValues.forEach((typo) => {
			//we need to check if the typo contains our size
			const names = typo.name;
			const filterNames = [
				'375',
				'mobile',
				'tablet',
				'smalldesktop',
				'768',
				'landscape',
				'1920',
				'1440',
				'desktop',
				'full'
			];
			names.forEach((name) => {
				if (filterNames.includes(name)) {
					const indexOf = names.indexOf(name);
					names.splice(indexOf, 1);
				}
			});
			console.log(names, key);
			// const mobileSize = typo.find(())
		});
	});
};

const scanAllColors = (projectId, fileNames) => {
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
					projectId,
					ogName: color.ogName
				}
			});
			if (!colorExist) {
				await Color.create(color);
			}
		});
		return true;
	} catch (e) {
		return false;
	}
};

/**
 * unzipAllFiles - Opens up zip and opens a promise stream for each file, looops trough all files and waits on finish to resolve
 * @param {String} folderPath - The path where the file needs to be saved
 * @param {Obj} file - The zipped file
 * @return Promise
 */
const unzipSingleFile = async (folderPath, file) => {
	return new Promise((resolve) => {
		let index = 0;
		let count = 0;
		//create zip instance of file
		const zip = new StreamZip({
			file: file.path
		});

		zip.on('ready', () => {
			count = zip.entriesCount;
		});

		zip.on('entry', async (entry) => {
			const pathname = path.resolve(folderPath, entry.name);

			//test if url is not malicious
			if (/\.\./.test(path.relative(folderPath, pathname))) {
				console.warn('[zip warn]: ignoring maliciously crafted paths in zip file:', entry.name);
				return;
			}
			await checkOrCreateFolder(pathname);
			//enter stream
			zip.stream(entry.name, async (err, stream) => {
				if (err) {
					console.error('Error:', err.toString());
					index++;
					return;
				}
				await streamToPipe(stream, pathname);
				index++;
				if (index === count) {
					zip.close();
					resolve();
				}
			});
		});
	});
};

/**
 * streamToPipe - Opens up a pipe stream using fs, needs stream and pathname, this functions makes it async
 * @param {Obj} stream - Stream of data (large object)
 * @param {String} pathname - The location where it needs to be saved
 * @return Promise
 */
const streamToPipe = async (stream, pathname) => {
	return new Promise((resolve) => {
		const file = fs.createWriteStream(pathname);
		file.on('error', (err) => {
			console.log('error', err);
		});
		stream.pipe(file);
		file.on('finish', resolve);
	});
};

/**
 * ColorFormatter - Changes rgba object to hex and hex css and color name. ntc dependend
 * @constructor {Obj} rgba - red green blue and alpha values. (255 255 255 1)
 * @return ColorFormatter instance
 * @get hex || hexToCss - returns hex value as object or as CSS values
 * @get rgba - returns rgba object
 * @get colorName - returns a colorname based on ntc
 * @set rgba - sets hex and rgba values
 * @set hex - sets hex value and name
 * @set colorname - sets colorname based on hex css value
 */
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
			//filter alpha cause hex doesnt support it
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
