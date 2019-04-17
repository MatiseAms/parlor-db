//collect all helper functions here
module.exports.uploadImage = require('./uploadImage');
module.exports.checkOrCreateFolder = require('./checkOrCreateFolder');

const loginFunctions = require('./login');
module.exports.isLoggedIn = loginFunctions.isLoggedIn;
module.exports.logOut = loginFunctions.logOut;

module.exports.projects = require('./projects');
module.exports.sketch = require('./uploadSketch');
module.exports.passportMiddleware = require('./passport');
