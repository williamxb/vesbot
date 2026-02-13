// require('dotenv').config();
const { InteractionContextType, SlashCommandBuilder, EmbedBuilder, ApplicationIntegrationType } = require('discord.js');
const { validateRegistration } = require('../../helpers/validation/validateRegistration');
const { sanitiseInput } = require('../../helpers/validation/sanitiseInput');
const { calculateColour } = require('../../helpers/formatting/calculateColour');
const { createImportStatus } = require('../../helpers/formatting/createImportStatus');
const { createLastV5 } = require('../../helpers/formatting/createLastV5');
const { createLEZCompliance } = require('../../helpers/formatting/createLEZCompliance');
const { createMotStatus } = require('../../helpers/formatting/createMotStatus');
const { createTaxCost } = require('../../helpers/formatting/createTaxCost');
const { createTaxStatus } = require('../../helpers/formatting/createTaxStatus');
const { createVehicleStatus } = require('../../helpers/formatting/createVehicleStatus');
const { createVehicleYear } = require('../../helpers/formatting/createVehicleYear');
const { fetchVehicleData } = require('../../helpers/apis/fetchVehicleData');
const { processMotDefects } = require('../../helpers/mot');

// Embed builder and command handler
module.exports = {
	data: new SlashCommandBuilder()
		.setName('reg')
		.setDescription('Check vehicle details and status')
		.addStringOption((option) =>
			option.setName('registration').setDescription('Enter vehicle registration').setRequired(true),
		)
		.setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
		.setIntegrationTypes(ApplicationIntegrationType.UserInstall, ApplicationIntegrationType.GuildInstall),

	async execute(interaction) {
		// acknowledge interaction
		await interaction.deferReply();

		const registration = sanitiseInput(interaction.options.getString('registration'));

		if (!validateRegistration(registration)) {
			// Input failed validation
			const embed = new EmbedBuilder()
				.setTitle(`Registration failed validation.`)
				.addFields({ name: 'Registration', value: registration, inline: true })
				.setColor(0xff0000);
			return interaction.editReply({ embeds: [embed] });
		}

		const apiConfig = {
			vesApiKey: process.env.VES_API_KEY,
			motApiKey: process.env.MOT_API_KEY,
		};

		let data, failed;
		try {
			const response = await fetchVehicleData(registration, apiConfig);
			data = response.data;
			failed = response.failed;
		} catch (error) {
			console.error(error);
			const embed = new EmbedBuilder()
				.setTitle(`An error occured fetching vehicle data.`)
				.setDescription(`Registration \`${registration}\` was not found.`)
				.setColor(0xffaa00);
			return interaction.editReply({ embeds: [embed] });
		}

		if (Object.keys(data).length === 0) {
			// Registration does not exist
			const embed = new EmbedBuilder()
				.setTitle(`Vehicle not found.`)
				.addFields({ name: 'Is the registration correct?', value: registration, inline: true })
				.setColor(0xffaa00);
			return interaction.editReply({ embeds: [embed] });
		}

		const embedData = {
			make: data?.ves?.make || data?.mot?.make || data?.vin?.make || data?.hpi?.make || 'Unknown Make',
			model: data?.hpi?.model || data?.mot?.model || data?.vin?.model || 'Unknown Model',
			trim: data?.hpi?.derivativeShort || data?.vin?.description || 'No trim level found',
			colour: calculateColour(data?.ves?.colour) || '',
			fuelType: data?.mot?.fuelType || data?.ves?.fuelType || 'Unknown',
			vin: data?.vin?.vin ? `\`${data.vin.vin}\`` : 'Unknown', // wrap in backticks
			lastV5: '', // calculated
			year: '', // calculated
			isImported: '', // calculated
			taxStatus: '', // calculated
			taxDue: '', // calculated
			motStatus: '', // calculated
			motDue: '', // calculated
			motDefectsSummary: '', //calculated
			vehicleStatus: '', // calculated
			taxCost: '', // calculated
			lezTitle: '', // calculated
			lezStatus: '', // calculated
			embedColour: '', // calculated
		};

		// Assign calculated data
		Object.assign(
			embedData,
			createVehicleStatus(data?.hpi, registration),
			createVehicleYear(data),
			createImportStatus(data?.ves),
			createLastV5(data?.ves),
			createLEZCompliance(data),
			createTaxStatus(data?.ves),
			createTaxCost(data?.ves, data?.mot),
			createMotStatus(data?.ves),
			processMotDefects(data?.mot?.motTests),
		);

		const embedFields = [
			{ name: 'Vehicle Status', value: embedData.vehicleStatus, inline: true },
			{ name: 'VIN', value: embedData.vin, inline: true },
			{ name: 'Last V5C', value: embedData.lastV5, inline: true },
			{ name: 'Last 5 years:', value: embedData.motDefectsSummary, inline: false },
			{ name: 'Tax Status', value: embedData.taxStatus, inline: true },
			{ name: 'Tax Expiry', value: embedData.taxDue, inline: true },
			{ name: 'Tax Cost', value: embedData.taxCost, inline: true },
			{ name: 'MOT Status', value: embedData.motStatus, inline: true },
			{ name: 'MOT Expiry', value: embedData.motDue, inline: true },
			{ name: embedData.lezTitle, value: embedData.lezStatus, inline: true },
		];

		const embed = new EmbedBuilder()
			.setTitle(`${embedData.colour} ${embedData.year}${embedData.make} ${embedData.model}`)
			.setDescription(`${embedData.isImported}${embedData.trim}`)
			.addFields(embedFields)
			.setFooter({ text: `${registration}${failed}` })
			.setColor(embedData.embedColour);

		return interaction.editReply({ embeds: [embed] });
	},
};
