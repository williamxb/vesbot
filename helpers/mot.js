const defectDescriptions = {
	'(0': 'Identification of the vehicle',
	'(1': 'Brakes',
	'(2': 'Steering',
	'(3': 'Visibility',
	'(4': 'Lamps, reflectors and electrical equipment',
	'(5': 'Axles, wheels, tyres and suspension',
	'(6': 'Body, structure and attachments',
	'(7': 'SRS, ESC, electrical equipment',
	'(8': 'Noise, emissions, EML',
	'(9': 'Supplementary tests for buses and coaches',
};

/**
 * Check defect type
 * @param {string} type Defect type
 * @returns {boolean} true if defect leads to refusal of MOT
 */
function isFailureDefect(type) {
	// PRS: Pass after Rectification at Station.
	// Defects that have been rectified within one hour of the initial test.
	return type === 'MAJOR' || type === 'DANGEROUS' || type === 'PRS';
}

/**
 * Extract category from defect category number
 * @param {string} text Defect description
 * @returns {string} Defect category description
 */
function extractDefectCategory(text) {
	const categoryMatch = text.match(/\(0|\(1|\(2|\(3|\(4|\(5|\(6|\(7|\(8|\(9/i);
	if (!categoryMatch) return 'Other';
	return defectDescriptions[categoryMatch[0]] || 'Other';
}

/**
 * Create count of defects by category
 * @param {Array} defects Defects of individual MOT test
 * @returns {Object} Defect category count
 */
function countDefectsByCategory(defects) {
	const defectCounts = {};

	for (const defect of defects) {
		if (isFailureDefect(defect.type)) {
			const category = extractDefectCategory(defect.text);
			defectCounts[category] = (defectCounts[category] || 0) + 1;
		}
	}

	return defectCounts;
}

/**
 * Create formatted list of defects
 * @param {Object} defectCounts MOT defect category count
 * @returns {string} Formatted string of categorised defects
 */
function formatDefectCounts(defectCounts) {
	return Object.entries(defectCounts)
		.map(([category, count]) => `${count}x ${category}`)
		.join(', ');
}

/**
 * Process test history, return short summary of failures
 * @param {Array} motTests motTests from MOT API
 * @returns {string} Summary of MOT defects by year
 */
function processMotDefects(motTests) {
	if (!motTests || motTests.length === 0) {
		return { motDefectsSummary: 'No MOT history' };
	}

	const currentYear = new Date().getFullYear();
	let motDefectsSummary = '';

	for (const test of motTests) {
		const testYear = parseInt(test.completedDate.split('-')[0], 10);

		if (currentYear - testYear > 5) {
			break;
		}

		const defects = test.defects || [];
		const defectCount = countDefectsByCategory(defects);
		const defectSummary = formatDefectCounts(defectCount);

		if (defectSummary) {
			motDefectsSummary += `${testYear} - ${defectSummary}\n`;
		}
	}

	if (!motDefectsSummary) motDefectsSummary = 'No MOT fails';

	return { motDefectsSummary: motDefectsSummary };
}

module.exports = { processMotDefects };
