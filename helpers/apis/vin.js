require('dotenv').config();
const TokenManager = require('../auth/vin');

/**
 * Fetch VIN from VIN API
 * @param {string} registration Vehicle registration
 * @returns {Promise<Object>} Vehicle data
 */
async function fetchVIN(registration) {
  const tokenManager = new TokenManager({
    authUrl: process.env.VIN_AUTH_URL,
    credentials: {
      login: process.env.VIN_USERNAME,
      password: process.env.VIN_PASSWORD
    },
    refreshBuffer: 60000
  });

	const headers = {
		"accept": "application/json, text/plain, */*",
		"accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
		"content-type": "application/json;charset=UTF-8",
	};

	const body = `{"country":"UK","plate":"${registration}","state":"false"}`;

	const response = await tokenManager.fetch(process.env.VIN_URL, { 
		headers, 
		body, 
		method: "POST" 
	});

	if (!response.ok) {
		throw new Error(response.status);
	}

	return await response.json();
}

module.exports = { fetchVIN }
