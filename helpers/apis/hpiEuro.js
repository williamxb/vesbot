/**
 * Fetch Euro status from HPI
 * @param {string} registration Vehicle registration
 * @returns {Promise<Object>} Euro status data
 */
async function fetchEuro(registration) {
	const url = 'https://hpicheck.com/api/euro-status';
	const headers = {
		accept: '*/*',
		'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
		'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
	};
	const body = `vrm=${registration}`;

	const response = await fetch(url, { headers, method: 'POST', body });

	if (!response.ok) {
		throw new Error(response.status);
	}

	const data = await response.json();

	// no data found. api returns 200 regardless of data
	if (data.error) {
		throw new Error('No data found');
	}

	return await data;
}

module.exports = { fetchEuro }