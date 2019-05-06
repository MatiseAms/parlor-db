const { models, db } = require('../db');
const { Project, User, Color, Typography, Grid } = models;
const { Sequelize } = db;
const fs = require('fs');
const Op = Sequelize.Op;
/**
 * get All projects
 * @type Functiob
 * @param {Int} userID - User session ID
 * @return {Array || false}
 */
const getAllProjects = async (userID) => {
	//find all project id's with the right user so we can find the right data later
	const projects = await Project.findAll({
		raw: true,
		attributes: ['id'],
		include: {
			model: User,
			attributes: ['id'],
			where: {
				id: userID
			}
		}
	});
	//only continue if there are any projects cause we are going to map
	if (projects.length) {
		//get all id's so we can collect all users of all projects
		const projectIDs = projects.map((project) => project.id);

		//get all projects from id
		const allProjects = await Project.findAll({
			where: {
				id: projectIDs
			},
			include: [
				{
					model: User,
					attributes: ['id', 'username', 'email', 'image', 'firstName', 'lastName']
				},
				{
					model: Color
				},
				{
					model: Grid
				},
				{
					model: Typography
				}
			]
		});
		return allProjects;
	}
	// empty array return
	return [];
};

/**
 * Single project
 * @type Functiob
 * @param {Int} userID - User session ID
 * @param {Int} projectID - Project ID
 * @return {Object || false}
 */
const getSingleProject = async (userID, projectID) => {
	//find the project and check if we have access with our userID
	const project = await Project.findOne({
		where: {
			id: projectID
		}
	});
	if (!project) {
		return false;
	}

	const user = await User.findByPk(userID);
	const projectHasUser = await project.hasUser(user);
	//if there is a proejct iwth the right id and the right user show it, otherwise it isnt found and it will return an empty object
	if (project && projectHasUser) {
		const allProject = await Project.findOne({
			where: {
				id: projectID
			},
			include: [
				{
					model: User,
					attributes: ['id', 'username', 'email', 'image', 'firstName', 'lastName']
				},
				{
					model: Color
				},
				{
					model: Grid
				},
				{
					model: Typography
				}
			]
		});
		return allProject;
	}
	return false;
};

/**
 * Add a new user to a project
 * @type POST
 * @middleware isLoggedIn
 * @param {Int} req.user.id - User session ID
 * @param {Int} req.params.id - Project name
 */
const addNewUserToProject = async (req, res) => {
	const projectID = req.params.id;
	//only see the project if user is included
	const project = await Project.findOne({
		where: {
			id: projectID
		},
		include: {
			model: User,
			where: {
				id: req.user.id
			}
		}
	});
	//continue if there is a project
	if (project) {
		//check if the user exists, based on email
		const extraUser = await User.findOne({
			where: {
				[Op.or]: [
					{
						email: req.body.email
					},
					{
						username: req.body.email.toLowerCase()
					}
				]
			}
		});
		if (!extraUser) {
			res.status(404).json({
				code: 3,
				message: 'User not found'
			});
		} else {
			const alreadyAdded = await project.hasUser(extraUser);
			if (alreadyAdded) {
				res.send({
					code: 1,
					message: 'User is already in this projcet'
				});
			} else {
				//if there is a user add that user
				project.addUser(extraUser);
				res.status(201).json({
					code: 0,
					message: 'User has been added to the project'
				});
			}
		}
	} else {
		res.status(403).json({
			code: 3,
			message: 'You do not have the permission to do that'
		});
	}
};

/**
 * Create a new project
 * @type POStT
 * @middleware isLoggedIn
 * @param {Int} req.user.id - User session ID
 * @param {Int} req.body.name - Project name
 */
const createNewProject = async (req, res) => {
	//check if the project exists
	const projectExist = await Project.findOne({
		raw: true,
		where: {
			name: req.body.name
		},
		include: {
			model: User,
			where: {
				id: req.user.id
			}
		}
	});

	if (projectExist) {
		res.send({
			code: 3,
			message: 'Project name already exists'
		});
	} else {
		//if it doesn't exist create one
		const project = await Project.create({
			name: req.body.name,
			image: '', //image will be created later
			version: 0
		});

		//link user with the project
		project.addUser(req.user);

		res.status(201).json({
			code: 0,
			message: 'Project created',
			projectId: project.id
		});
	}
};

/**
 * deleteProject
 * @type Functiob
 * @param {Int} userID - User session ID
 * @param {Int} projectID - Project ID
 * @return {Object || false}
 */
const deleteProject = async (userID, projectID) => {
	//find the project and check if we have access with our userID
	const project = await Project.findOne({
		where: {
			id: projectID
		}
	});

	if (!project) {
		return false;
	}

	const user = await User.findByPk(userID);
	const projectHasUser = await project.hasUser(user);
	//if there is a proejct iwth the right id and the right user show it, otherwise it isnt found and it will return an empty object
	if (project && projectHasUser) {
		await Grid.destroy({
			where: {
				projectId: projectID
			}
		});
		await Typography.destroy({
			where: {
				projectId: projectID
			}
		});
		await Color.destroy({
			where: {
				projectId: projectID
			}
		});
		project.destroy();
	}
};

/**
 * getProjectImages
 * @type Functiob
 * @param {Int} userID - User session ID
 * @param {Int} projectID - Project ID
 * @return {Object || false}
 */
const getProjectImages = async (userID, projectID) => {
	//find the project and check if we have access with our userID
	const project = await Project.findOne({
		where: {
			id: projectID
		}
	});

	if (!project) {
		return false;
	}

	const user = await User.findByPk(userID);
	const projectHasUser = await project.hasUser(user);
	//if there is a proejct iwth the right id and the right user show it, otherwise it isnt found and it will return an empty object
	if (project && projectHasUser) {
		const projectFolders = `./uploads/projects/${projectID}/${project.version}/unzip/`;
		const projectFiles = fs.readdirSync(projectFolders);
		const fileNames = [];
		if (projectFiles) {
			const all = [];
			projectFiles.forEach((file) => {
				const projectFolder = `${projectFolders}${file}/images/`;
				if (fs.existsSync(projectFolder)) {
					const imageFiles = fs.readdirSync(projectFolder);
					fileNames.push(imageFiles);
					imageFiles.forEach((file) => {
						if (!fileNames.includes(file)) {
							fileNames.push(file);
							all.push(`${projectFolder}${file}`);
						}
					});
				}
			});
			return {
				images: all,
				project
			};
		}
	}
};

module.exports = {
	getAllProjects,
	getSingleProject,
	addNewUserToProject,
	createNewProject,
	deleteProject,
	getProjectImages
};
