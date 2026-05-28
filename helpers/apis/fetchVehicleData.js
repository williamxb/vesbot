import { notify  } from '#helpers/notify.js';
import { fetchVES  } from '#helpers/apis/dvlaVES.js';
import { fetchMOT  } from '#helpers/apis/dvsaMOT.js';
import { fetchEuro  } from '#helpers/apis/hpiEuro.js';
import { fetchAT  } from '#helpers/apis/at.js';
import { fetchVIN  } from '#helpers/apis/vin.js';
import config from '#helpers/config.js';
import logger from '#helpers/logger.js';
import Keyv from 'keyv';

let cache = null;
if (config.cache.enabled) {
	cache = new Keyv(config.cache.uri, { ttl: config.cache.ttlDays * 24 * 60 * 60 * 1000 });
	cache.on('error', err => logger.error('Cache connection error', { error: err.message }));
}

async function timedFetch(apiName, fetchPromise, registration) {
	const start = Date.now();
	try {
		const result = await fetchPromise;
		const durationMs = Date.now() - start;
		logger.info(`Successfully fetched data from ${apiName}`, { api: apiName, registration, durationMs });
		return result;
	} catch (error) {
		const durationMs = Date.now() - start;
		if (error.message === '429') {
			logger.warn(`Rate Limit Hit on ${apiName}`, { api: apiName, registration, durationMs });
		} else {
			logger.warn(`API Error on ${apiName}`, { api: apiName, registration, durationMs, error: error.message });
		}
		throw error;
	}
}

async function fetchWithCache(apiName, fetchPromiseFn, registration) {
	if (!cache || apiName === 'mot') {
		// Bypass cache if disabled or for MOT (real-time results needed)
		return timedFetch(apiName, fetchPromiseFn(), registration);
	}
	
	const cacheKey = `${apiName}:${registration}`;
	const cachedData = await cache.get(cacheKey);
	
	if (cachedData) {
		logger.info(`Cache hit for ${apiName}`, { api: apiName, registration });
		return cachedData;
	}
	
	const data = await timedFetch(apiName, fetchPromiseFn(), registration);
	await cache.set(cacheKey, data);
	return data;
}

/**
 * Send requests to enabled APIs and return results
 * @param {string} registration Vehicle registration
 * @returns {Promise<Object>} Successful API responses and failure statuses
 */
async function fetchVehicleData(registration) {
	const tasks = [];

	if (config.apis.ves.enabled) tasks.push({ name: 'ves', promise: fetchWithCache('ves', () => fetchVES(registration), registration) });
	if (config.apis.mot.enabled) tasks.push({ name: 'mot', promise: fetchWithCache('mot', () => fetchMOT(registration), registration) });
	if (config.apis.vin.enabled) tasks.push({ name: 'vin', promise: fetchWithCache('vin', () => fetchVIN(registration), registration) });
	
	// no authentication, so enabled by default
	tasks.push({ name: 'euro', promise: fetchWithCache('euro', () => fetchEuro(registration), registration) });
	tasks.push({ name: 'hpi', promise: fetchWithCache('hpi', () => fetchAT(registration), registration) });

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