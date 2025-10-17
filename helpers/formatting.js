const { formatDistance, compareDesc, add } = require('date-fns');

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
 * @param {Object} vehicle data from DVLA VES API
 * @returns {string} null, or message if vehicle has been imported
 */
function detectImportedVehicle(vehicle) {
  if (vehicle.monthOfFirstDvlaRegistration) return { isImported: '**Imported vehicle**\n' };
  return { isImported: '' };
}

/**
 * VED rates for calculating vehicle tax cost
 * @TODO: add tax bands to response and testing
 */
const vedRates = [
  { co2: 100, band: 'A', rate: 20 },
  { co2: 110, band: 'B', rate: 20 },
  { co2: 120, band: 'C', rate: 35 },
  { co2: 130, band: 'D', rate: 165 },
  { co2: 140, band: 'E', rate: 195 },
  { co2: 150, band: 'F', rate: 215 },
  { co2: 165, band: 'G', rate: 265 },
  { co2: 175, band: 'H', rate: 315 },
  { co2: 185, band: 'I', rate: 345 },
  { co2: 200, band: 'J', rate: 395 },
  { co2: 225, band: 'K', rate: 430 },
  { co2: 255, band: 'L', rate: 735 },
  { co2: 999, band: 'M', rate: 760 },
];

/**
 * Create vehicle tax cost and import likeliness
 * @param {Object} ves data from DVSA MOT API
 * @param {Object} mot data from DVLA VES API
 * @returns {string} calculated tax cost
 */
function createTaxCost(ves, mot) {
  if (!mot?.registrationDate && !ves?.monthOfFirstRegistration) {
    return { taxCost: 'Unknown' };
  }

  // imported vehicle = PLG Vehicle
  if (ves.monthOfFirstDvlaRegistration) return { taxCost: '(TC39) £345' };

  let taxCost = '';
  const co2Emissions = ves?.co2Emissions;
  const engineCapacity = ves?.engineCapacity || mot?.engineSize;

  const regAfter2017 = new Date('2017-05-01');
  regAfter2017.setHours(0, 0, 0, 0);

  const emissionsMarch2006Cutoff = new Date('2006-03-23');
  emissionsMarch2006Cutoff.setHours(0, 0, 0, 0);

  const regAfter2001 = new Date('2001-03-01');
  regAfter2001.setHours(0, 0, 0, 0);

  const registrationDate = new Date(mot?.registrationDate || `${ves?.monthOfFirstRegistration}-01`);
  registrationDate.setHours(0, 0, 0, 0);

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  if (compareDesc(regAfter2017, registrationDate) === 1) {
    const luxTaxDateThreshold = add(registrationDate, { years: 5 });
    if (compareDesc(currentDate, luxTaxDateThreshold) === 1 || compareDesc(currentDate, luxTaxDateThreshold) === 0) {
      taxCost = '£195 / £620';
    } else {
      taxCost = '£195';
    }
  } else if (compareDesc(regAfter2001, registrationDate) == 1) {
    if (!ves.co2Emissions) return { taxCost: 'Unknown' };

    for (const rate of vedRates) {
      if (co2Emissions <= rate.co2) {
        taxCost = rate.rate;
        break;
      }
    }

    if (compareDesc(emissionsMarch2006Cutoff, registrationDate) == -1 && taxCost > 430) {
      taxCost = '(K) £430';
    } else {
      taxCost = `£${taxCost}`;
    }
  } else {
    if (!mot?.engineSize && !ves?.engineCapacity) return { taxCost: 'Unknown' };

    if (mot?.engineSize || ves?.engineCapacity >= 1549) {
      return { taxCost: '£360' };
    } else {
      return { taxCost: '£220' };
    }
  }

  return { taxCost: taxCost };
}

/**
 * Create vehicle tax status
 * @param {Object} vehicle data from DVLA VES API
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
 * @param {Object} vehicle data from DVLA VES API
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
  createTaxCost,
  createMotStatus,
};
