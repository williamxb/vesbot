const { notify } = require('../notify');
const { fetchVES } = require('./dvlaVES');
const { fetchMOT } = require('./dvsaMOT');
const { fetchEuro } = require('./hpiEuro');
const { fetchAT } = require('./at');
const { fetchVIN } = require('./vin');

/**
 *
 * @param {string} registration Vehicle registration
 * @param {Object} apiConfig API keys
 * @returns {Promise<Object>} Successful API responses and statuses
 */
async function fetchVehicleData(registration, apiConfig) {
	const { vesApiKey, motApiKey } = apiConfig;

	const results = await Promise.allSettled([
		fetchVES(registration, vesApiKey),
		fetchMOT(registration, motApiKey),
		fetchEuro(registration),
		fetchAT(registration),
		fetchVIN(registration),
	]);

	// Create objects for API results
	const successful = {};
	const failed = {};

	results.forEach((result, i) => {
		const apiName = ['ves', 'mot', 'euro', 'hpi', 'vin'];

		if (result.status === 'fulfilled') {
			successful[apiName[i]] = result.value;
		} else {
			failed[apiName[i]] = result.reason.toString()
		}
	});

	// all APIs have failed - trigger error message
	if (Object.keys(successful).length === 0) {
		notify('warning', errors)
		throw new Error(`All APIs failed for vehicle ${registration}`);
	}
	
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

	return { data: successful, failed: failedString };
}

module.exports = { fetchVehicleData }