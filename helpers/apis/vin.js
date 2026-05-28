const TokenManager = require('../auth/vin');
const config = require('../config');

/**
 * Fetch VIN from VIN API
 * @param {string} registration Vehicle registration
 * @returns {Promise<Object>} Vehicle data
 */
async function fetchVIN(registration) {
  const tokenManager = new TokenManager({
    authUrl: config.apis.vin.authUrl,
    credentials: {
      login: config.apis.vin.username,
      password: config.apis.vin.password
    },
    refreshBuffer: 60000
  });

	const headers = {
		"accept": "application/json",
		"content-type": "application/json;charset=UTF-8",
	};

	const body = `{"country":"UK","plate":"${registration}","state":"false"}`;

	const response = await tokenManager.fetch(config.apis.vin.url, { 
		headers, 
		body, 
		method: "POST" 
	});

	if (!response.ok) {
		throw new Error(response.status);
	}
	
	const data = await response.json();
	
	// yes,    HTTP/1.1 200 OK
	// but     {"status": "error"}
	if (data?.status == "error") {
		throw new Error(data.key);
	}

	return data.plate_lookup;
}

module.exports = { fetchVIN }
