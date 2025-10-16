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
 * 
 * @param {Object} vehicle data from AT API
 * @returns {Object} vehicleStatus string and embedColour hex code
 */
function createVehicleStatus(vehicle) {
  if (!vehicle) {
    return { vehicleStatus: "Unknown", embedColour: 0x0000ff };
  };

  if (vehicle.stolen === false && vehicle.scrapped === false && vehicle.writeOffCategory === 'none') {
    return { vehicleStatus: "Clean ✨", embedColour: 0x00b67a };
  }

  const statusMap = [
    vehicle.stolen ? "**Stolen**" : null,
    vehicle.scrapped ? "**Scrapped**" : null,
    vehicle.writeOffCategory !== "none" ? `**Write-off - CAT ${vehicle.writeOffCategory}**` : null,
  ].filter(Boolean)

  const status = statusMap.join(", ");
  return {vehicleStatus: status, embedColour: 0xb11212 }
}

module.exports = {
  calculateColour,
  createVehicleStatus,
};
