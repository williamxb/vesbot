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
 * Create VED status
 * @param {Object} vehicle data from VES API
 * @returns {string} description of tax status
 */
function createTaxStatus(vehicle) {
  let taxStatus = '';
  const currentDate = new Date();
  currentDate.setHours(24, 0, 0, 0);

  if (!vehicle.taxStatus) return 'Tax status unknown';

  taxStatus += vehicle.taxStatus;

  if (vehicle.taxDueDate) {
    const taxDueDate = new Date(vehicle.taxDueDate);
    taxDueDate.setHours(24, 0, 0, 0);

    switch (compareDesc(taxDueDate, currentDate)) {
      case -1: // current
        taxStatus += `, expires ${formatDistance(taxDueDate, currentDate, { addSuffix: true })}`;
        break;
      case 0:
        taxStatus += `, expires today`;
        break;
      case 1: // expired
        taxStatus += `, expired ${formatDistance(taxDueDate, currentDate, { addSuffix: true })}`;
        break;
    }
  }
  return taxStatus;
}

/**
 * Create MOT status
 * @param {Object} vehicle data from VES API
 * @returns {string} description of MOT status
 */
function createMotStatus(vehicle) {
  let motStatus = '';
  const currentDate = new Date();
  currentDate.setHours(24, 0, 0, 0);

  if (!vehicle.motStatus) return 'Tax status unknown';

  motStatus += vehicle.motStatus;

  if (vehicle.motExpiryDate) {
    const motExpiryDate = new Date(vehicle.motExpiryDate);
    motExpiryDate.setHours(24, 0, 0, 0);
    switch (compareDesc(motExpiryDate, currentDate)) {
      case -1: // current
        motStatus += `, expires ${formatDistance(motExpiryDate, currentDate, { addSuffix: true })}`;
        break;
      case 0:
        motStatus += `, expires today.`;
        break;
      case 1: // expired
        motStatus += `, expired ${formatDistance(motExpiryDate, currentDate, { addSuffix: true })}`;
        break;
    }
  }
  return motStatus;
}

module.exports = {
  calculateColour,
  createVehicleStatus,
  createTaxStatus,
  createMotStatus,
};
