import 'dotenv/config.js';

// check required variables are in place
const missingVars = [],
	requiredVars = ['DISCORD_APP_TOKEN', 'DISCORD_APP_ID'];

for (const envVar of requiredVars) {
	if (!process.env[envVar]) {
		missingVars.push(envVar);
	}
}

if (missingVars.length > 0) {
	throw new Error(`CRITICAL: Missing required environment variables: ${missingVars.join(', ')}`);
}

export default {
	discord: {
		token: process.env.DISCORD_APP_TOKEN,
		clientId: process.env.DISCORD_APP_ID,
	},
	apis: {
		ves: {
			key: process.env.VES_API_KEY,
			enabled: !!process.env.VES_API_KEY,
		},
		mot: {
			key: process.env.MOT_API_KEY,
			clientId: process.env.MOT_CLIENT_ID,
			clientSecret: process.env.MOT_CLIENT_SECRET,
			authority: process.env.MOT_CLIENT_AUTHORITY,
			scope: process.env.MOT_CLIENT_SCOPE_URL,
			enabled: !!(
				process.env.MOT_API_KEY &&
				process.env.MOT_CLIENT_ID &&
				process.env.MOT_CLIENT_SECRET &&
				process.env.MOT_CLIENT_AUTHORITY &&
				process.env.MOT_CLIENT_SCOPE_URL
			),
		},
		vin: {
			url: process.env.VIN_URL,
			authUrl: process.env.VIN_AUTH_URL,
			username: process.env.VIN_USERNAME,
			password: process.env.VIN_PASSWORD,
			enabled: !!(
				process.env.VIN_URL &&
				process.env.VIN_AUTH_URL &&
				process.env.VIN_USERNAME &&
				process.env.VIN_PASSWORD
			),
		},
	},
	notifications: {
		webhookUrl: process.env.DISCORD_NOTIFICATION_WEBHOOK_URL,
		enabled: !!process.env.DISCORD_NOTIFICATION_WEBHOOK_URL,
	},
};
