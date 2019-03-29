const isLoggedIn = (req, res, next) => {
	if (req.session.passport) {
		return next();
	}
	const originalUrl = req.originalUrl;
	res.redirect(`/login?redirect=${originalUrl}`);
};

const logOut = (req, res) => {
	req.session.destroy(() => {
		res.redirect('/');
	});
};

module.exports = {
	isLoggedIn,
	logOut
};
