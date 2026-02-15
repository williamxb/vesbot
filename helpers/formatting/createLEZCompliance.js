const { isBefore, startOfDay } = require('date-fns');

/**
 * Convert string to TitleCase
 * @param {string} str string to TitleCase
 * @returns TitleCase string
 */
function toTitleCase(str) { return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }

/**
 * Create registration date
 * @param {Object} ves data from DVSA MOT API
 * @param {Object} mot data from DVLA VES API
 * @returns {Date} registration date
 */
function parseRegistrationDate(mot, ves) {
	const dateString = mot?.registrationDate ?? (ves?.monthOfFirstRegistration && `${ves.monthOfFirstRegistration}-01`);
	
	// no data, nothing to return
	if (!dateString) return null;
	
	// protect against malforced data - invalid dates detected with isNan
	const parsedDate = new Date(dateString);
	return isNaN(parsedDate.getTime()) ? null : parsedDate;
}

/**
 * Estimate LEZ compliance
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
    return { lezTitle: "LEZ ✅", lezStatus: `${fuelType}\nCompliant` }
  }

  // Use EURO API to calculate LEZ compliance
  if (data?.euro?.euroStatus !== "None" && data?.euro?.euroStatus) {
    const euroStatus = toTitleCase(data.euro.euroStatus);

    // petrol - Euro 4 to 6 are compliant
    if (fuelType === "Petrol") {
      const regex = /[4-6]+/g;
      if (regex.test(euroStatus)) {
        return { lezTitle: "LEZ ✅", lezStatus: `${euroStatus} ${fuelType}\nCompliant` }
      } else {
        return { lezTitle: "LEZ ❌", lezStatus: `${euroStatus} ${fuelType}\nNon-compliant` }
      }
    } 

    // diesel - Euro 6 are compliant
    if (fuelType === "Diesel") {
      const regex = /[6]+/g;
      if (regex.test(euroStatus)) {
        return { lezTitle: "LEZ ✅", lezStatus: `${euroStatus} ${fuelType}\nCompliant` }
      } else {
        return { lezTitle: "LEZ ❌", lezStatus: `${euroStatus} ${fuelType}\nNon-compliant` }
      }
    } 
  }

  // EURO API unavailable, but we can still estimate using manufacture date
  const registrationDate = parseRegistrationDate(data?.mot, data?.ves);

	// no registrationDate, LEZ compliance incalculable
	if (!registrationDate) return { lezTitle: "LEZ ❓", lezStatus: "Unknown" }

  // vehicle manufactured between introduction and enforcement MAY still be compliant
  const CUTOFF_Euro4Introduced = startOfDay(new Date('2005-01-01'));
  const CUTOFF_Euro4Mandatory = startOfDay(new Date('2006-01-01'));
  const CUTOFF_Euro6Introduced = startOfDay(new Date('2015-09-01'));
  const CUTOFF_Euro6Mandatory = startOfDay(new Date('2016-09-01'));
 
  switch (fuelType) {
    case "Petrol":
      if (!isBefore(registrationDate, CUTOFF_Euro4Mandatory)) {
        // Vehicle manufactured on the day of or after Euro 4 was made mandatory
        return { lezTitle: "LEZ ✅", lezStatus: `Post-Euro 4 ${fuelType}\nCompliant` }
      }

      if (!isBefore(registrationDate, CUTOFF_Euro4Introduced)) {
        // Vehicle manufactured on the day of or after Euro 4 was introduced
        return { lezTitle: "LEZ ✅⚠️", lezStatus: `Euro 3/4 ${fuelType}\nPotentially compliant` }
      }

      else {
        return { lezTitle: "LEZ ❌", lezStatus: `Pre-Euro 4 ${fuelType}\nNon-compliant` }
      }

    case "Diesel":
      if (!isBefore(registrationDate, CUTOFF_Euro6Mandatory)) {
        // Vehicle manufactured on the day of or after Euro 6 was made mandatory
        return { lezTitle: "LEZ ✅", lezStatus: `Post-Euro 6 ${fuelType}\nCompliant` }
      }

      if (!isBefore(registrationDate, CUTOFF_Euro6Introduced)) {
        // Vehicle manufactured on the day of or after Euro 6 was introduced
        return { lezTitle: "LEZ ✅⚠️", lezStatus: `Euro 5/6 ${fuelType}\nPotentially compliant` }
      }

      else {
        return { lezTitle: "LEZ ❌", lezStatus: `Pre-Euro 6 ${fuelType}\nNon-compliant` }
      }
  }
}

module.exports = { createLEZCompliance }