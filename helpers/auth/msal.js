require('dotenv').config();
const msal = require('@azure/msal-node');

const config = {
	auth: {
		clientId: process.env.MOT_CLIENT_ID,
		authority: process.env.MOT_CLIENT_AUTHORITY,
		clientSecret: process.env.MOT_CLIENT_SECRET,
	},
};

const cca = new msal.ConfidentialClientApplication(config);

/**
 * Authenticate client: Run MSAL OAuth 2.0 client credentials flow
 * @returns OAuth 2.0 Bearer Token
 */
async function getAccessToken() {
	const tokenRequest = { scopes: [process.env.MOT_CLIENT_SCOPE_URL] };
	const response = await cca.acquireTokenByClientCredential(tokenRequest);
	return response.accessToken;
}

module.exports = {
	getAccessToken,
};
