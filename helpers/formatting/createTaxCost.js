const { add, compareDesc } = require('date-fns');

/**
 * VED rates for calculating vehicle tax cost
 * @TODO: add tax bands to response and testing
 */
const vedRates = [
	{ co2: 100, band: 'A', rate: 20 },
	{ co2: 110, band: 'B', rate: 20 },
	{ co2: 120, band: 'C', rate: 35 },
	{ co2: 130, band: 'D', rate: 165 },
	{ co2: 140, band: 'E', rate: 195 },
	{ co2: 150, band: 'F', rate: 215 },
	{ co2: 165, band: 'G', rate: 265 },
	{ co2: 175, band: 'H', rate: 315 },
	{ co2: 185, band: 'I', rate: 345 },
	{ co2: 200, band: 'J', rate: 395 },
	{ co2: 225, band: 'K', rate: 430 },
	{ co2: 255, band: 'L', rate: 735 },
	{ co2: 999, band: 'M', rate: 760 },
];

/**
 * Create vehicle tax cost and import likeliness
 * @param {Object} ves data from DVSA MOT API
 * @param {Object} mot data from DVLA VES API
 * @returns {string} calculated tax cost
 */
function createTaxCost(ves, mot) {
	if (!mot?.registrationDate && !ves?.monthOfFirstRegistration) {
		return { taxCost: 'Unknown' };
	}

	if (ves?.monthOfFirstDvlaRegistration) {
		// imported vehicle = PLG Vehicle for tax rates
		return { taxCost: '(TC39) £345' };
	}

	let taxCost = '';
	const co2Emissions = ves?.co2Emissions;
	const engineCapacity = ves?.engineCapacity || mot?.engineSize;

	const regAfter2017 = new Date('2017-04-01');
	const emissionsMarch2006Cutoff = new Date('2006-03-23');
	const regAfter2001 = new Date('2001-03-01');

	const registrationDate = new Date(mot?.registrationDate || `${ves?.monthOfFirstRegistration}-01`,);
	const currentDate = new Date();

	if (compareDesc(regAfter2017, registrationDate) === 1) {
		const luxTaxDateThreshold = add(registrationDate, { years: 5 });
		if (
			compareDesc(currentDate, luxTaxDateThreshold) === 1 ||
			compareDesc(currentDate, luxTaxDateThreshold) === 0
		) {
			taxCost = '£195 / £620';
		} else {
			taxCost = '£195';
		}
	} else if (compareDesc(regAfter2001, registrationDate) === 1) {
		if (!ves?.co2Emissions) return { taxCost: 'Unknown' };

		for (const rate of vedRates) {
			if (co2Emissions <= rate.co2) {
				taxCost = rate.rate;
				break;
			}
		}

		if (
			compareDesc(emissionsMarch2006Cutoff, registrationDate) === -1 &&
			taxCost > 430
		) {
			taxCost = '(K) £430';
		} else {
			taxCost = `£${taxCost}`;
		}
	} else {
		if (!mot?.engineSize && !ves?.engineCapacity) return { taxCost: 'Unknown' };

		if (engineCapacity >= 1549) {
			return { taxCost: '£360' };
		} else {
			return { taxCost: '£220' };
		}
	}

	return { taxCost: taxCost };
}

module.exports = { createTaxCost }
