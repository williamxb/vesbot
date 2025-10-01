require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const vinUrl = process.env.VIN;

const atHeaders = {
  'accept': '*/*',
  'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
  'content-type': 'application/json',
  'priority': 'u=1, i',
  'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132", "Microsoft Edge";v="132"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'x-sauron-app-name': 'paygo-app',
  'x-sauron-app-version': '91e4424e57',
  'Referer': 'https://www.autotrader.co.uk/selling/find-car',
  'Referrer-Policy': 'origin-when-cross-origin',
};

function atBody(registration) {
  return `{"operationName":"VrmLookupQuery","variables":{"vrm":"${registration}"},"query":"query VrmLookupQuery($vrm: String!) {\\n  vehicle {\\n    vrmLookup(registration: $vrm) {\\n      make\\n      model\\n      derivativeShort\\n      derivativeId\\n      vehicleType\\n      scrapped\\n      stolen\\n      writeOffCategory\\n      }\\n  }\\n}\\n"}`;
}

function validateRegistration(registration) {
  // https://gist.github.com/danielrbradley/7567269
  const regex =
    /(^[A-Z]{2}[0-9]{2}\s?[A-Z]{3}$)|(^[A-Z][0-9]{1,3}[A-Z]{3}$)|(^[A-Z]{3}[0-9]{1,3}[A-Z]$)|(^[0-9]{1,4}[A-Z]{1,2}$)|(^[0-9]{1,3}[A-Z]{1,3}$)|(^[A-Z]{1,2}[0-9]{1,4}$)|(^[A-Z]{1,3}[0-9]{1,3}$)|(^[A-Z]{1,3}[0-9]{1,4}$)|(^[0-9]{3}[DX]{1}[0-9]{3}$)/i;
  return regex.test(registration);
}

function createVehicleStatus(vehicle) {
  if (vehicle.stolen == false && vehicle.scrapped == false && vehicle.writeOffCategory == 'none') {
    return { vehicleStatus: 'Clean ✨', embedColour: 0x00b67a };
  } else {
    const status = [vehicle.stolen ? '**Stolen**' : null, vehicle.scrapped ? '**Scrapped**' : null, vehicle.writeOffCategory !== 'none' ? `**Write-off - CAT ${vehicle.writeOffCategory}**` : null].filter(Boolean).join(', ');
    return { vehicleStatus: status, embedColour: 0xb11212 };
  }
}

function formatVehicleData(data1, data2) {
  let data1Formatted = {
    make: data1.make,
    model: data1.model,
    derivativeShort: data1.derivativeShort,
    vehicleType: data1.vehicleType,
    scrapped: data1.scrapped,
    stolen: data1.stolen,
    writeOffCategory: data1.writeOffCategory,
  };

  let data2Formatted = {
    make: data2.Manufacturer,
    model: data2.Model,
    colour: data2.Colour,
    year: data2.Year,
    vin: data2.VIN,
  };

  return Object.assign(data2Formatted, data1Formatted);
}

async function getVehicleData(registration) {
  const request1 = fetch('https://www.autotrader.co.uk/at-gateway?opname=VrmLookupQuery', {
    method: 'POST',
    headers: atHeaders,
    body: atBody(registration),
  }).then((response) => response.json())
    .then((data) => {
      if (data.data.vehicle.vrmLookup === null) {
        throw new Error('Vehicle not found');
      }
      return data;
    });

  const request2 = fetch(vinUrl + registration)
    .then((response) => response.json())
    .catch((error) => {
      console.error(error);
    });

  let data = await Promise.all([request1, request2])
    .then(([data1, data2]) => {
      console.log(`data1 \n`, data1);
      console.log(`data2 \n`, data2);
      return formatVehicleData(data1.data.vehicle.vrmLookup, data2);
    })
    .catch((data1, data2) => {
      console.log('error');
      console.log(`data1 \n`, data1);
      console.log(`data2 \n`, data2);
      return;
    });

  return data;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reg')
    .setDescription('Check vehicle registration')
    .addStringOption((option) => option.setName('registration').setDescription('Enter vehicle registration')),

  async execute(interaction) {
    let registration = validateRegistration(interaction.options.getString('registration')) ? interaction.options.getString('registration') : null;

    if (!registration) {
      let embed = new EmbedBuilder()
        .setTitle(`Registration failed validation.`)
        .addFields({ name: 'Registration', value: registration || 'N/A', inline: true })
        .setColor(0xff0000);
      return interaction.reply({ embeds: [embed] });
    }

    let vehicle = await getVehicleData(registration);

    /* debug */ console.log(vehicle);

    if (vehicle.errors) return interaction.reply(`Error: ${vehicle.errors[0].message}`); // @TODO: test

    if (vehicle === null) {
      // @TODO: test
      let embed = new EmbedBuilder()
        .setTitle(`Vehicle not found.`)
        .addFields({ name: 'Registration', value: registration || 'N/A', inline: true })
        .setColor(0xff0000);
      return interaction.reply({ embeds: [embed] });
    }

    const { vehicleStatus, embedColour } = createVehicleStatus(vehicle);

    const embed = new EmbedBuilder()
      .setTitle(`${vehicle.year} ${vehicle.make} ${vehicle.model}`)
      .setDescription(`${vehicle.derivativeShort}`)
      .addFields({ name: 'Vehicle Status', value: `${vehicleStatus}`, inline: true }, { name: 'VIN', value: `${vehicle.vin}`, inline: false })
      .setThumbnail('https://cdn.discordapp.com/attachments/898978000000000000/899000000000000000/autotrader.png')
      .setFooter({ text: `${registration.toUpperCase()}` })
      .setColor(embedColour);

    return interaction.reply({ embeds: [embed] });
  },
};
