module.exports = (app) => {
	app.get('/', async (req, res) => {
		res.send('wow');
	});
};
