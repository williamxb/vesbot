const { notify } = require('../notify');
const { fetchVES } = require('./dvlaVES');
const { fetchMOT } = require('./dvsaMOT');
const { fetchEuro } = require('./hpiEuro');
const { fetchAT } = require('./at');
const { fetchVIN } = require('./vin');
const config = require('../config');

/**
 * Send requests to enabled APIs and return results
 * @param {string} registration Vehicle registration
 * @returns {Promise<Object>} Successful API responses and failure statuses
 */
async function fetchVehicleData(registration) {
	const tasks = [];

	if (config.apis.ves.enabled) tasks.push({ name: 'ves', promise: fetchVES(registration) });
	if (config.apis.mot.enabled) tasks.push({ name: 'mot', promise: fetchMOT(registration) });
	if (config.apis.vin.enabled) tasks.push({ name: 'vin', promise: fetchVIN(registration) });
	
	// no authentication, so enabled by default
	tasks.push({ name: 'euro', promise: fetchEuro(registration) });
	tasks.push({ name: 'hpi', promise: fetchAT(registration) });

	const successful = {}, failed = {}, results = await Promise.allSettled(tasks.map(t => t.promise));
	results.forEach((result, i) => {
		const apiName = tasks[i].name;
		result.status === 'fulfilled' ? successful[apiName] = result.value : failed[apiName] = result.reason.toString();
	});

	let failedString = '\n';

	if (Object.keys(failed).length !== 0) {
		let errors = `**${registration}** \n`;
		let errorArray = [];
		for(const [key, value] of Object.entries(failed)) {
			errors += `**${key}**: ${value}\n`
			errorArray.push(key)
		}
		notify('warning', errors)
		failedString += `${errorArray.join(", ")} failed`
	} 

	// all APIs have failed - trigger error message
	if (Object.keys(successful).length === 0) {
		throw new Error(`All APIs failed for vehicle ${registration}`);
	}

	return { data: successful, failed: failedString };
}

module.exports = { fetchVehicleData }