const { getAccessToken } = require('./msal')
const { notify } = require('./notify');

/**
 * Fetch vehicle details from DVLA VES API
 * @param {string} registration Vehicle registration
 * @param {string} apiKey DVLA VES API key
 * @returns {Promise<Object>} Vehicle data
 */
async function fetchVES(registration, apiKey) {
  const url = `https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles`;
  const headers = {
    'accept': 'application/json',
    'x-api-key': apiKey,
  };
  const body = { registrationNumber: registration };

  const response = await fetch(url, { headers, method: 'POST', body: JSON.stringify(body) });

  if (!response.ok) {
    throw new Error(response.status);
  }

  return await response.json();
}

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
    'accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-API-KEY': apiKey,
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(response.status);
  }

  return await response.json();
}

/**
 * Fetch Euro status from HPI
 * @param {string} registration Vehicle registration
 * @returns {Promise<Object>} Euro status data
 */
async function fetchEuro(registration) {
  const url = 'https://hpicheck.com/api/euro-status';
  const headers = {
    'accept': 'application/json',
    'user-agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
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

/**
 * Fetch vehicle data from AT API
 * @param {registration} registration Vehicle registration
 * @returns {Promise<Object>} Vehicle data
 */
async function fetchAT(registration) {
  const url = 'https://www.autotrader.co.uk/at-gateway?opname=VrmLookupQuery';
  const headers = {
    'accept': '*/*',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'content-type': 'application/json',
    'Referer': 'https://www.autotrader.co.uk/selling/find-car',
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

/**
 * Fetch VIN from VIN API
 * @param {string} registration Vehicle registration
 * @returns {Promise<Object>} Vehicle data
 */
async function fetchVIN(registration, vinUrl) {
  let url = vinUrl + registration;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(response.status);
  }

  return await response.json();
}

/**
 * 
 * @param {string} registration Vehicle registration
 * @param {Object} apiConfig API keys
 * @returns {Promise<Object>} Successful API responses and statuses
 */
async function fetchVehicleData(registration, apiConfig) {
  const { vesApiKey, vinUrl, motApiKey } = apiConfig;

  const results = await Promise.allSettled([
    fetchVES  (registration, vesApiKey),
    fetchMOT  (registration, motApiKey),
    fetchEuro (registration),
    fetchAT   (registration),
    fetchVIN  (registration, vinUrl)
  ]);

  const successful = {};
  const failed = {};
  let listApiStatus = "";

  results.forEach((result, i) => {
    const apiName = ['ves', 'mot', 'euro', 'hpi', 'vin'];

    if (result.status === 'fulfilled') {
      successful[apiName[i]] = result.value;
    } else {
      failed[`api${i + 1}`] = result.reason.message;
      listApiStatus += ` • ${apiName[i]} ${result.reason.message}`;
      notify('warning', `${apiName[i]} failed for ${registration}: ${result.reason.message}`);
    }
  });

  console.log(`${registration} ${Object.keys(successful).length}/${Object.keys(failed).length} ${listApiStatus}`);

  if (Object.keys(successful).length === 0) {
    notify('critical', 'All APIs failed for vehicle ' + registration);
    throw new Error('No data available');
  }

  return { data: successful, status: listApiStatus };
}

module.exports = {
  fetchVES,
  fetchMOT,
  fetchEuro,
  fetchAT,
  fetchVIN,
  fetchVehicleData,
}