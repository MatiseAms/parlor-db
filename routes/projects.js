const { isLoggedIn } = require('../middleware/loginSession');
const { models, dbFunctions } = require('../db');
const { getUserInfo } = dbFunctions;
const { Project, User } = models;
module.exports = (app) => {
	/**
	 * All projects
	 * @type GET
	 * @middleware isLoggedIn
	 * @param {Int} req.user.id - User session ID
	 */
	app.get('/projects', isLoggedIn, async (req, res) => {
		const projects = await getAllProjects(req.user.id);
		res.send(projects);
	});

	/**
	 * Single project
	 * @type GET
	 * @middleware isLoggedIn
	 * @param {Int} req.user.id - User session ID
	 * @param {Int} req.params.id - Project ID
	 */
	app.get('/project/:id', isLoggedIn, async (req, res) => {
		const project = await getSingleProject(req.user.id, req.params.id);
		res.send(project);
	});

	/**
	 * Add a new user to a project
	 * @type POST
	 * @middleware isLoggedIn
	 * @param {Int} req.user.id - User session ID
	 * @param {Int} req.params.id - Project name
	 */
	app.post('/project/:id/new-user', isLoggedIn, async (req, res) => {
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
					email: req.body.email
				}
			});

			if (!extraUser) {
				res.status(404).json({
					codde: 3,
					message: 'User does not exist'
				});
			} else {
				//if there is a user add that user
				project.addUser(extraUser);
				res.send({
					code: '0',
					message: 'User has been added to the project'
				});
			}
		}
		res.send(project);
	});

	/**
	 * Create a new project
	 * @type POStT
	 * @middleware isLoggedIn
	 * @param {Int} req.user.id - User session ID
	 * @param {Int} req.body.name - Project name
	 */
	app.post('/newproject', isLoggedIn, async (req, res) => {
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
				image: '' //image will be created later
			});

			//link user with the project
			project.addUser(req.user);

			res.send({
				code: 0,
				message: 'Project created'
			});
		}
	});
};

/**
 * get All projects
 * @type Functiob
 * @param {Int} userID - User session ID
 * @return {Array}
 */
const getAllProjects = async (userID) => {
	const projects = await Project.findAll({
		include: {
			model: User,
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
				model: User
			}
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
 * @return {Object}
 */
const getSingleProject = async (userID, projectID) => {
	//find the project and check if we have access with our userID
	const project = await Project.findOne({
		where: {
			id: projectID
		},
		include: {
			model: User,
			where: {
				id: userID
			}
		}
	});

	//if there is a proejct iwth the right id and the right user show it, otherwise it isnt found and it will return an empty object
	if (project) {
		const allProject = await Project.findOne({
			where: {
				id: projectID
			},
			include: {
				model: User
			}
		});
		const users = allProject.users.map((user) => getUserInfo(user.dataValues));
		const obj = {
			id: allProject.id,
			image: allProject.image,
			name: allProject.name,
			users
		};
		return obj;
	}
	return {};
};
