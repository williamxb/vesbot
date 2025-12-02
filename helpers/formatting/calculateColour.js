/**
 * Map vehicle colour to emoji
 * @param {string} colour Colour name
 * @returns {string} Emoji if matched, otherwise the original colour
 */
function calculateColour(colour) {
	const colourMap = {
		WHITE: '⚪️',
		SILVER: '⚪️',
		BLACK: '⚫️',
		RED: '🔴',
		BLUE: '🔵',
		BROWN: '🟤',
		ORANGE: '🟠',
		GREEN: '🟢',
		YELLOW: '🟡',
		PURPLE: '🟣',
	};

	return colourMap[colour] || colour;
}

module.exports = { calculateColour }