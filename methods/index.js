//collect all helper functions here
module.exports.uploadImage = require('./uploadImage');
module.exports.getUserInfo = require('./getUserInfo');
module.exports.checkOrCreateFolder = require('./checkOrCreateFolder');

const loginFunctions = require('./login');
module.exports.isLoggedIn = loginFunctions.isLoggedIn;
module.exports.logOut = loginFunctions.logOut;
