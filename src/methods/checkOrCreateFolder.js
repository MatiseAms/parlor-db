const mkdirp = require('mkdirp');
const path = require('path');

const checkOrCreateFolder = (pathname) => {
	return new Promise((resolve) => {
		//create folders if there is one needed
		mkdirp(path.dirname(pathname), (err) => {
			if (!err) resolve();
		});
	});
};
module.exports = checkOrCreateFolder;
