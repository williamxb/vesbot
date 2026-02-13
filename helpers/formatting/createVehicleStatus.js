/**
 * Create vehicle status and embed colour
 * @param {Object} vehicle data from AT API
 * @param {string} vehicle registration
 * @returns {Object} vehicleStatus string and embedColour hex code
 */
function createVehicleStatus(vehicle, registration) {
	if (!vehicle || !registration) {
		return { vehicleStatus: 'Unknown', embedColour: 0x0000ff };
	}

	vehicle.qPlate = registration.startsWith('Q');

	if (
		vehicle.stolen === false &&
		vehicle.scrapped === false &&
		vehicle.writeOffCategory === 'none' &&
		vehicle.qPlate === false
	) {
		return { vehicleStatus: 'Clean ✨', embedColour: 0x00b67a };
	}

	const statusMap = [
		vehicle.qPlate ? '**Q Plate**' : null,
		vehicle.stolen ? '**Stolen**' : null,
		vehicle.scrapped ? '**Scrapped**' : null,
		vehicle.writeOffCategory !== 'none'
			? `**Write-off - CAT ${vehicle.writeOffCategory}**`
			: null,
	].filter(Boolean);

	const status = statusMap.join(', ');
	return { vehicleStatus: status, embedColour: 0xb11212 };
}

module.exports = { createVehicleStatus }