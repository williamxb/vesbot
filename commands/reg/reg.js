import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	InteractionContextType,
	SlashCommandBuilder,
} from 'discord.js';
import { fetchVehicleData } from '#helpers/apis/fetchVehicleData.js';
import { calculateColour } from '#helpers/formatting/calculateColour.js';
import { createImportStatus } from '#helpers/formatting/createImportStatus.js';
import { createLastV5 } from '#helpers/formatting/createLastV5.js';
import { createLEZCompliance } from '#helpers/formatting/createLEZCompliance.js';
import { createMileageStats } from '#helpers/formatting/createMileageStats.js';
import { createMotStatus } from '#helpers/formatting/createMotStatus.js';
import { createPowertrain } from '#helpers/formatting/createPowertrain.js';
import { createTaxCost } from '#helpers/formatting/createTaxCost.js';
import { createTaxStatus } from '#helpers/formatting/createTaxStatus.js';
import { createVehicleStatus } from '#helpers/formatting/createVehicleStatus.js';
import { createVehicleYear } from '#helpers/formatting/createVehicleYear.js';
import logger from '#helpers/logger.js';
import { processMotDefects } from '#helpers/mot.js';
import { sanitiseInput } from '#helpers/validation/sanitiseInput.js';
import { validateRegistration } from '#helpers/validation/validateRegistration.js';

// Embed builder and command handler
export default {
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
			const message = await interaction.editReply({ embeds: [embed] });
			logger.warn(`Registration failed validation`, {
				registration,
				user: interaction.user.id,
				guildId: interaction.guildId,
				messageUrl: message.url,
			});
			return message;
		}

		let data, failed;
		try {
			const response = await fetchVehicleData(registration);
			data = response.data;
			failed = response.failed;
		} catch (error) {
			logger.error('Error fetching vehicle data', {
				error: error.stack,
				registration,
				user: interaction.user.id,
				guildId: interaction.guildId,
			});
			const embed = new EmbedBuilder()
				.setTitle(`An error occurred fetching vehicle data.`)
				.setDescription(error.message || `Registration \`${registration}\` could not be processed.`)
				.setColor(0xffaa00);
			return interaction.editReply({ embeds: [embed] });
		}

		if (Object.keys(data).length === 0) {
			// Registration does not exist
			const embed = new EmbedBuilder()
				.setTitle(`Vehicle not found.`)
				.addFields({ name: 'Is the registration correct?', value: registration, inline: true })
				.setColor(0xffaa00);
			const message = await interaction.editReply({ embeds: [embed] });
			logger.info(`Vehicle not found`, {
				registration,
				user: interaction.user.id,
				guildId: interaction.guildId,
				messageUrl: message.url,
			});
			return message;
		}

		const embedData = {
			make: data?.ves?.make || data?.mot?.make || data?.vin?.make || data?.hpi?.make || 'Unknown Make',
			model: data?.hpi?.model || data?.mot?.model || data?.vin?.model || 'Unknown Model',
			trim: data?.hpi?.derivativeShort || data?.vin?.description || 'No trim level found',
			colour: calculateColour(data?.ves?.colour) || '',
			vin: data?.vin?.vin ? `\`${data.vin.vin}\`` : 'Unknown', // wrap in backticks
			powertrain: '', // calculated
			lastV5: '', // calculated
			year: '', // calculated
			isImported: '', // calculated
			taxTitle: '', // calculated
			taxStatus: '', // calculated
			motTitle: '', // calculated
			motStatus: '', // calculated
			motDefectsSummary: '', //calculated
			mileageSummary: '', // calculated
			currentMileage: '', // calculated
			mileageGraphUrl: '', // calculated
			vehicleStatus: '', // calculated
			taxCost: '', // calculated
			lezTitle: '', // calculated
			lezStatus: '', // calculated
			embedColour: '', // calculated
		};

		const mileageStats = await createMileageStats(
			data?.mot?.motTests,
			data?.ves?.yearOfManufacture ||
			data?.mot?.manufactureYear ||
			data?.mot?.manufactureDate ||
			data?.vin?.plate_lookup?.year,
		);

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
			createMotStatus(data?.ves, data?.mot),
			createPowertrain(data),
			processMotDefects(data?.mot?.motTests),
			mileageStats,
		);

		const generateEmbed = (page) => {
			const embed = new EmbedBuilder()
				.setTitle(`${embedData.colour} ${embedData.year}${embedData.make} ${embedData.model}`)
				.setDescription(`${embedData.isImported}${embedData.trim}`)
				.setFooter({ text: `${registration}${failed}` })
				.setColor(embedData.embedColour);

			if (page === 'overview') {
				embed.addFields([
					{ name: 'Vehicle Status', value: embedData.vehicleStatus },
					{ name: embedData.taxTitle || 'Tax Status', value: embedData.taxStatus },
					{ name: embedData.motTitle || 'MOT Status', value: embedData.motStatus },
					{ name: embedData.lezTitle || 'LEZ Status', value: embedData.lezStatus },
				]);
				if (embedData.currentMileage && embedData.currentMileage !== 'Unknown') {
					embed.addFields([{ name: 'Last Known Mileage', value: embedData.currentMileage, inline: true }]);
				}
			} else if (page === 'technical') {
				embed.addFields([
					{ name: 'VIN', value: embedData.vin, inline: true },
					{ name: 'Last V5C', value: embedData.lastV5, inline: true },
					{ name: 'Powertrain', value: embedData.powertrain },
					{ name: 'Tax Cost', value: embedData.taxCost, inline: true },
				]);
			} else if (page === 'history') {
				if (embedData.mileageSummary) {
					embed.addFields([{ name: 'Mileage History', value: embedData.mileageSummary, inline: false }]);
				}
				embed.addFields([
					{ name: 'Last 5 years MOT Defects', value: embedData.motDefectsSummary || 'No MOT defects', inline: false },
				]);

				if (embedData.mileageGraphUrl) {
					embed.setImage(embedData.mileageGraphUrl);
				}
			}
			return embed;
		};

		const getRow = (currentPage) => {
			return new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('overview')
					.setLabel('📋 Overview')
					.setStyle(currentPage === 'overview' ? ButtonStyle.Primary : ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId('technical')
					.setLabel('🔧 Technical')
					.setStyle(currentPage === 'technical' ? ButtonStyle.Primary : ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId('history')
					.setLabel('🛠️ MOT & Mileage')
					.setStyle(currentPage === 'history' ? ButtonStyle.Primary : ButtonStyle.Secondary),
			);
		};

		let currentPage = 'overview';
		const message = await interaction.editReply({
			embeds: [generateEmbed(currentPage)],
			components: [getRow(currentPage)],
		});

		logger.info(`Successfully processed registration`, {
			registration,
			user: interaction.user.id,
			guildId: interaction.guildId,
			messageUrl: message.url,
		});

		// Interactive Component Collector (5-minute timeout)
		const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

		collector.on('collect', async (i) => {
			// Ensure only the user who ran the command can use the buttons
			if (i.user.id !== interaction.user.id) {
				await i.reply({
					content: 'These buttons are not for you! Run the command yourself to enable interactivity.',
					ephemeral: true,
				});
				return;
			}
			currentPage = i.customId;
			await i.update({
				embeds: [generateEmbed(currentPage)],
				components: [getRow(currentPage)],
			});
		});

		collector.on('end', () => {
			// Disable buttons after timeout
			const disabledRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('overview')
					.setLabel('📋 Overview')
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true),
				new ButtonBuilder()
					.setCustomId('technical')
					.setLabel('🔧 Technical')
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true),
				new ButtonBuilder()
					.setCustomId('history')
					.setLabel('🛠️ MOT & Mileage')
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true),
			);
			const expiredEmbed = generateEmbed(currentPage);
			expiredEmbed.setFooter({ text: `${registration}${failed} \n\nButtons expired, resend command to interact` });
			interaction.editReply({ embeds: [expiredEmbed], components: [disabledRow] }).catch(() => {});
		});

		return message;
	},
};
