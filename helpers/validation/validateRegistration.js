/**
 * Validates if registration is a correct UK format.
 * @param {string} registration registration input to validate
 * @returns {boolean} if valid returns true
 */
function validateRegistration(registration) {
	if (registration.length > 7) return false;
	// Standard UK + NI + Cherished format. Based on https://gist.github.com/danielrbradley/7567269
	const regex = /(^[A-Z]{1,3}[0-9]{1,4}[A-Z]{0,3}$)|(^[0-9]{1,4}[A-Z]{1,3}$)/i;
	return regex.test(registration);
}

export { validateRegistration };