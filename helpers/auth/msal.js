const msal = require('@azure/msal-node');
const appConfig = require('../config');

const config = {
	auth: {
		clientId: appConfig.apis.mot.clientId,
		authority: appConfig.apis.mot.authority,
		clientSecret: appConfig.apis.mot.clientSecret,
	},
};

const cca = new msal.ConfidentialClientApplication(config);

/**
 * Authenticate client: Run MSAL OAuth 2.0 client credentials flow
 * @returns OAuth 2.0 Bearer Token
 */
async function getAccessToken() {
	const tokenRequest = { scopes: [appConfig.apis.mot.scope] };
	const response = await cca.acquireTokenByClientCredential(tokenRequest);
	return response.accessToken;
}

module.exports = {
	getAccessToken,
};
