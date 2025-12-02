const { notify } = require('../notify');
const { fetchVES } = require('./dvlaVES');
const { fetchMOT } = require('./dvsaMOT');
const { fetchAT } = require('./at');
const { fetchEuro } = require('./hpiEuro');
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

	const successful = {};
	const failed = {};
	let listApiStatus = '';

	results.forEach((result, i) => {
		const apiName = ['ves', 'mot', 'euro', 'hpi', 'vin'];

		if (result.status === 'fulfilled') {
			successful[apiName[i]] = result.value;
		} else {
			failed[`api${i + 1}`] = result.reason.message;
			listApiStatus += ` • ${apiName[i]} ${result.reason.message}`;
			notify(
				'warning',
				`${apiName[i]} failed for ${registration}: ${result.reason.message}`,
			);
		}
	});

	console.log(
		`${registration} ${Object.keys(successful).length}/${Object.keys(failed).length} ${listApiStatus}`,
	);

	if (Object.keys(successful).length === 0) {
		notify('critical', `All APIs failed for vehicle ${registration}`);
		throw new Error(`All APIs failed for vehicle ${registration}`);
	}

	return { data: successful, status: listApiStatus };
}

module.exports = { fetchVehicleData }