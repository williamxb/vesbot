const { getAccessToken } = require('../auth/msal');
const config = require('../config');

/**
 * Fetch vehicle data from DVSA MOT API
 * @param {string} registration Vehicle registration
 * @returns {Promise<Object>} Vehicle data
 */
async function fetchMOT(registration) {
	const token = await getAccessToken();
	const url = `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${registration}`;
	const headers = {
		accept: 'application/json',
		Authorization: `Bearer ${token}`,
		'X-API-KEY': config.apis.mot.key,
	};

	const response = await fetch(url, { headers });

	if (!response.ok) {
		throw new Error(response.status);
	}

	return await response.json();
}

module.exports = { fetchMOT }