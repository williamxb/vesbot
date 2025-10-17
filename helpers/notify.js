require('dotenv').config();
const { EmbedBuilder } = require('discord.js');

/**
 * Notification functionality - sends Discord webhook to predefined endpoint.
 * @param {string} severity Severity of issue
 * @param {string} message Error message
 */
function notify(severity, message) {
	const notificationUrl = process.env.DISCORD_NOTIFICATION_WEBHOOK_URL;
	let colour = '';
	switch (severity) {
		case 'critical':
			colour = 0xff0000;
			break;
		case 'warning':
			colour = 0xffa500;
			break;
		case 'info':
			colour = 0x0000ff;
			break;
		default:
			colour = 0x0000ff;
	}

	const embed = new EmbedBuilder()
		.setColor(colour)
		.setFooter({
			text: 'vesbot',
		})
		.setTimestamp(new Date())
		.setFields({
			name: severity,
			value: message,
			inline: false,
		});

	try {
		fetch(notificationUrl, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				content: null,
				embeds: [embed],
			}),
		});
	} catch (error) {
		console.error('Error sending notification:', error);
	}
}

module.exports = { notify };
