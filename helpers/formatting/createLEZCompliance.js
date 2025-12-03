const { compareAsc } = require('date-fns');

function toTitleCase(str) {
  if (!str) return ""
  return str
    .toLowerCase()
    .split(' ')
    .map(function (word) {
      return word.charAt(0).toUpperCase().concat(word.substr(1));
    })
    .join(' ');
}

/**
 * Create likely LEZ compliance
 * @param {Object} data entire response from all successful APIs
 * @returns {string} LEZ compliance
 */
function createLEZCompliance(data) {

  // fuel type is unknown, unable to calculate LEZ compliance
  if (!data?.ves?.fuelType && !data?.mot?.fuelType) return { lezTitle: "LEZ ❓", lezStatus: "Unknown" }

  // ves/mot return TitleCase and UPPERCASE respectively. let's use one standard
  const fuelType = toTitleCase(data?.ves?.fuelType || data?.mot?.fuelType)

  // electric/hybrid assumed to be compliant
  if (fuelType === "Electricity"  || fuelType === "Hybrid Electric") {
    return { lezTitle: "LEZ Compliant ✅", lezStatus: fuelType }
  }

  /**
   * Use EURO API to calculate LEZ compliance
   */

  if (data?.euro?.euroStatus) {
    const euroStatus = data.euro.euroStatus;

    // petrol - Euro 4 to 6 are compliant
    if (fuelType === "Petrol") {
      const re = /[4-6]+/g;
      if (re.test(euroStatus)) {
        return { lezTitle: "LEZ ✅", lezStatus: "✅ Meets Euro 4" }
      } else {
        return { lezTitle: "Not LEZ Compliant ❌", lezStatus: `${euroStatus} ${fuelType}` }
      }
    } 

    // diesel - Euro 6 are compliant
    if (fuelType === "Diesel") {
      const re = /[6]+/g;
      if (re.test(euroStatus)) {
        return { lezTitle: "LEZ ❌", lezStatus: "✅ Meets Euro 6" }
      } else {
        return { lezTitle: "Not LEZ Compliant ❌", lezStatus: `${euroStatus} ${fuelType}` }
      }
    } 
  }

  /**
   * EURO API unavailable, but we can still estimate using manufacture date!
   */

  // manufacture date unknown, unable to calculate LEZ compliance
  if (!data?.ves?.manufactureDate && !data?.mot?.manufactureDate) return { lezTitle: "LEZ ❓", lezStatus: "Unknown" }

  // vehicle date setup
  const vehicleDateRaw = data?.ves?.manufactureDate || data?.mot?.manufactureDate;
  const vehicleDate = new Date(vehicleDateRaw).setHours(0, 0, 0, 0);

  // compliance dates setup
  // vehicle manufactured between introduction and enforcement MAY be compliant!
  const euro4Introduced = new Date('2005-01-01').setHours(0, 0, 0, 0);
  const euro4Mandatory = new Date('2006-01-01').setHours(0, 0, 0, 0);
  const euro6Introduced = new Date('2015-09-01').setHours(0, 0, 0, 0);
  const euro6Mandatory = new Date('2016-09-01').setHours(0, 0, 0, 0);

  console.log(fuelType)

  switch (fuelType) {
    case "Petrol":
      if (compareAsc(vehicleDate, euro4Mandatory) >= 0) {
        // Vehicle manufactured on the day of or after Euro 4 was made mandatory
        console.log("euro 4 mandatory")
        return { lezTitle: "LEZ Compliant ✅", lezStatus: `Post-Euro 4 ${fuelType}` }
      }

      if (compareAsc(vehicleDate, euro4Introduced) >= 0) {
        // Vehicle manufactured on the day of or after Euro 4 was introduced
        console.log("euro 4 introduced")
        return { lezTitle: "LEZ Compliant ✅⚠️", lezStatus: `${fuelType}\nMay Meet Euro 4` }
      }

      else {
        return { lezTitle: "Not LEZ Compliant ❌", lezStatus: `Pre-Euro 4 ${fuelType}\nNon-compliant` }
      }

    case "Diesel":
      if (compareAsc(vehicleDate, euro6Mandatory) >= 0) {
        // Vehicle manufactured on the day of or after Euro 6 was made mandatory
        console.log("euro 6 mandatory")
        return { lezTitle: "LEZ Compliant ✅", lezStatus: `Post-Euro 6 ${fuelType}` }
      }

      if (compareAsc(vehicleDate, euro6Introduced) >= 0) {
        // Vehicle manufactured on the day of or after Euro 6 was introduced
        console.log("euro 6 introduced")
        return { lezTitle: "LEZ Compliant ✅⚠️", lezStatus: `${fuelType}\nMay Meet Euro 6` }
      }

      else {
        return { lezTitle: "Not LEZ Compliant ❌", lezStatus: `Pre-Euro 6 ${fuelType}\nNon-compliant` }
      }
  }
}

module.exports = { createLEZCompliance }