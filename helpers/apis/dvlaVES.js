import { getAccessToken  } from '#helpers/auth/msal.js';
import config from '#helpers/config.js';

/**
 * Fetch vehicle details from DVLA VES API
 * @param {string} registration Vehicle registration
 * @returns {Promise<Object>} Vehicle data
 */
async function fetchVES(registration) {
	const url = `https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles`;
	const headers = {
		accept: 'application/json',
		'x-api-key': config.apis.ves.key,
	};
	const body = { registrationNumber: registration };

	const response = await fetch(url, {
		headers,
		method: 'POST',
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new Error(response.status);
	}

	return await response.json();
}

export { fetchVES };