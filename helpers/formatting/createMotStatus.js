const { formatDistance, compareDesc } = require('date-fns');

/**
 * Create MOT status
 * @param {Object} vehicle data from DVLA VES API
 * @returns {string} description of MOT status
 */
function createMotStatus(vehicle) {
	if (!vehicle?.motStatus) return { motStatus: 'Unknown', motDue: 'Unknown' };

	const currentDate = new Date().setHours(24, 0, 0, 0);
	const motStatus = vehicle.motStatus;
	let motDue = '';

	if (vehicle.motExpiryDate) {
		const motExpiryDate = new Date(vehicle.motExpiryDate).setHours(24, 0, 0, 0);

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
	} else {
		motDue = 'Unknown';
	}

	return { motStatus: motStatus, motDue: motDue };
}

module.exports = { createMotStatus }