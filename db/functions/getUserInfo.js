/**
 * Get usefull info of the userObject
 * @type Function
 * @param {Int} userObject - All information of the user
 * @return {Object}
 */
module.exports = (userObject) => {
	const { id, username, email, firstName, lastName, image } = userObject;
	return {
		id,
		username,
		email,
		firstName,
		lastName,
		image
	};
};
