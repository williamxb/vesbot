import { format, formatDistance, compareDesc, startOfDay } from 'date-fns';

/**
 * Create MOT status
 * @param {Object} ves data from DVLA VES API
 * @param {Object} mot data from DVSA MOT API
 * @returns {string} description of MOT status
 */
function createMotStatus(ves, mot) {
	const firstRegistrationDateStr = mot?.registrationDate || ves?.monthOfFirstRegistration;

	// New car, no MOT required yet
	if (ves?.motStatus === 'No details held by DVLA' &&
		ves?.typeApproval === 'M1' &&
		firstRegistrationDateStr) {

		const firstMotDue = new Date(firstRegistrationDateStr);
		firstMotDue.setFullYear(firstMotDue.getFullYear() + 3);

		if (firstMotDue > new Date()) {
			return { motTitle: `First MOT due ${format(firstMotDue, 'dd/MM/yyyy')}`, motStatus: `${formatDistance(firstMotDue, new Date(), { addSuffix: true })}` };
		}

		// missing first MOT
		if (firstMotDue > new Date() && !ves?.motStatus) return { motTitle: '❌ MOT Expired', motStatus: `${formatDistance(firstMotDue, new Date(), { addSuffix: true })}` };
	}

	// MOT status not known
	if (!ves?.motStatus) return { motTitle: 'MOT status unknown', motStatus: 'Status is unavailable' };

	// create title
	let motTitle = '';
	switch (ves.motStatus) {
		case 'Valid':
			motTitle = '✅ MOT Valid';
			break;
		case 'Not valid':
			motTitle = '❌ MOT Expired';
			break;
		case 'No details held by DVLA':
			motTitle = '⚠️ No MOT history';
			break;
		default:
			motTitle = 'MOT Status Unknown';
			break;
	}

	// create due date
	let motDue = 'Could not determine expiry'
	if (ves.motExpiryDate) {
		const currentDate = startOfDay(new Date());
		const motExpiryDate = startOfDay(new Date(ves.motExpiryDate));

		switch (compareDesc(motExpiryDate, currentDate)) {
			case -1: // current
				motDue = `Expires ${formatDistance(motExpiryDate, currentDate, { addSuffix: true })}`;
				break;
			case 0:
				motDue = `Expires today`;
				break;
			case 1: // expired
				motDue = `Expired ${formatDistance(motExpiryDate, currentDate, { addSuffix: true })}`;
				break;
		}
	}

	return { motTitle: motTitle, motStatus: motDue };
}

export { createMotStatus };