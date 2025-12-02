require('dotenv').config();
const { InteractionContextType, SlashCommandBuilder, EmbedBuilder, ApplicationIntegrationType } = require('discord.js');
const { validateRegistration } = require('../../helpers/validation/validateRegistration');
const { sanitiseInput } = require('../../helpers/validation/sanitiseInput');
const { calculateColour } = require('../../helpers/formatting/calculateColour');
const { createImportStatus } = require('../../helpers/formatting/createImportStatus');
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

		let data, status;
		try {
			response = await fetchVehicleData(registration, apiConfig);
			console.log(`response = ${JSON.stringify(response)}`);
			data = response.data;
			status = response.status;
		} catch (error) {
			// notify('critical', error);
			console.log(`error: ${error}`);
			const embed = new EmbedBuilder()
				.setTitle(`An error occured fetching vehicle data.`)
				.setDescription(`Registration \`${registration}\` was not found.`)
				.setColor(0xffaa00);
			return interaction.editReply({ embeds: [embed] });
		}

		if (data === null) {
			// Registration does not exist
			const embed = new EmbedBuilder()
				.setTitle(`Vehicle not found.`)
				.addFields({
					name: 'Is the registration correct?',
					value: registration,
					inline: true,
				})
				.setColor(0xffaa00);
			return interaction.editReply({ embeds: [embed] });
		}

		const embedData = {
			make: data?.ves?.make || data?.mot?.make || data?.vin?.Manufacturer || data?.hpi?.make || 'Unknown Make',
			model: data?.hpi?.model || data?.mot?.model || data?.vin?.Model || 'Unknown Model',
			trim: data?.hpi?.derivativeShort || 'No trim level found',
			colour: calculateColour(data?.ves?.colour || data?.vin?.Colour) || '',
			fuelType: data?.mot?.fuelType || data?.ves?.fuelType || 'Unknown',
			recall: data?.mot?.hasOutstandingRecall || 'Unknown',
			vin: data?.vin?.plate_lookup.vin ? `\`${data.vin.plate_lookup.vin}\`` : 'Unknown',
			lastV5: data?.ves?.dateOfLastV5CIssued || 'Unknown',
			year: '', // calculated
			isImported: '', // calculated
			taxStatus: '', // calculated
			taxDue: '', // calculated
			motStatus: '', // calculated
			motDue: '', // calculated
			motDefectsSummary: '', //calculated
			vehicleStatus: '', // calculated
			taxCost: '', // calculated
			lez: '', // @TODO: calculate LEZ compliance with euro status
			embedColour: '', // calculated
		};

		// Create vehicleStatus and embedColour
		Object.assign(
			embedData,
			createVehicleStatus(data?.hpi, registration),
			createVehicleYear(data),
			createImportStatus(data?.ves),
			createTaxStatus(data?.ves),
			createTaxCost(data?.ves, data?.mot),
			createMotStatus(data?.ves),
			processMotDefects(data?.mot?.motTests),
		);

		const embedFields = [
			{ name: 'Vehicle Status', value: embedData.vehicleStatus, inline: true },
			{ name: 'VIN', value: embedData.vin, inline: true },
			{ name: 'Last V5C', value: embedData.lastV5, inline: true },
			{
				name: 'Last 5 years:',
				value: embedData.motDefectsSummary,
				inline: false,
			},
			{ name: 'Tax Status', value: embedData.taxStatus, inline: true },
			{ name: 'Tax Expiry', value: embedData.taxDue, inline: true },
			{ name: 'Tax Cost', value: embedData.taxCost, inline: true },
			{ name: 'MOT Status', value: embedData.motStatus, inline: true },
			{ name: 'MOT Expiry', value: embedData.motDue, inline: true },
		];

		console.log(embedFields);

		const embed = new EmbedBuilder()
			.setTitle(`${embedData.colour} ${embedData.year}${embedData.make} ${embedData.model}`)
			.setDescription(`${embedData.isImported}${embedData.trim}`)
			.addFields(embedFields)
			.setFooter({ text: `${registration}${status}` })
			.setColor(embedData.embedColour);

		return interaction.editReply({ embeds: [embed] });
	},
};
