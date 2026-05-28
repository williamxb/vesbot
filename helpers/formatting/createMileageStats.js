export function createMileageStats(motTests) {
    if (!motTests || motTests.length === 0) return { mileageSummary: '' };

    // Filter to only tests with valid odometer readings
    const validTests = motTests
        .filter(t => t.odometerValue !== undefined && t.odometerValue !== null)
        .map(t => {
            // Some APIs might return "No odometer reading" or similar as string
            const val = parseInt(t.odometerValue, 10);
            if (isNaN(val)) return null;
            
            // Normalize to miles for anomaly calculation
            let normalizedMiles = val;
            if (t.odometerUnit === 'KM') {
                normalizedMiles = Math.round(val * 0.621371);
            }
            
            return {
                date: new Date(t.completedDate),
                value: val,
                unit: t.odometerUnit === 'KM' ? 'km' : 'mi',
                normalizedMiles,
                raw: t
            };
        })
        .filter(t => t !== null)
        .sort((a, b) => a.date - b.date); // Sort oldest to newest

    if (validTests.length === 0) return { mileageSummary: '' };

    const newest = validTests[validTests.length - 1];
    
    // Format number with commas (e.g. 86,928)
    const formatNum = (num) => new Intl.NumberFormat('en-GB').format(num);

    let summary = `🏎️ Current: ${formatNum(newest.value)} ${newest.unit}\n`;

    // Calculate Average
    if (validTests.length > 1) {
        const oldest = validTests[0];
        const yearsDiff = (newest.date - oldest.date) / (1000 * 60 * 60 * 24 * 365.25);
        
        // Only calculate average if we have at least ~1 year of data
        if (yearsDiff >= 0.9) {
            const mileageDiff = newest.normalizedMiles - oldest.normalizedMiles;
            const avg = Math.round(mileageDiff / yearsDiff);
            
            if (avg > 0) {
                // Round average to nearest 100 for a cleaner look
                const roundedAvg = Math.round(avg / 100) * 100;
                summary += `📊 Average: ~${formatNum(roundedAvg)} mi/yr\n`;
            }
        }
    }

    // Tampering Detection (Clocking)
    // Check if any test's normalized mileage is significantly lower than a PREVIOUS test's normalized mileage.
    let anomaly = null;
    let maxMileageSoFar = 0;
    let maxTest = null;
    
    for (const test of validTests) {
        // 1000 mile buffer for minor tester typos or slight misreadings
        if (maxTest && test.normalizedMiles < maxMileageSoFar - 1000) { 
            anomaly = {
                from: maxTest,
                to: test
            };
            // Break on the first anomaly found so we don't spam multiple warnings
            break; 
        }
        if (test.normalizedMiles > maxMileageSoFar) {
            maxMileageSoFar = test.normalizedMiles;
            maxTest = test;
        }
    }

    if (anomaly) {
        summary += `⚠️ Anomaly Detected: Mileage decreased from ${formatNum(anomaly.from.value)} ${anomaly.from.unit} (${anomaly.from.date.getFullYear()}) to ${formatNum(anomaly.to.value)} ${anomaly.to.unit} (${anomaly.to.date.getFullYear()})`;
    }

    return { mileageSummary: summary.trim() };
}
