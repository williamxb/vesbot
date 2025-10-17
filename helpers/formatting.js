const { formatDistance, compareDesc } = require('date-fns');

/**
 * Data format and display functions
 */

/**
 * Map vehicle colour to emoji
 * @param {string} colour Colour name
 * @returns {string} Emoji if matched, otherwise the original colour
 */
function calculateColour(colour) {
  const colourMap = {
    WHITE: '⚪️',
    SILVER: '⚪️',
    BLACK: '⚫️',
    RED: '🔴',
    BLUE: '🔵',
    BROWN: '🟤',
    ORANGE: '🟠',
    GREEN: '🟢',
    YELLOW: '🟡',
    PURPLE: '🟣',
  };

  return colourMap[colour] || colour;
}

/**
 * Create vehicle status and embed colour
 * @param {Object} vehicle data from AT API
 * @returns {Object} vehicleStatus string and embedColour hex code
 */
function createVehicleStatus(vehicle) {
  if (!vehicle) {
    return { vehicleStatus: 'Unknown', embedColour: 0x0000ff };
  }

  if (vehicle.stolen === false && vehicle.scrapped === false && vehicle.writeOffCategory === 'none') {
    return { vehicleStatus: 'Clean ✨', embedColour: 0x00b67a };
  }

  const statusMap = [vehicle.stolen ? '**Stolen**' : null, vehicle.scrapped ? '**Scrapped**' : null, vehicle.writeOffCategory !== 'none' ? `**Write-off - CAT ${vehicle.writeOffCategory}**` : null].filter(Boolean);

  const status = statusMap.join(', ');
  return { vehicleStatus: status, embedColour: 0xb11212 };
}

/**
 * Detect if a vehicle has been imported
 * @param {Object} vehicle data from VES API
 * @returns {string} null, or message if vehicle has been imported
 */
function detectImportedVehicle(vehicle) {
  if (vehicle.monthOfFirstDvlaRegistration) return { isImported: '**Imported vehicle**\n' };
  return { isImported: '' };
}

/**
 * Create VED status
 * @param {Object} vehicle data from VES API
 * @returns {string} description of tax status
 */
function createTaxStatus(vehicle) {
  if (!vehicle.taxStatus) return { taxStatus: 'Unknown', taxDue: 'Unknown' };

  const currentDate = new Date().setHours(24, 0, 0, 0);
  let taxStatus = vehicle.taxStatus;
  let taxDue = 'Unknown'; // set default

  if (vehicle.taxDueDate) {
    const taxDueDate = new Date(vehicle.taxDueDate).setHours(24, 0, 0, 0);

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
  }

  if (taxStatus === 'SORN') taxDue = 'N/A';

  return { taxStatus: taxStatus, taxDue: taxDue };
}

/**
 * Create MOT status
 * @param {Object} vehicle data from VES API
 * @returns {string} description of MOT status
 */
function createMotStatus(vehicle) {
  if (!vehicle.motStatus) return { motStatus: 'Unknown', motDue: 'Unknown' };

  const currentDate = new Date().setHours(24, 0, 0, 0);
  let motStatus = vehicle.motStatus;
  let motDue = '';

  if (vehicle.motExpiryDate) {
    const motExpiryDate = new Date(vehicle.motExpiryDate).setHours(24, 0, 0, 0);

    switch (compareDesc(motExpiryDate, currentDate)) {
      case -1: // current
        motDue = `Expires ${formatDistance(motExpiryDate, currentDate, { addSuffix: true })}`;
        break;
      case 0:
        motDue = `Expires today`;
        break;
      case 1: // expired
        motDue = `Expired ${formatDistance(motExpiryDate, currentDate, { addSuffix: true })}`;
        break;
    }
  }

  return { motStatus: motStatus, motDue: motDue };
}

module.exports = {
  calculateColour,
  createVehicleStatus,
  detectImportedVehicle,
  createTaxStatus,
  createMotStatus,
};
