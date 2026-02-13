const { formatDistance, compareDesc, startOfDay } = require('date-fns');

/**
 * Create MOT status
 * @param {Object} vehicle data from DVLA VES API
 * @returns {string} description of MOT status
 */
function createMotStatus(vehicle) {
	if (!vehicle?.motStatus) return { motStatus: 'Unknown', motDue: 'Unknown' };

	const motStatus = vehicle.motStatus;
	let motDue = '';
	
	if (vehicle.motExpiryDate) {
		const currentDate = startOfDay(new Date());
		const motExpiryDate = startOfDay(new Date(vehicle.motExpiryDate));

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