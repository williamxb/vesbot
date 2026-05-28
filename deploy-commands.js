import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { REST, Routes } from 'discord.js';
import config from '#helpers/config.js';

const clientId = config.discord.clientId;
const token = config.discord.token;

const commands = [];
// Grab all command folders
const foldersPath = path.join(import.meta.dirname, 'commands');
const commandFolders = fs
	.readdirSync(foldersPath, { withFileTypes: true })
	.filter((dirent) => dirent.isDirectory())
	.map((dirent) => dirent.name);

// Loop through each folder
for (const folder of commandFolders) {
	// Grab all command files
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const fileUrl = pathToFileURL(filePath).href;
		const commandModule = await import(fileUrl);
		const command = commandModule.default || commandModule;

		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

//  Constuct an instance of the REST module
const rest = new REST().setToken(token);

// Deploy commands
(async () => {
	try {
		console.log(`Refreshing ${commands.length} commands...`);

		const data = await rest.put(Routes.applicationCommands(clientId), {
			body: commands,
		});

		console.log(`Successfully reloaded ${data.length} commands.`);
	} catch (error) {
		console.error(error);
	}
})();
