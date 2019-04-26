const isLoggedIn = (req, res, next) => {
	if (req.session.passport) {
		return next();
	}
	const originalUrl = req.originalUrl;
	res.status(200).json({
		code: 4,
		message: 'redirect',
		redirect: `/login?redirect=${originalUrl}`
	});
};

const logOut = (req, res) => {
	req.session.destroy(() => {
		res.status(200).json({
			code: 4,
			message: 'redirect',
			redirect: `/`
		});
	});
};

module.exports = {
	isLoggedIn,
	logOut
};
