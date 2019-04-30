const { isLoggedIn, projects } = require('../methods');
const { hostname } = require('../config');
const {
	getAllProjects,
	getSingleProject,
	addNewUserToProject,
	createNewProject,
	deleteProject,
	getProjectImages
} = projects;

module.exports = (app) => {
	/**
	 * All projects
	 * @type GET
	 * @middleware isLoggedIn
	 * @param {Int} req.user.id - User session ID
	 */
	app.get('/projects', isLoggedIn, async (req, res) => {
		const projects = await getAllProjects(req.user.id);
		if (projects) {
			res.send(projects);
		} else {
			res.status(404).json({
				code: 3,
				message: 'No projects found'
			});
		}
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
		if (project) {
			res.send(project);
		} else {
			res.status(404).json({
				code: 3,
				message: 'No project found with this ID'
			});
		}
	});

	/**
	 * Single project
	 * @type GET
	 * @middleware isLoggedIn
	 * @param {Int} req.user.id - User session ID
	 * @param {Int} req.params.id - Project ID
	 */
	app.get('/project/:id/images', isLoggedIn, async (req, res) => {
		const projectImages = await getProjectImages(req.user.id, req.params.id);
		if (projectImages) {
			const images = projectImages.images.map((image) => {
				const img = image.split('./')[1];
				return `${hostname}/${img}`;
			});
			res.send({
				code: 0,
				images,
				title: projectImages.project.name
			});
		} else {
			res.status(404).json({
				code: 3,
				message: 'No project found with this ID'
			});
		}
	});

	/**
	 * Add a new user to a project
	 * @type POST
	 * @middleware isLoggedIn
	 * @param {Int} req.user.id - User session ID
	 * @param {Int} req.params.id - Project name
	 */
	app.post('/project/:id/new-user', isLoggedIn, addNewUserToProject);

	/**
	 * Create a new project
	 * @type POStT
	 * @middleware isLoggedIn
	 * @param {Int} req.user.id - User session ID
	 * @param {Int} req.body.name - Project name
	 */
	app.post('/newproject', isLoggedIn, createNewProject);

	app.delete('/delete/:id', isLoggedIn, async (req, res) => {
		await deleteProject(req.user.id, req.params.id);
		res.send('ok');
	});
};
