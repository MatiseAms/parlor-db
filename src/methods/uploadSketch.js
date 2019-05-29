const path = require('path');
const multer = require('multer');
const checkOrCreateFolder = require('./checkOrCreateFolder');
const { models } = require('../db');
const { Project, User, Color, Typography, Grid } = models;
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

	if (!project) {
		res.status(404).json({
			code: 3,
			message: 'No project found with this ID'
		});
		return;
	}
	//check if user belongs to project
	const projectHasUser = await project.hasUser(user);
	//if there is a user continue
	if (projectHasUser) {
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
		upload.array('sketch')(req, res, async (err) => {
			if (err) {
				res.status(403).json({
					code: 1,
					message: 'Something went wrong with your upload'
				});
			} else {
				if (req.files) {
					//save project ID for unzipping
					res.locals.projectID = projectID;
					res.locals.projectVersion = version;
					//next function is unzipSketchFiles
					await project.update({
						version,
						gridStatus: false,
						fontStatus: false,
						colorStatus: false,
						typoStatus: false
					});
					next();
				} else {
					res.status(500).json({
						code: 3,
						message: 'Something went wrong'
					});
					return;
				}
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
 * confirmGrid
 * @param {Int} req.params.id - Project ID
 * @param {Int} req.user.id - User session ID
 * @return Next() or Err
 */
const confirmGrid = async (req, res) => {
	const projectID = req.params.id;
	//we need a version to extract the files into
	const project = await Project.findByPk(projectID);
	const user = await User.findByPk(req.user.id);

	if (!project) {
		res.status(404).json({
			code: 3,
			message: 'No project found with this ID'
		});
		return;
	}
	//check if user belongs to project
	const projectHasUser = await project.hasUser(user);
	//if there is a user continue
	if (projectHasUser) {
		// Upload file
		const grid = req.body.grid;

		await Grid.update(
			{
				value: grid,
				checked: true
			},
			{
				where: {
					projectId: projectID
				}
			}
		);
		await project.update({
			gridStatus: true
		});
		res.send({
			code: 0,
			message: 'succes'
		});
	} else {
		res.status(404).json({
			code: 3,
			message: 'No project found with this ID'
		});
	}
};

/**
 * confirmColors
 * @param {Int} req.params.id - Project ID
 * @param {Int} req.user.id - User session ID
 * @return Next() or Err
 */
const confirmColors = async (req, res) => {
	const projectID = req.params.id;
	//we need a version to extract the files into
	const project = await Project.findByPk(projectID);
	const user = await User.findByPk(req.user.id);

	if (!project) {
		res.status(404).json({
			code: 3,
			message: 'No project found with this ID'
		});
		return;
	}
	//check if user belongs to project
	const projectHasUser = await project.hasUser(user);
	//if there is a user continue
	if (projectHasUser) {
		// Upload file
		const colors = req.body.colors;

		await Promise.all(
			colors.map(async (color) => {
				const colorExists = await Color.findByPk(color.id);
				if (colorExists) {
					return await colorExists.update({
						name: color.name,
						value: color.value,
						checked: true
					});
				} else {
					//create it
					return await Color.create({
						name: color.name,
						value: color.value,
						ogName: color.name,
						checked: true
					});
				}
			})
		);
		//delete remaingin typo
		await Color.destroy({
			where: {
				projectId: projectID,
				checked: false
			}
		});
		await project.update({
			colorStatus: true
		});
		res.send({
			code: 0,
			message: 'succes'
		});
	} else {
		res.status(404).json({
			code: 3,
			message: 'No project found with this ID'
		});
	}
};

/**
 * confirmTypo
 * @param {Int} req.params.id - Project ID
 * @param {Int} req.user.id - User session ID
 * @return Next() or Err
 */
const confirmTypo = async (req, res) => {
	const projectID = req.params.id;
	//we need a version to extract the files into
	const project = await Project.findByPk(projectID);
	const user = await User.findByPk(req.user.id);

	if (!project) {
		res.status(404).json({
			code: 3,
			message: 'No project found with this ID'
		});
		return;
	}
	//check if user belongs to project
	const projectHasUser = await project.hasUser(user);
	//if there is a user continue
	if (projectHasUser) {
		// Upload file
		const typos = req.body.typographies;

		await Promise.all(
			typos.map(async (typo) => {
				const typoExists = await Typography.findByPk(typo.id);
				if (typoExists) {
					return await typoExists.update({
						minSize: typo.minSize,
						baseSize: typo.baseSize,
						kerning: typo.kerning,
						lineheight: typo.lineheight,
						checked: true,
						colors: typo.colors,
						hasItalic: typo.hasItalic,
						family: typo.family
					});
				} else {
					//create it
					return await Typography.create({
						minSize: typo.minSize,
						baseSize: typo.baseSize,
						kerning: typo.kerning,
						lineheight: typo.lineheight,
						checked: true,
						colors: typo.colors,
						projectId: projectID,
						key: typo.key,
						hasItalic: typo.hasItalic,
						family: typo.family
					});
				}
			})
		);
		//delete remaingin typo
		await Typography.destroy({
			where: {
				projectId: projectID,
				checked: false
			}
		});
		await project.update({
			typoStatus: true
		});
		res.send({
			code: 0,
			message: 'succes'
		});
	} else {
		res.status(404).json({
			code: 3,
			message: 'No project found with this ID'
		});
	}
};

/**
 * uploadFonts
 * @param {Int} req.params.id - Project ID
 * @param {Int} req.user.id - User session ID
 * @return Next() or Err
 */
const uploadFonts = async (req, res) => {
	const projectID = req.params.id;
	//we need a version to extract the files into
	const project = await Project.findByPk(projectID);
	const user = await User.findByPk(req.user.id);

	if (!project) {
		res.status(404).json({
			code: 3,
			message: 'No project found with this ID'
		});
		return;
	}
	const typos = await Typography.findAll({
		raw: true,
		attributes: ['family'],
		where: {
			projectId: projectID
		}
	});
	const typoSet = [...new Set(typos.map((typo) => typo.family))];

	const typoUpload = typoSet.map((typo) => ({
		name: typo
	}));

	//check if user belongs to project
	const projectHasUser = await project.hasUser(user);
	//if there is a user continue
	if (projectHasUser) {
		//create folder structure

		//save sketch to destination
		const storage = multer.diskStorage({
			async destination(req, file, cb) {
				//dots on end have to be there cause mkdirp function only makes directorys and won't recognize if there is no end on the file
				const localPath = `./uploads/projects/${projectID}/fonts/${file.fieldname.toLowerCase()}/.`;
				await checkOrCreateFolder(localPath);
				cb(null, localPath);
			},
			filename(req, file, cb) {
				const fileName = file.originalname.split('-')[1];
				cb(null, `${file.fieldname}-${fileName}`);
			}
		});
		//create upload function
		const upload = multer({
			storage,
			fileFilter(req, file, callback) {
				const ext = path.extname(file.originalname);
				if (ext !== '.woff2') {
					return callback(new Error('Only woff2 files are allowed'));
				}
				callback(null, true);
			}
		});

		// Upload file
		upload.fields(typoUpload)(req, res, async (err) => {
			if (err) {
				console.log(err);
				res.status(403).json({
					code: 1,
					message: 'Something went wrong with your upload'
				});
			} else {
				if (req.files) {
					project.update({
						fontStatus: true
					});
					res.status(201).json({
						code: 0,
						message: 'Upload was succesful'
					});
				} else {
					res.status(500).json({
						code: 3,
						message: 'Something went wrong'
					});
					return;
				}
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

/**
 * scanAllData - Function that calls all scan functions
 * @param {Int} req.params.id - Project ID
 * @return Express response
 */
const scanAllData = async (req, res, option) => {
	const resOrBool = option;
	const query = req.query.scan;
	//element is what scan should be perfmred
	const element = req.params.element;
	//
	const scanOptions = ['typo', 'grid', 'colors'];
	if (!scanOptions.includes(element)) {
		res.send({
			code: 1,
			message: 'Scan option not found'
		});
		return;
	}
	const projectId = req.params.id;
	const project = await Project.findByPk(projectId);

	if (!project) {
		res.status(404).json({
			code: 1,
			message: 'No project found with this ID'
		});
		return;
	}

	const user = await User.findByPk(req.user.id);
	//check if user belongs to project
	const projectHasUser = await project.hasUser(user);

	if (!projectHasUser) {
		res.status(404).json({
			code: 1,
			message: 'No project found with this ID'
		});
		return;
	}

	const version = project.version;

	//little fallback if the unzipping is not done yet
	const projectFolder = `./uploads/projects/${projectId}/${version}/unzip/`;
	//
	if (!fs.existsSync(projectFolder)) {
		res.status(202).json({
			code: 1,
			message: 'Server is still processing the data, try again later'
		});
		return;
	}
	fs.readdir(projectFolder, async (err, files) => {
		//filenames are relative for security, bind them with project folder
		const fileNames = files.map((file) => projectFolder + file);
		let data;
		switch (element) {
			case 'typo':
				if (query) {
					//query means we dont need to scan thins
					data = await scanAllTypo(projectId, fileNames);
					if (data.missingFonts && !data.missingFonts.length) {
						project.update({
							fontStatus: true
						});
					}
				} else {
					const typo = await Typography.findAll({
						raw: true,
						where: {
							projectId
						}
					});
					const allfontFamilies = [...new Set(typo.map((font) => font.family))];
					const missingFonts = allfontFamilies.filter((font) => {
						if (!fs.existsSync(`./uploads/projects/${projectId}/fonts/${font.toLowerCase()}`)) {
							return font;
						}
					});
					data = {
						fonts: typo,
						missingFonts
					};
				}
				break;
			case 'grid':
				data = await scanGrid(projectId, fileNames);
				break;
			case 'colors':
				data = await scanAllColors(projectId, fileNames);
				break;
		}
		if (data.code !== 3) {
			if (resOrBool) {
				res.status(200).json({
					code: 0,
					message: 'Scan succesful',
					data,
					projectTitle: project.name
				});
			} else {
				return true;
			}
		} else {
			if (resOrBool) {
				res.status(202).json({
					code: 1,
					message: 'Server is still processing the data, try again later'
				});
			}
			return;
		}
	});
};

module.exports = {
	uploadSketchFiles,
	unzipSketchFiles,
	uploadFonts,
	scanAllData,
	confirmTypo,
	confirmColors,
	confirmGrid
};

/**
 * Helper functions
 */

/*
 * scanGrid - Scan and save all grid settings
 * @param {Obj} projectId - ProjectID
 * @param {Obj} fileNames - All file names
 * @return Saves everything
 */
const scanGrid = async (projectId, fileNames) => {
	try {
		const pages = fileNames
			.map((file) => {
				const rawdata = fs.readFileSync(`${file}/meta.json`);
				const documentData = JSON.parse(rawdata);
				const pageName = Object.keys(documentData.pagesAndArtboards).find((artboard) => {
					if (documentData.pagesAndArtboards[artboard].name.toLowerCase().indexOf('page') !== -1) {
						const restArtboards = documentData.pagesAndArtboards[artboard].artboards;
						const secondPage = Object.keys(restArtboards).find((restArtboard) => {
							if (
								restArtboards[restArtboard].name.indexOf('1440*900') !== -1 ||
								restArtboards[restArtboard].name.indexOf('1920*1080') !== -1
							) {
								return true;
							}
						});
						if (secondPage) {
							return true;
						}
					}
					if (
						documentData.pagesAndArtboards[artboard].name.indexOf('1440*900') !== -1 ||
						documentData.pagesAndArtboards[artboard].name.indexOf('1920*1080') !== -1
					) {
						return true;
					}
				});
				return {
					pageName,
					file
				};
			})
			.filter((page) => page.pageName);
		const allColumns = [
			...new Set(
				pages.map((page) => {
					const rawdata = fs.readFileSync(`${page.file}/pages/${page.pageName}.json`);
					const documentData = JSON.parse(rawdata);
					const columns = [
						...new Set(
							documentData.layers.map((layer) =>
								layer.layout && layer.layout.numberOfColumns ? layer.layout.numberOfColumns : false
							)
						)
					].filter((column) => column);
					if (columns.length === 1) {
						return columns[0];
					} else {
						//write a fallback for later, now just take the 24 or else the first item
						return columns.includes(24) ? 24 : columns[0];
					}
				})
			)
		];
		let columnAmount = 24;
		if (allColumns.length === 1) {
			columnAmount = allColumns[0];
		} else {
			//write a fallback for later, now just take the 24 or else the first item
			columnAmount = allColumns.includes(24) ? 24 : allColumns[0];
		}
		const olderGrid = await Grid.findOne({
			where: {
				projectId
			}
		});
		if (olderGrid) {
			await olderGrid.update({
				value: columnAmount,
				checked: false
			});
		} else {
			await Grid.create({
				value: columnAmount,
				projectId,
				checked: false
			});
		}
		return columnAmount || 0;
	} catch (e) {
		return {
			code: 3
		};
	}
};

/**
 * scanAllTypo - Scan and save all document typography
 * @param {Obj} projectId - ProjectID
 * @param {Obj} fileNames - All file names
 * @return Saves everything
 */
const scanAllTypo = async (projectId, fileNames) => {
	let allTypo = {};
	try {
		fileNames.forEach((file) => {
			const rawdata = fs.readFileSync(`${file}/document.json`);
			const documentData = JSON.parse(rawdata);
			// foreignTextStyles .localSharedStyle
			documentData.layerTextStyles.objects.forEach((typo) => {
				const newTypo = divideTypo(typo);
				if (newTypo) {
					if (allTypo[newTypo.element]) {
						allTypo[newTypo.element].allValues.push(newTypo);
					} else {
						allTypo[newTypo.element] = {
							allValues: [newTypo]
						};
					}
				}
			});
		});
	} catch (e) {
		return {
			code: 3
		};
	}

	const fonts = Object.keys(allTypo).map((key) => {
		const allValues = allTypo[key].allValues;
		const allSizes = allValues.map((typo) => typo.size);
		const allfontFamilies = allValues.map((typo) => typo.fontFamily);
		const uniqueFonts = [...new Set(allfontFamilies)];
		const setWithKeys = (array, key = 'key') => {
			return array.filter((r, index) => {
				const indexOf = array.findIndex((a) => a[key] === r[key]);
				if (indexOf >= index) {
					return true;
				}
			});
		};
		const fontObj = setWithKeys(
			uniqueFonts
				.map((font) => {
					if (font.toLowerCase().indexOf('-ita') === -1) {
						const fontSplit = font.split('-');
						const fontWeight = fontSplit[1] || 'Regular';
						return {
							fontFamily: fontSplit[0],
							fontWeight
						};
					}
				})
				.filter((font) => font),
			'fontWeight'
		);
		const colors = [...new Set(allValues.map((typo) => typo.color))];
		//we can assume that a typo setting has the same font but different weights.
		const minSize = Math.min(...allSizes);
		const baseSize = Math.max(...allSizes);

		const hasItalic = allValues.map((typo) => typo.hasItalicVariant).includes(true);

		const allKerning = [...new Set(allValues.map((typo) => typo.kerning))];
		const allLineheight = [...new Set(allValues.map((typo) => typo.lineheight))].filter((typo) => typo);
		const minLineheightPx = Math.min(...allLineheight);
		const maximumLineHeightPx = Math.max(...allLineheight);

		const minLineheight = Math.round((minLineheightPx / minSize) * 100) / 100;
		const maxLineheigt = Math.round((maximumLineHeightPx / baseSize) * 100) / 100;

		let lineheight;
		if (minLineheight === maxLineheigt) {
			lineheight = minLineheight;
		} else {
			lineheight = ~~(((maxLineheigt + minLineheight) / 2) * 1000) / 1000;
		}
		return {
			key,
			colors,
			minSize,
			baseSize,
			hasItalic,
			lineheight,
			fontWeights: fontObj.map((font) => font.fontWeight),
			fontFamily: fontObj[0].fontFamily,
			kerning: Math.round(allKerning[0] * 100) / 100 || 0
		};
	});
	const allfontFamilies = [...new Set(fonts.map((font) => font.fontFamily))];
	const missingFonts = allfontFamilies.filter((font) => {
		if (!fs.existsSync(`./uploads/projects/${projectId}/fonts/${font.toLowerCase()}`)) {
			return font;
		}
	});
	const allFonts = await Promise.all(
		fonts.map(async (font) => {
			const fontExist = await Typography.findOne({
				where: {
					projectId,
					key: font.key
				}
			});
			//create or update
			if (!fontExist) {
				return await Typography.create({
					key: font.key,
					colors: font.colors,
					minSize: font.minSize,
					baseSize: font.baseSize,
					lineheight: font.lineheight,
					hasItalic: font.hasItalic,
					weight: font.fontWeights,
					family: font.fontFamily,
					kerning: font.kerning,
					checked: false,
					projectId
				});
			} else {
				return await fontExist.update({
					key: font.key,
					colors: font.colors,
					minSize: font.minSize,
					baseSize: font.baseSize,
					lineheight: font.lineheight,
					hasItalic: font.hasItalic,
					weight: font.fontWeights,
					kerning: font.kerning,
					family: font.fontFamily,
					checked: false
				});
			}
		})
	);
	return {
		missingFonts,
		allFonts
	};
};

/**
 * scanAllColors - Scan and save all document colors
 * @param {Obj} projectId - ProjectID
 * @param {Obj} fileNames - All file names
 * @return Saves everything
 */
const scanAllColors = async (projectId, fileNames) => {
	try {
		let colorsSet = [];
		let colorNames = [];
		let values = [];
		fileNames.forEach((file) => {
			const rawdata = fs.readFileSync(`${file}/document.json`);
			const documentData = JSON.parse(rawdata);

			if (documentData) {
				const rawColors = documentData.assets.colorAssets;
				if (rawColors) {
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
			}
		});
		const colors = await Promise.all(
			colorsSet.map(async (color) => {
				const colorExist = await Color.findOne({
					where: {
						projectId,
						ogName: color.ogName,
						value: color.value
					}
				});
				if (!colorExist) {
					return await Color.create(color);
				} else {
					await colorExist.update({
						checked: false
					});
					return colorExist;
				}
			})
		);
		return colors.sort((a, b) => a.id - b.id);
	} catch (e) {
		return {
			code: 3
		};
	}
};

/**
 * unzipAllFiles - Unzip all files in req.riles async (waits for all files)
 * @dependend unzipSingleFile
 * @dependend streamToPipe
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

/**
 * unzipAllFiles - Opens up zip and opens a promise stream for each file, looops trough all files and waits on finish to resolve
 * @param {String} folderPath - The path where the file needs to be saved
 * @dependend streamToPipe
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

/**
 * divideTypo - Manage all typo and save it to each element like H1
 * @param {Obj} typo - Typo object out of sketch
 * @return Readable typo object
 */
const divideTypo = (typo) => {
	const names = typo.name.split('/').map((singleName) => singleName.toLowerCase());
	const elementPossibilities = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'];
	const formatPossibilities = [
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
	//first we divide the element

	const element = names.find((name) => {
		if (elementPossibilities.includes(name)) {
			const indexOf = names.indexOf(name);
			names.splice(indexOf, 1);
			return name;
		}
	});

	if (!element) {
		return;
	}

	const size = typo.value.textStyle.encodedAttributes.MSAttributedStringFontAttribute.attributes.size;

	const format = names.find((name) => {
		if (formatPossibilities.includes(name)) {
			const indexOf = names.indexOf(name);
			names.splice(indexOf, 1);
			return name;
		}
	});

	//p has no format difference
	if (!format && element !== 'p') {
		return;
	}

	const hasItalicVariant = names.includes('italic');

	const colorObject = typo.value.textStyle.encodedAttributes.MSAttributedStringColorAttribute;
	const colorInstance = new ColorFormatter({
		r: Math.round(colorObject.red * 255),
		g: Math.round(colorObject.green * 255),
		b: Math.round(colorObject.blue * 255),
		a: colorObject.alpha
	});
	return {
		element,
		size,
		format,
		fontFamily: typo.value.textStyle.encodedAttributes.MSAttributedStringFontAttribute.attributes.name,
		color: colorInstance.hexToCss,
		kerning: typo.value.textStyle.encodedAttributes.kerning,
		lineheight: typo.value.textStyle.encodedAttributes.paragraphStyle.maximumLineHeight,
		hasItalicVariant,
		variables: names
	};
};
