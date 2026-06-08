import { formatDistance, compareDesc, startOfDay } from 'date-fns';

/**
 * Create vehicle tax status
 * @param {Object} vehicle data from DVLA VES API
 * @returns {string} description of tax status
 */
function createTaxStatus(vehicle) {
  // Tax status not known
  if (!vehicle?.taxStatus) return { taxTitle: 'Tax status unknown', taxStatus: 'Status is unavailable' };
  // SORN
  if (vehicle.taxStatus === 'SORN') return { taxTitle: '⚠️ SORN', taxStatus: 'Vehicle is off the road' };
  // Not Taxed for on Road Use
  if (vehicle.taxStatus === 'Not Taxed for on Road Use') return { taxTitle: '⚠️ Off the road', taxStatus: 'Vehicle is not taxed for road use' };

  const taxTitle = vehicle.taxStatus === 'Valid' ? '✅ Tax valid' : '❌ Tax expired';
  let taxStatus = '';

  if (vehicle.taxDueDate) { // we have a last due date, so can calculate expiration
    const currentDate = startOfDay(new Date());
    const taxDueDate = startOfDay(new Date(vehicle.taxDueDate));

    switch (compareDesc(taxDueDate, currentDate)) {
      case -1: // current
        taxStatus = `Expires ${formatDistance(taxDueDate, currentDate, { addSuffix: true })}`;
        break;
      case 0:
        taxStatus = `Expires today`;
        break;
      case 1: // expired
        taxStatus = `Expired ${formatDistance(taxDueDate, currentDate, { addSuffix: true })}`;
        break;
    }
  } else {
    taxStatus = `Could not determine expiry`
  }

  return { taxTitle: taxTitle, taxStatus: taxStatus };
}

export { createTaxStatus };