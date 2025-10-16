require('dotenv').config();
const { InteractionContextType, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { validateRegistration, sanitiseInput } = require('../../helpers/validation');
const { getAccessToken } = require('../../helpers/msal');
const { calculateColour, createVehicleStatus } = require('../../helpers/formatting');
const { notify } = require('../../helpers/notify');

// Embed builder and command handler
module.exports = {
  data: new SlashCommandBuilder()
    .setName('reg')
    .setDescription('Check vehicle details and status')
    .addStringOption((option) => option.setName('registration').setDescription('Enter vehicle registration').setRequired(true))
    .setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM),

  async execute(interaction) {
    // acknowledge interaction
    await interaction.deferReply();

    const registration = sanitiseInput(interaction.options.getString('registration'));

    if (!validateRegistration(registration)) {
      // Input failed validation
      let embed = new EmbedBuilder().setTitle(`Registration failed validation.`).addFields({ name: 'Registration', value: registration, inline: true }).setColor(0xff0000);
      return interaction.editReply({ embeds: [embed] });
    }

    const data = await fetchVehicleData(registration);

    if (data === null) {
      // Registration does not exist
      const embed = new EmbedBuilder().setTitle(`Vehicle not found.`).addFields({ name: 'Is the registration correct?', value: registration, inline: true }).setColor(0xff0000);
      return interaction.editReply({ embeds: [embed] });
    }

    let embedData = {
      // @TODO: Sort in order of priority - best data first.
      year: `${data.mot?.manufactureDate.split('-')[0]} ` || `${data.ves?.yearOfManufacture} ` || `${data.vin?.Year} ` || '', // add whitespace
      make: data.mot?.make || data.ves?.make || data.vin?.Manufacturer || data.hpi?.make || 'Unknown',
      model: data.mot?.model || data.vin?.Model || data.hpi?.model || 'Unknown',
      trim: data.hpi?.derivativeShort || 'No trim level found',
      colour: calculateColour(data.ves?.colour || data.vin?.Colour) || 'Unknown',
      fuelType: data.mot?.fuelType || data.ves?.fuelType || 'Unknown',
      recall: data.mot?.hasOutstandingRecall || 'Unknown',
      vin: `\`${data.vin?.VIN}\`` || 'Unknown',
      hasTax: data.ves?.taxStatus || 'Unknown',
      taxDueDate: data.ves?.taxDueDate || 'Unknown',
      hasMot: data.ves?.motStatus || 'Unknown',
      motDueDate: data.ves?.motDueDate || 'Unknown',
      lastV5: data.ves?.dateOfLastV5CIssued || null,
      vehicleStatus: '', // calculate
      embedColour: '', // calculated
      motRecentFails: '', // @TODO: calculate recent reasons for MOT refusal
      taxCost: '', // @TODO: calculate tax based on year, engine size, co2
      lez: '', // @TODO: calculate LEZ compliance with euro status
    };

    Object.assign(embedData, createVehicleStatus(data?.hpi));

    console.log(data.hpi);

    let motDefectsSummary = '';

    const currentYear = new Date().getFullYear();
    for (let test = 0; test < data.mot.motTests?.length; test++) {
      const testYear = parseInt(data.mot.motTests[test].completedDate.split('-')[0], 10);
      if (currentYear - testYear > 5) {
        break; // Stop processing tests older than 5 years
      }
      const year = data.mot.motTests[test].completedDate.split('-')[0];
      const defects = data.mot.motTests[test].defects;

      const defectCounts = {};

      for (let defect of defects) {
        if (defect.type == 'MAJOR' || defect.type == 'DANGEROUS' || defect.type == 'PRS') {
          const categoryDescriptors = {
            '(0': 'Identification of the vehicle',
            '(1': 'Brakes',
            '(2': 'Steering',
            '(3': 'Visibility',
            '(4': 'Lamps, reflectors and electrical equipment',
            '(5': 'Axles, wheels, tyres and suspension',
            '(6': 'Body, structure and attachments',
            '(7': 'SRS, ESC, electrical equipment',
            '(8': 'Noise, emissions, EML',
            '(9': 'Supplementary tests for buses and coaches',
          };
          const categoryMatch = defect.text.match(/\(0|\(1|\(2|\(3|\(4|\(5|\(6|\(7|\(8|\(9/i);
          const category = categoryMatch ? categoryDescriptors[categoryMatch[0]] || 'Other' : 'Other';
          defectCounts[category] = (defectCounts[category] || 0) + 1;
        }
      }

      const defectSummary = Object.entries(defectCounts)
        .map(([category, count]) => `${count}x ${category}`)
        .join(', ');

      if (defectSummary) {
        motDefectsSummary += `${year} - ${defectSummary}\n`;
      }
    }

    embedData.motRecentFails = motDefectsSummary.trim();

    const fields = [
      { name: 'Vehicle Status', value: embedData.vehicleStatus, inline: true },
      { name: 'VIN', value: embedData.vin, inline: true },
    ];

    if (embedData.motRecentFails) {
      fields.push({ name: 'Last 5 years:', value: embedData.motRecentFails, inline: false });
    }

    const embed = new EmbedBuilder()
      .setTimestamp()
      .setTitle(`${embedData.colour} ${embedData.year}${embedData.make} ${embedData.model}`)
      .setDescription(`${embedData.trim}`)
      .addFields(fields)
      .setFooter({ text: `${registration} ${listApiStatus}` })
      .setColor(embedData.embedColour);

    return interaction.editReply({ embeds: [embed] });
  },
};
