const { formatDistance, format } = require('date-fns');

/**
 * Create last V5C issue date
 * @param {Object} vehicle data from DVLA VES API
 * @returns {string} last V5C issue date formatted
 */
function createLastV5(vehicle) {
  if (!vehicle?.dateOfLastV5CIssued) return { lastV5: 'Unknown' };

  const currentDate = new Date().setHours(24, 0, 0, 0);
  const lastV5Date = new Date(vehicle.dateOfLastV5CIssued).setHours(24, 0, 0, 0);

  return { lastV5: `${formatDistance(lastV5Date, currentDate, { addSuffix: true })}\n${format(lastV5Date, 'dd/MM/yyyy')}`};
}

module.exports = { createLastV5 }