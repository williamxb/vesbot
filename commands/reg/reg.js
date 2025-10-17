require('dotenv').config();
const {
	InteractionContextType,
	SlashCommandBuilder,
	EmbedBuilder,
} = require('discord.js');
const {
	validateRegistration,
	sanitiseInput,
} = require('../../helpers/validation');
const {
	calculateColour,
	createVehicleStatus,
	detectImportedVehicle,
	createTaxStatus,
	createTaxCost,
	createMotStatus,
} = require('../../helpers/formatting');
const { fetchVehicleData } = require('../../helpers/apis');
const { notify } = require('../../helpers/notify');
const { processMotDefects } = require('../../helpers/mot');

// Embed builder and command handler
module.exports = {
	data: new SlashCommandBuilder()
		.setName('reg')
		.setDescription('Check vehicle details and status')
		.addStringOption((option) =>
			option
				.setName('registration')
				.setDescription('Enter vehicle registration')
				.setRequired(true),
		)
		.setContexts(
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel,
			InteractionContextType.BotDM,
		),

	async execute(interaction) {
		// acknowledge interaction
		await interaction.deferReply();

		const registration = sanitiseInput(
			interaction.options.getString('registration'),
		);

		if (!validateRegistration(registration)) {
			// Input failed validation
			let embed = new EmbedBuilder()
				.setTitle(`Registration failed validation.`)
				.addFields({ name: 'Registration', value: registration, inline: true })
				.setColor(0xff0000);
			return interaction.editReply({ embeds: [embed] });
		}

		const apiConfig = {
			vesApiKey: process.env.VES_API_KEY,
			vinUrl: process.env.VIN_URL,
			motApiKey: process.env.MOT_API_KEY,
		};

		let data, status;
		try {
			response = await fetchVehicleData(registration, apiConfig);
			data = response.data;
			status = response.status;
		} catch (error) {
			const embed = new EmbedBuilder()
				.setTitle(`An error occured.`)
				// .addFields({ name: 'Error:', value: error, inline: true })
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

		let embedData = {
			year:
				`${data.mot?.manufactureDate.split('-')[0]} ` ||
				`${data.ves?.yearOfManufacture} ` ||
				`${data.vin?.Year} ` ||
				'', // add whitespace
			make:
				data.ves?.make ||
				data.mot?.make ||
				data.vin?.Manufacturer ||
				data.hpi?.make ||
				'Unknown',
			model: data.hpi?.model || data.mot?.model || data.vin?.Model || 'Unknown',
			trim: data.hpi?.derivativeShort || 'No trim level found',
			colour: calculateColour(data.ves?.colour || data.vin?.Colour) || '',
			fuelType: data.mot?.fuelType || data.ves?.fuelType || 'Unknown',
			recall: data.mot?.hasOutstandingRecall || 'Unknown',
			vin: `\`${data.vin?.VIN}\`` || null,
			lastV5: data.ves?.dateOfLastV5CIssued || null,
			isImported: '', // calculated
			taxStatus: '', // calculated
			taxDue: '', // calculated
			motStatus: '', // calculated
			motDue: '', // calculated
			motDefectsSummary: '', //calculated
			vehicleStatus: '', // calculated
			taxCost: '', // @TODO: calculate tax based on year, engine size, co2
			lez: '', // @TODO: calculate LEZ compliance with euro status
			embedColour: '', // calculated
		};

		// Create vehicleStatus and embedColour
		Object.assign(embedData, createVehicleStatus(data?.hpi));
		Object.assign(embedData, detectImportedVehicle(data?.ves));
		Object.assign(embedData, createTaxStatus(data?.ves));
		Object.assign(embedData, createTaxCost(data?.ves, data?.mot));
		Object.assign(embedData, createMotStatus(data?.ves));
		Object.assign(embedData, processMotDefects(data.mot.motTests));

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

		const embed = new EmbedBuilder()
			.setTitle(
				`${embedData.colour} ${embedData.year}${embedData.make} ${embedData.model}`,
			)
			.setDescription(`${embedData.isImported}${embedData.trim}`)
			.addFields(embedFields)
			.setFooter({ text: `${registration}${status}` })
			.setColor(embedData.embedColour);

		return interaction.editReply({ embeds: [embed] });
	},
};
