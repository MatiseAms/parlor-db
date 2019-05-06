const { projects } = require('../methods');
const { getSingleProject } = projects;
const { models } = require('../db');
const { Typography, Project } = models;
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
					const projectHasUser = await project.hasUser(user);
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
						const projectHasUser = await project.hasUser(user);
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
};
