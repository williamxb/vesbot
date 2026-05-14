const { add, isBefore, startOfDay } = require('date-fns');

/**
 * VED rates for calculating vehicle tax cost
 * @TODO: add tax bands to response and testing
 */
const vedRates = [
	{ co2: 100, band: 'A', rate: 20 },
	{ co2: 110, band: 'B', rate: 20 },
	{ co2: 120, band: 'C', rate: 35 },
	{ co2: 130, band: 'D', rate: 170 },
	{ co2: 140, band: 'E', rate: 200 },
	{ co2: 150, band: 'F', rate: 225 },
	{ co2: 165, band: 'G', rate: 275 },
	{ co2: 175, band: 'H', rate: 325 },
	{ co2: 185, band: 'I', rate: 360 },
	{ co2: 200, band: 'J', rate: 410 },
	{ co2: 225, band: 'K', rate: 445 },
	{ co2: 255, band: 'L', rate: 760 },
	{ co2: 999, band: 'M', rate: 790 },
];

/**
 * Cutoff dates for different VED calculations
 */
const CUTOFF_2017 = startOfDay(new Date('2017-04-01'));
const CUTOFF_2006 = startOfDay(new Date('2006-03-23'));
const CUTOFF_2001 = startOfDay(new Date('2001-03-01'));

/**
 * Create registration date
 * @param {Object} ves data from DVSA MOT API
 * @param {Object} mot data from DVLA VES API
 * @returns {Date} registration date
 */
function parseRegistrationDate(mot, ves) {
	const dateString = mot?.registrationDate ?? (ves?.monthOfFirstRegistration && `${ves.monthOfFirstRegistration}-01`);
	
	// can't calculate tax rates without registration date, so we return nothing
	if (!dateString) return null;
	
	// protect against malformed data - invalid dates detected with isNan
	const parsedDate = new Date(dateString);
	return isNaN(parsedDate.getTime()) ? null : parsedDate;
}

/**
 * Calculate VED cost
 * @param {Number} co2Emissions 
 * @returns {string} VED cost
 */
function getVedRate(co2Emissions) {
	const rate = vedRates.find(r => co2Emissions <= r.co2);
	return rate?.rate;
}

/**
 * Create vehicle tax cost
 * @param {Object} ves data from DVSA MOT API
 * @param {Object} mot data from DVLA VES API
 * @returns {string} calculated tax cost
 */
function createTaxCost(ves, mot) {
	const registrationDate = parseRegistrationDate(mot, ves);

	// no registrationDate, VED scheme incalculable
	if (!registrationDate) return { taxCost: 'Unknown' };

	const co2Emissions = ves?.co2Emissions;
	const engineCapacity = ves?.engineCapacity || mot?.engineSize;

	// Post-2017: flat rate
	if (!isBefore(registrationDate, CUTOFF_2017)) {
		const vedECSDateThreshold = add(registrationDate, { years: 5 });
		const hasVedECS = isBefore(startOfDay(new Date()), vedECSDateThreshold);
		return { taxCost: hasVedECS ? '£200 / £640' : '£200'}
	}

	// Post-2001: co2 based
	if (!isBefore(registrationDate, CUTOFF_2001) && co2Emissions) {
		let rate = getVedRate(co2Emissions)
		if (!rate) return { taxCost: 'Unknown' }

		// Pre-2006: Band K cap
		if (isBefore(registrationDate, CUTOFF_2006) && rate > 445) {
			return { taxCost: '£445 (Band K cap)' }
		}

		return { taxCost: `£${rate}` }
	}

	// Pre-2001 or grey import: engine capacity based
	if (!engineCapacity) return { taxCost: 'Unknown' }
	return { taxCost: engineCapacity >= 1549 ? '£375' : '£230'}
}

module.exports = { createTaxCost }
