require("dotenv").config();
const msal = require("@azure/msal-node");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// @TODO: implement check for if MSAL client is required
// MSAL setup for DVSA MOT API
const config = {
  auth: {
    clientId: process.env.MOT_CLIENT_ID,
    authority: process.env.MOT_CLIENT_AUTHORITY,
    clientSecret: process.env.MOT_CLIENT_SECRET,
  },
};

const cca = new msal.ConfidentialClientApplication(config);

async function getAccessToken() {
  const tokenRequest = { scopes: [process.env.MOT_CLIENT_SCOPE_URL] };
  const response = await cca.acquireTokenByClientCredential(tokenRequest);
  return response.accessToken;
}

// Notification functionality
function notify(severity, message) {
  const notificationUrl = process.env.DISCORD_NOTIFICATION_WEBHOOK_URL;
  let colour = "";
  switch (severity) {
    case "critical":
      colour = 0xff0000;
      break;
    case "warning":
      colour = 0xffa500;
      break;
    case "info":
      colour = 0x0000ff;
      break;
    default:
      colour = 0x0000ff;
  }

  const embed = new EmbedBuilder()
    .setColor(colour)
    .setFooter({
      text: "vesbot",
    })
    .setTimestamp(new Date())
    .setFields({
      name: severity,
      value: message,
      inline: false,
    });

  try {
    fetch(notificationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: null,
        embeds: [embed],
      }),
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

// Validate registration format
function validateRegistration(registration) {
  // https://gist.github.com/danielrbradley/7567269
  const regex = /(^[A-Z]{2}[0-9]{2}\s?[A-Z]{3}$)|(^[A-Z][0-9]{1,3}[A-Z]{3}$)|(^[A-Z]{3}[0-9]{1,3}[A-Z]$)|(^[0-9]{1,4}[A-Z]{1,2}$)|(^[0-9]{1,3}[A-Z]{1,3}$)|(^[A-Z]{1,2}[0-9]{1,4}$)|(^[A-Z]{1,3}[0-9]{1,3}$)|(^[A-Z]{1,3}[0-9]{1,4}$)|(^[0-9]{3}[DX]{1}[0-9]{3}$)/i;
  return regex.test(registration);
}

// Create vehicle status for embed
// @TODO: ? move this to the AT function
function createVehicleStatus(vehicle) {
  if (vehicle.stolen == false && vehicle.scrapped == false && vehicle.writeOffCategory == "none") {
    return { vehicleStatus: "Clean ✨", embedColour: 0x00b67a };
  } else {
    const status = [vehicle.stolen ? "**Stolen**" : null, vehicle.scrapped ? "**Scrapped**" : null, vehicle.writeOffCategory !== "none" ? `**Write-off - CAT ${vehicle.writeOffCategory}**` : null].filter(Boolean).join(", ");
    return { vehicleStatus: status, embedColour: 0xb11212 };
  }
}

// API fetch functions
async function fetchVES(registration) {
  const url = `https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles`;
  const headers = {
    accept: "application/json",
    "x-api-key": process.env.VES_API_KEY,
  };
  const body = { registrationNumber: registration };

  const response = await fetch(url, { headers, method: "POST", body: JSON.stringify(body) });

  if (!response.ok) {
    throw new Error(response.status);
  }

  return await response.json();
}

async function fetchMOT(registration) {
  const token = await getAccessToken();
  const url = `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${registration}`;
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${token}`,
    "X-API-KEY": process.env.MOT_API_KEY,
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(response.status);
  }

  // @TODO: run advisories against category list and return a summary
  // https://www.gov.uk/guidance/mot-inspection-manual-for-private-passenger-and-light-commercial-vehicles

  return await response.json();
}

async function fetchAT(registration) {
  const url = "https://www.autotrader.co.uk/at-gateway?opname=VrmLookupQuery";
  const headers = {
    accept: "*/*",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "content-type": "application/json",
    Referer: "https://www.autotrader.co.uk/selling/find-car",
    "Referrer-Policy": "origin-when-cross-origin",
  };
  const body = `{"operationName":"VrmLookupQuery","variables":{"vrm":"${registration}"},"query":"query VrmLookupQuery($vrm: String!) {\\n  vehicle {\\n    vrmLookup(registration: $vrm) {\\n      make\\n      model\\n      derivativeShort\\n      derivativeId\\n      vehicleType\\n      scrapped\\n      stolen\\n      writeOffCategory\\n      }\\n  }\\n}\\n"}`;

  const response = await fetch(url, { headers, method: "POST", body });

  if (!response.ok) {
    throw new Error(response.status);
  }

  const data = await response.json();
  if (data.data.vehicle.vrmLookup === null) {
    throw new Error("No data found");
  }

  return await data.data.vehicle.vrmLookup;
}

async function fetchVIN(registration) {
  let url = process.env.VIN_URL + registration;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(response.status);
  }

  return await response.json();
}

// Collect data from all APIs
async function fetchVehicleData(registration) {
  const results = await Promise.allSettled([
    // In order of priority. Best data last.
    fetchMOT(registration), // MOT API
    fetchVES(registration), // VES API
    fetchVIN(registration), // VIN API
    fetchAT(registration), //  AT API
  ]);

  const successful = [];
  const failed = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successful.push({ api: index + 1, data: result.value });
    } else {
      failed.push({ api: index + 1, error: result.reason });
      notify("warning", `API ${index + 1} failed: ${result.reason.message}`);
    }
  });

  // notify if everything failed
  if (successful.length === 0) {
    notify("critical", "All APIs failed for vehicle " + registration);
    return null;
    // throw new Error("No data available");
  }

  const merged = {};
  successful.forEach(({ data }) => {
    Object.assign(merged, data);
  });

  return merged;
}

// Embed builder and command handler
module.exports = {
  data: new SlashCommandBuilder()
    .setName("reg")
    .setDescription("Check vehicle details and status")
    .addStringOption((option) => option.setName("registration").setDescription("Enter vehicle registration").setRequired(true)),

  async execute(interaction) {
    // acknowledge interaction
    await interaction.deferReply();

    // Sanitize and validate input
    const registration = interaction.options
      .getString("registration") // grab user input
      .replace(/[^a-zA-Z0-9]/g, "") // strip non-alphanumeric
      .toUpperCase(); // convert to uppercase

    if (!validateRegistration(registration)) {
      // Input failed validation
      let embed = new EmbedBuilder().setTitle(`Registration failed validation.`).addFields({ name: "Registration", value: registration, inline: true }).setColor(0xff0000);
      return interaction.editReply({ embeds: [embed] });
    }

    const data = await fetchVehicleData(registration);

    if (data === null) {
      // Registration does not exist
      const embed = new EmbedBuilder().setTitle(`Vehicle not found.`).addFields({ name: "Is the registration correct?", value: registration, inline: true }).setColor(0xff0000);
      return interaction.editReply({ embeds: [embed] });
    }

    const { vehicleStatus, embedColour } = createVehicleStatus(data);

    // @TODO: This relies on every API being successful. Fix. Build embed dynamically based on available data.
    const embed = new EmbedBuilder()
      .setTitle(`${data.yearOfManufacture} ${data.make} ${data.model}`)
      .setDescription(`${data.derivativeShort}`)
      .addFields({ name: "Vehicle Status", value: `${vehicleStatus}`, inline: true }, { name: "VIN", value: `${data.VIN}`, inline: false })
      .setFooter({ text: `${registration.toUpperCase()}` })
      .setColor(embedColour);

    return interaction.editReply({ embeds: [embed] });
  },
};
