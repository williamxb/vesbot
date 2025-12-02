/**
 * Detect if a vehicle has been imported
 * @param {Object} vehicle data from DVLA VES API
 * @returns {string} null, or message if vehicle has been imported
 */
function createImportStatus(vehicle) {
	if (vehicle?.monthOfFirstDvlaRegistration)
		return { isImported: '**Imported vehicle**\n' };
	return { isImported: '' };
}

module.exports = { createImportStatus }