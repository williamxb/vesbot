/**
 * Validates if registration is a correct UK format.
 * @param {string} registration registration input to validate
 * @returns {boolean} if valid returns true
 */
function validateRegistration(registration) {
	// https://gist.github.com/danielrbradley/7567269
	const regex =
		/(^[A-Z]{2}[0-9]{2}\s?[A-Z]{3}$)|(^[A-Z][0-9]{1,3}[A-Z]{3}$)|(^[A-Z]{3}[0-9]{1,3}[A-Z]$)|(^[0-9]{1,4}[A-Z]{1,2}$)|(^[0-9]{1,3}[A-Z]{1,3}$)|(^[A-Z]{1,2}[0-9]{1,4}$)|(^[A-Z]{1,3}[0-9]{1,3}$)|(^[A-Z]{1,3}[0-9]{1,4}$)/i;
	return regex.test(registration);
}

module.exports = { validateRegistration }