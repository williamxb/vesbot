export function createMileageStats(motTests, manufactureYearRaw) {
    if (!motTests || motTests.length === 0) return { mileageSummary: '', currentMileage: 'Unknown', mileageGraphUrl: null };

    let manufactureYear = null;
    if (manufactureYearRaw) {
        const match = manufactureYearRaw.toString().match(/\b(19|20)\d{2}\b/);
        if (match) {
            manufactureYear = parseInt(match[0], 10);
        }
    }

    // Filter to only tests with valid odometer readings
    const validTests = motTests
        .filter(t => t.odometerValue !== undefined && t.odometerValue !== null)
        .map(t => {
            const val = parseInt(t.odometerValue, 10);
            if (isNaN(val)) return null;
            
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

    if (validTests.length === 0) return { mileageSummary: '', currentMileage: 'Unknown', mileageGraphUrl: null };

    const newest = validTests[validTests.length - 1];
    const formatNum = (num) => new Intl.NumberFormat('en-GB').format(num);
    const currentMileageString = `${formatNum(newest.value)} ${newest.unit}`;

    let summary = `🏎️ Current: ${currentMileageString}\n`;

    // Calculate Average, Most in a Year, Least in a Year
    if (validTests.length > 1) {
        const oldest = validTests[0];
        const yearsDiff = (newest.date - oldest.date) / (1000 * 60 * 60 * 24 * 365.25);
        
        if (yearsDiff >= 0.9) {
            const mileageDiff = newest.normalizedMiles - oldest.normalizedMiles;
            const avg = Math.round(mileageDiff / yearsDiff);
            
            if (avg > 0) {
                const roundedAvg = Math.round(avg / 100) * 100;
                summary += `📊 Average: ~${formatNum(roundedAvg)} mi/yr\n`;
            }
        }

        let maxYearly = null;
        let minYearly = null;

        for (let i = 1; i < validTests.length; i++) {
            const prev = validTests[i - 1];
            const curr = validTests[i];
            const gapYears = (curr.date - prev.date) / (1000 * 60 * 60 * 24 * 365.25);
            
            // Look for consecutive tests roughly 1 year apart (0.5 to 1.5 years)
            // This catches early dealership MOTs (e.g. at 6-9 months) while ignoring immediate re-tests
            if (gapYears >= 0.5 && gapYears <= 1.5) {
                const gapMiles = curr.normalizedMiles - prev.normalizedMiles;
                const annualized = Math.round(gapMiles / gapYears);
                
                if (annualized >= 0) {
                    if (!maxYearly || annualized > maxYearly.amount) {
                        maxYearly = { amount: annualized, year: curr.date.getFullYear() };
                    }
                    if (!minYearly || annualized < minYearly.amount) {
                        minYearly = { amount: annualized, year: curr.date.getFullYear() };
                    }
                }
            }
        }

        if (maxYearly && maxYearly.amount > 0) {
            summary += `📈 Most in a yr: ~${formatNum(Math.round(maxYearly.amount / 100) * 100)} mi (${maxYearly.year})\n`;
        }
        if (minYearly && minYearly.amount >= 0 && minYearly.amount !== maxYearly?.amount) {
            summary += `📉 Least in a yr: ~${formatNum(Math.round(minYearly.amount / 100) * 100)} mi (${minYearly.year})\n`;
        }
    }

    // Tampering Detection (Clocking)
    let anomaly = null;
    let maxMileageSoFar = 0;
    let maxTest = null;
    
    for (const test of validTests) {
        if (maxTest && test.normalizedMiles < maxMileageSoFar - 1000) { 
            anomaly = { from: maxTest, to: test };
            break; 
        }
        if (test.normalizedMiles > maxMileageSoFar) {
            maxMileageSoFar = test.normalizedMiles;
            maxTest = test;
        }
    }

    if (anomaly) {
        summary += `\n⚠️ Anomaly Detected: Mileage decreased from ${formatNum(anomaly.from.value)} ${anomaly.from.unit} (${anomaly.from.date.getFullYear()}) to ${formatNum(anomaly.to.value)} ${anomaly.to.unit} (${anomaly.to.date.getFullYear()})`;
    }

    // Generate QuickChart URL
    // Map dates and values, deduplicating years if there are multiple tests in one year
    const chartLabels = [];
    const chartData = [];
    let lastYear = null;
    
    if (manufactureYear && validTests.length > 0) {
        const oldestTestYear = validTests[0].date.getFullYear();
        if (manufactureYear < oldestTestYear) {
            chartLabels.push(manufactureYear.toString());
            chartData.push(0);
            lastYear = manufactureYear.toString();
        }
    }
    
    for (const test of validTests) {
        const year = test.date.getFullYear().toString();
        // If multiple tests in one year, overwrite the previous dot to show the latest for that year
        if (year === lastYear) {
            chartData[chartData.length - 1] = test.normalizedMiles;
        } else {
            chartLabels.push(year);
            chartData.push(test.normalizedMiles);
            lastYear = year;
        }
    }

    const chartConfig = {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Mileage',
                data: chartData,
                borderColor: 'rgb(88, 101, 242)', // Discord Blurple
                backgroundColor: 'rgba(88, 101, 242, 0.2)',
                fill: true,
                borderWidth: 3,
                pointBackgroundColor: 'rgb(255, 255, 255)',
                pointRadius: 4
            }]
        },
        options: {
            legend: { display: false },
            title: { display: true, text: 'Mileage History (Miles)', fontColor: 'rgb(255, 255, 255)', fontSize: 16 },
            scales: {
                yAxes: [{ gridLines: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { fontColor: 'rgba(255, 255, 255, 0.7)', beginAtZero: true } }],
                xAxes: [{ gridLines: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { fontColor: 'rgba(255, 255, 255, 0.7)' } }]
            }
        }
    };

    const mileageGraphUrl = `https://quickchart.io/chart?bkg=rgb(43,45,49)&w=600&h=300&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;

    return { 
        mileageSummary: summary.trim(),
        currentMileage: currentMileageString,
        mileageGraphUrl
    };
}
