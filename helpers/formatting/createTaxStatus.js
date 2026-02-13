const { formatDistance, compareDesc } = require('date-fns');

/**
 * Create vehicle tax status
 * @param {Object} vehicle data from DVLA VES API
 * @returns {string} description of tax status
 */
function createTaxStatus(vehicle) {
  if (!vehicle?.taxStatus) return { taxStatus: 'Unknown', taxDue: 'Unknown' };

  const currentDate = new Date();
  const taxStatus = vehicle.taxStatus;
  let taxDue = 'Unknown';

  if (vehicle.taxDueDate) {
    // set default

    const taxDueDate = new Date(vehicle.taxDueDate);

    switch (compareDesc(taxDueDate, currentDate)) {
      case -1: // current
        taxDue = `Expires ${formatDistance(taxDueDate, currentDate, { addSuffix: true })}`;
        break;
      case 0:
        taxDue = `Expires today`;
        break;
      case 1: // expired
        taxDue = `Expired ${formatDistance(taxDueDate, currentDate, { addSuffix: true })}`;
        break;
    }
  } else {
    taxDue = 'Unknown';
  }

  if (taxStatus === 'SORN') taxDue = 'N/A';

  return { taxStatus: taxStatus, taxDue: taxDue };
}

module.exports = { createTaxStatus }