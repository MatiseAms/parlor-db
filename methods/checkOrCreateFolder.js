const fs = require('fs');
const checkOrCreateFolder = (path) => {
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path);
	}
};

module.exports = (path) => {
	let strings = [];
	if (Array.isArray(path)) {
		strings.push('.');
		path.forEach((singlePath) => {
			strings.push(singlePath);
			checkOrCreateFolder(strings.join('/'));
		});
	} else if (typeof path === 'string') {
		checkOrCreateFolder(path);
		strings.push(path);
	}
	return strings.join('/');
};
