/**
 * Create vehicle year
 * @param {Object} entire response from all successful APIs
 * @returns {string} // year of vehicle
 * @TODO string or int?
 */
function createVehicleYear(data) {
	if (data?.mot?.manufactureDate) return data.mot.manufactureDate.split('-')[0];
	return `${data.ves?.yearOfManufacture} ` || `${data.vin?.Year} ` || ''; // empty string if no year
}

module.exports = { createVehicleYear }