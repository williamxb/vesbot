/**
 * Strip non-alphanumeric characters and return as upper case.
 * @param {string} input raw input
 * @returns {string} sanitised output (non-alphanumeric stripped, uppercase)
 */
function sanitiseInput(input) {
  return input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
};
    
/**
 * Validates if registration is a correct UK format.
 * @param {string} registration registration input to validate
 * @returns {boolean} if valid returns true
*/
function validateRegistration(registration) {
  // https://gist.github.com/danielrbradley/7567269
  const regex = /(^[A-Z]{2}[0-9]{2}\s?[A-Z]{3}$)|(^[A-Z][0-9]{1,3}[A-Z]{3}$)|(^[A-Z]{3}[0-9]{1,3}[A-Z]$)|(^[0-9]{1,4}[A-Z]{1,2}$)|(^[0-9]{1,3}[A-Z]{1,3}$)|(^[A-Z]{1,2}[0-9]{1,4}$)|(^[A-Z]{1,3}[0-9]{1,3}$)|(^[A-Z]{1,3}[0-9]{1,4}$)/i;
  return regex.test(registration);
}

module.exports = {
  sanitiseInput,
  validateRegistration
}