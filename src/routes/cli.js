const { projects } = require('../methods');
const { getSingleProject, getProjectImages } = projects;
const { models } = require('../db');
const { Typography, Project, User } = models;
const stream = require('stream');
const fs = require('fs');

const AdmZip = require('adm-zip');

module.exports = (app, passport) => {
	app.post('/parlor-cli', (req, res, next) => {
		passport.authenticate('local-signin', (err, user, info) => {
			const projectId = req.body.projectId;
			if (err) return next(err);
			if (info && info.code === 5) {
				res.send(info);
				return;
			}
			if (user) {
				req.logIn(user, async (err) => {
					if (err) return next(err);
					const project = await Project.findByPk(projectId);
					const userModel = await User.findByPk(user.id);
					const projectHasUser = await project.hasUser(userModel);
					if (projectHasUser) {
						const projects = await getSingleProject(user.id, projectId);
						res.send(projects);
					} else {
						res.send(false);
					}
				});
			} else {
				res.status(400).json(info);
			}
		})(req, res, next);
	});

	app.post('/parlor-cli/fonts', (req, res, next) => {
		passport.authenticate('local-signin', (err, user, info) => {
			const projectId = req.body.projectId;
			if (err) return next(err);
			if (info && info.code === 5) {
				res.send(info);
				return;
			}
			if (user) {
				req.logIn(user, async (err) => {
					if (err) return next(err);
					try {
						const project = await Project.findByPk(projectId);
						const userModel = await User.findByPk(user.id);
						const projectHasUser = await project.hasUser(userModel);
						if (projectHasUser) {
							const typo = await Typography.findAll({
								raw: true,
								where: {
									projectId
								}
							});

							const allfontFamilies = [...new Set(typo.map((font) => font.family))];
							let zip = new AdmZip();
							allfontFamilies.forEach((font) => {
								const folder = `./uploads/projects/${projectId}/fonts/${font.toLowerCase()}`;

								const files = fs.readdirSync(folder);
								files.forEach((file) => {
									zip.addLocalFile(`${folder}/${file}`);
								});
							});
							var willSendthis = zip.toBuffer();
							// res.download(willSendthis);
							// var fileContents = Buffer.from(fileData, "base64");

							var readStream = new stream.PassThrough();
							readStream.end(willSendthis);

							res.set('Content-disposition', 'attachment; filename=' + projectId);
							res.set('Content-Type', 'text/plain');

							readStream.pipe(res);
						}
					} catch (e) {
						res.send(false);
					}
				});
			} else {
				res.status(400).json(info);
			}
		})(req, res, next);
	});

	/**
	 * Single project
	 * @type GET
	 * @middleware isLoggedIn
	 * @param {Int} req.user.id - User session ID
	 * @param {Int} req.params.id - Project ID
	 */
	app.post('/project/:id/images/download', async (req, res, next) => {
		passport.authenticate('local-signin', (err, user, info) => {
			const projectId = req.body.projectId;
			if (err) return next(err);
			if (info && info.code === 5) {
				res.send(info);
				return;
			}
			if (user) {
				req.logIn(user, async (err) => {
					if (err) return next(err);
					try {
						const project = await Project.findByPk(projectId);
						const userModel = await User.findByPk(user.id);
						const projectHasUser = await project.hasUser(userModel);
						if (projectHasUser) {
							const projectImages = await getProjectImages(user.id, projectId);
							if (projectImages) {
								const images = projectImages.images.map((image) => {
									const img = image.split('./')[1];
									return `./${img}`;
								});
								let zip = new AdmZip();
								images.forEach((image) => {
									zip.addLocalFile(image);
								});

								var willSendthis = zip.toBuffer();
								// res.download(willSendthis);
								// var fileContents = Buffer.from(fileData, "base64");

								var readStream = new stream.PassThrough();
								readStream.end(willSendthis);

								res.set('Content-disposition', 'attachment; filename=' + projectId);
								res.set('Content-Type', 'text/plain');

								readStream.pipe(res);
							} else {
								res.status(404).json({
									code: 3,
									message: 'No project found with this ID'
								});
							}
						}
					} catch (e) {
						res.send(false);
					}
				});
			} else {
				res.status(400).json(info);
			}
		})(req, res, next);
	});
};
