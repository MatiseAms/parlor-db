const { models, db } = require('../db');
const { Project, User } = models;
const { Sequelize } = db;
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
			include: {
				model: User,
				attributes: ['id', 'username', 'email', 'image', 'firstName', 'lastName']
			}
		});

		return allProjects;
	}
	// empty array return
	return false;
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
			include: {
				model: User,
				attributes: ['id', 'username', 'email', 'image', 'firstName', 'lastName']
			}
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
						username: req.body.email
					}
				]
			}
		});
		if (!extraUser) {
			res.status(404).json({
				codde: 3,
				message: 'User does not exist'
			});
		} else {
			const alreadyAdded = await project.hasUser(extraUser);
			if (alreadyAdded) {
				res.send({
					codde: 1,
					message: 'User is already in this projcet'
				});
			} else {
				//if there is a user add that user
				project.addUser(extraUser);
				res.send({
					code: 0,
					message: 'User has been added to the project'
				});
			}
		}
	} else {
		res.send({
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

		res.send({
			code: 0,
			message: 'Project created'
		});
	}
};

module.exports = {
	getAllProjects,
	getSingleProject,
	addNewUserToProject,
	createNewProject
};
