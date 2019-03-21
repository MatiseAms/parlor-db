const { hostname } = require('../config');
/**
 * Get usefull info of the userObject
 * @type Function
 * @param {Int} userObject - All information of the user
 * @return {Object}
 */
module.exports = (userObject) => {
	let { id, username, email, firstName, lastName, image } = userObject;
	if (!image) image = 'uploads/avatar.png';
	return {
		id,
		username,
		email,
		firstName,
		lastName,
		image: `${hostname}/${image}`
	};
};
