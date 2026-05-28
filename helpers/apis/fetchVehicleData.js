import { notify  } from '#helpers/notify.js';
import { fetchVES  } from '#helpers/apis/dvlaVES.js';
import { fetchMOT  } from '#helpers/apis/dvsaMOT.js';
import { fetchEuro  } from '#helpers/apis/hpiEuro.js';
import { fetchAT  } from '#helpers/apis/at.js';
import { fetchVIN  } from '#helpers/apis/vin.js';
import config from '#helpers/config.js';
import logger from '#helpers/logger.js';


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
		
		// Log the explicit failures cleanly for Grafana
		logger.warn(`One or more APIs failed to fetch data`, { 
			registration, 
			failedAPIs: errorArray, 
			errorDetails: failed 
		});
		
		notify('warning', errors)
		failedString += `${errorArray.join(", ")} failed`
	} 

	// all APIs have failed - trigger error message
	if (Object.keys(successful).length === 0) {
		throw new Error(`All APIs failed for vehicle ${registration}`);
	}

	return { data: successful, failed: failedString };
}

export { fetchVehicleData };