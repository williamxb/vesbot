const { getAccessToken } = require('../auth/msal')

/**
 * Fetch vehicle data from DVSA MOT API
 * @param {string} registration Vehicle registration
 * @param {string} apikey DVLA MOT API key
 * @returns {Promise<Object>} Vehicle data
 */
async function fetchMOT(registration, apiKey) {
	const token = await getAccessToken();
	const url = `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${registration}`;
	const headers = {
		accept: 'application/json',
		Authorization: `Bearer ${token}`,
		'X-API-KEY': apiKey,
	};

	const response = await fetch(url, { headers });

	if (!response.ok) {
		throw new Error(response.status);
	}

	return await response.json();
}

module.exports = { fetchMOT }