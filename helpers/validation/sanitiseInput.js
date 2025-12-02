/**
 * Strip non-alphanumeric characters and return as upper case.
 * @param {string} input raw input
 * @returns {string} sanitised output (non-alphanumeric stripped, uppercase)
 */
function sanitiseInput(input) {
	return input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

module.exports = { sanitiseInput }