/**
 * Fetch vehicle data from AT API
 * @param {registration} registration Vehicle registration
 * @returns {Promise<Object>} Vehicle data
 */
async function fetchAT(registration) {
	const url = 'https://www.autotrader.co.uk/at-gateway?opname=VrmLookupQuery';
	const headers = {
		accept: '*/*',
		'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
		'content-type': 'application/json',
		Referer: 'https://www.autotrader.co.uk/selling/find-car',
		'Referrer-Policy': 'origin-when-cross-origin',
	};
	const body = `{"operationName":"VrmLookupQuery","variables":{"vrm":"${registration}"},"query":"query VrmLookupQuery($vrm: String!) {\\n  vehicle {\\n    vrmLookup(registration: $vrm) {\\n      make\\n      model\\n      derivativeShort\\n      derivativeId\\n      vehicleType\\n      scrapped\\n      stolen\\n      writeOffCategory\\n      }\\n  }\\n}\\n"}`;
	const response = await fetch(url, { headers, method: 'POST', body });

	if (!response.ok) {
		throw new Error(response.status);
	}

	const data = await response.json();
	if (data.data.vehicle.vrmLookup === null) {
		throw new Error('No data found');
	}

	return await data.data.vehicle.vrmLookup;
}

module.exports = { fetchAT }