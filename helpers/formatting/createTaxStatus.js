const { formatDistance, compareDesc, startOfDay } = require('date-fns');

/**
 * Create vehicle tax status
 * @param {Object} vehicle data from DVLA VES API
 * @returns {string} description of tax status
 */
function createTaxStatus(vehicle) {
  if (!vehicle?.taxStatus) return { taxStatus: 'Unknown', taxDue: 'Unknown' };

  const taxStatus = vehicle.taxStatus;
  let taxDue = 'Unknown';
  
  if (vehicle.taxDueDate) {
    const currentDate = startOfDay(new Date());
    const taxDueDate = startOfDay(new Date(vehicle.taxDueDate));

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