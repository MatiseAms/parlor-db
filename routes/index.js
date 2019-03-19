const fs = require('fs');
//file requires all files inside this folder
module.exports = (app, passport) => {
	fs.readdirSync(__dirname).forEach((file) => {
		if (file == 'index.js') return;
		const name = file.substr(0, file.indexOf('.'));
		require('./' + name)(app, passport);
	});
};
