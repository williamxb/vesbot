/**
 * Convert string to TitleCase
 * @param {string} str string to TitleCase
 * @returns TitleCase string
 */
function toTitleCase(str) { 
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); 
}

/**
 * Create vehicle powertrain details
 * @param {Object} data  - entire response from all successful APIs
 * @returns {Object} - object with powertrain property
 */
function createPowertrain(data) {
    // check ves and mot for fuelType
    const rawFuelType = data?.mot?.fuelType || data?.ves?.fuelType;
    if (!rawFuelType) return { powertrain: 'Unknown' };

    const fuelType = toTitleCase(rawFuelType);

    // return 'EV' if Electric
    if (fuelType === 'Electricity' || fuelType === 'Electric') {
        return { powertrain: 'EV' };
    }

    let powertrainDetails = fuelType;

    // check if M1 or bike. Return cc for bike, litres otherwise.
    const engineCapacityCc = data?.mot?.engineCapacity || data?.ves?.engineCapacity;
    if (engineCapacityCc) {
        const typeApproval = data?.ves?.typeApproval || '';
        const wheelplan = data?.ves?.wheelplan || '';

        const isBike = typeApproval.toUpperCase().startsWith('L') || wheelplan.toUpperCase().includes('2 WHEEL');
        
        let engineCapacityStr = '';
        if (isBike) {
            engineCapacityStr = `${engineCapacityCc}cc`;
        } else {
            engineCapacityStr = `${(engineCapacityCc / 1000).toFixed(1)}L`;
        }

        // return engineCapacity + " " + fuelType for petrol, diesel, hybrid, LPG, etc.
        powertrainDetails = `${engineCapacityStr} ${fuelType}`.trim();
    }

    return { powertrain: powertrainDetails };
}

export { createPowertrain };