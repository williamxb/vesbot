import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
// Require the necessary discord.js classes
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import config from '#helpers/config.js';
import logger from '#helpers/logger.js';

const token = config.discord.token;

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(import.meta.dirname, 'commands');
const commandFolders = fs
	.readdirSync(foldersPath, { withFileTypes: true })
	.filter((dirent) => dirent.isDirectory())
	.map((dirent) => dirent.name);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);

		// Use dynamic import for ESM
		const fileUrl = pathToFileURL(filePath).href;
		const commandModule = await import(fileUrl);
		const command = commandModule.default || commandModule;

		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			logger.warn(`The command at ${filePath} is missing a required 'data' or 'execute' property.`, { file: filePath });
		}
	}
}

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		logger.error(`No command matching ${interaction.commandName}`, { command: interaction.commandName, user: interaction.user.id });
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		logger.error(error.message || 'Error executing command', { 
			error: error.stack, 
			command: interaction.commandName, 
			user: interaction.user.id 
		});
		if (interaction.replied || interaction.deferred) {
			// await interaction.followUp({ content: "There was an error while executing this command!" });
			await interaction.followUp({ content: error.toString() });
		} else {
			await interaction.reply({ content: error.toString() });
		}
	}
});

// When the client is ready, run this code (only once).
client.once(Events.ClientReady, (readyClient) => {
	logger.info(`Ready! Logged in as ${readyClient.user.tag}`, { user: readyClient.user.tag });

	// Log Discord Gateway Heartbeat every 5 minutes
	setInterval(() => {
		if (client.ws.ping !== -1) {
			logger.info('Discord Gateway Heartbeat', { gatewayPingMs: client.ws.ping });
		}
	}, 300000);
});

// Log in to Discord with your client's token
client.login(token);
