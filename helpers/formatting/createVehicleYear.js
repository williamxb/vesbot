/**
 * Create vehicle year
 * @param {Object} entire response from all successful APIs
 * @returns {string} // year of vehicle
 */
function createVehicleYear(data) {
	let output = 'Unknown Year ';
	if (data?.mot?.manufactureDate) output = data.mot.manufactureDate.split('-')[0] + ' ';
	if (data?.mot?.manufactureYear) output = data.mot.manufactureYear + ' ';
	if (data?.ves?.yearOfManufacture) output = data.ves.yearOfManufacture + ' ';
	if (data?.vin?.plate_lookup?.year) output = data.vin.plate_lookup.year + ' ';
	return { year: output };
}

module.exports = { createVehicleYear }