//collect all helper functions here
module.exports.uploadFunctions = require('./uploads');
module.exports.getUserInfo = require('./getUserInfo');

const loginFunctions = require('./login');
module.exports.isLoggedIn = loginFunctions.isLoggedIn;
module.exports.logOut = loginFunctions.logOut;
