import { createMileageStats } from '#helpers/formatting/createMileageStats.js';

describe('createMileageStats', () => {
    test('returns empty if no tests', () => {
        expect(createMileageStats([])).toStrictEqual({ mileageSummary: '', currentMileage: 'Unknown', mileageGraphUrl: null });
        expect(createMileageStats(null)).toStrictEqual({ mileageSummary: '', currentMileage: 'Unknown', mileageGraphUrl: null });
    });

    test('returns empty if no valid odometer readings', () => {
        const tests = [{ completedDate: '2022-01-01', odometerValue: null }];
        expect(createMileageStats(tests)).toStrictEqual({ mileageSummary: '', currentMileage: 'Unknown', mileageGraphUrl: null });
    });

    test('calculates current, average, most and least correctly for standard miles', () => {
        const tests = [
            { completedDate: '2022-01-01T10:00:00Z', odometerValue: '100000', odometerUnit: 'MI' },
            { completedDate: '2023-01-01T10:00:00Z', odometerValue: '110000', odometerUnit: 'MI' }, // gap: 10k
            { completedDate: '2024-01-01T10:00:00Z', odometerValue: '112000', odometerUnit: 'MI' }, // gap: 2k
            { completedDate: '2025-01-01T10:00:00Z', odometerValue: '127000', odometerUnit: 'MI' }  // gap: 15k
        ];
        
        const result = createMileageStats(tests);
        expect(result.currentMileage).toBe('127,000 mi');
        expect(result.mileageSummary).toContain(`🏎️ Current: 127,000 mi`);
        expect(result.mileageSummary).toContain(`📊 Average: ~9,000 mi/yr`);
        expect(result.mileageSummary).toContain(`📈 Most in a yr: ~15,000 mi (2025)`);
        expect(result.mileageSummary).toContain(`📉 Least in a yr: ~2,000 mi (2024)`);
        expect(result.mileageGraphUrl).toContain('quickchart.io');
    });

    test('detects blatant tampering anomaly', () => {
        const tests = [
            { completedDate: '2022-01-01T10:00:00Z', odometerValue: '100000', odometerUnit: 'MI' }, 
            { completedDate: '2023-01-01T10:00:00Z', odometerValue: '60000', odometerUnit: 'MI' }, // Clocked
            { completedDate: '2024-01-01T10:00:00Z', odometerValue: '70000', odometerUnit: 'MI' },
        ];
        
        const result = createMileageStats(tests);
        expect(result.mileageSummary).toContain(`🏎️ Current: 70,000 mi`);
        expect(result.mileageSummary).toContain(`⚠️ Anomaly Detected: Mileage decreased from 100,000 mi (2022) to 60,000 mi (2023)`);
    });

    test('ignores small typos within buffer', () => {
        const tests = [
            { completedDate: '2022-01-01T10:00:00Z', odometerValue: '100000', odometerUnit: 'MI' }, 
            { completedDate: '2023-01-01T10:00:00Z', odometerValue: '99500', odometerUnit: 'MI' }, // 500 mile typo, ignored
        ];
        
        const result = createMileageStats(tests);
        expect(result.mileageSummary).not.toContain(`⚠️ Anomaly Detected`);
    });

    test('handles KM to MI conversion without falsely flagging anomalies', () => {
        const tests = [
            { completedDate: '2022-01-01T10:00:00Z', odometerValue: '160000', odometerUnit: 'KM' }, // ~99,419 mi
            { completedDate: '2023-01-01T10:00:00Z', odometerValue: '100000', odometerUnit: 'MI' }, // Number is smaller, but actual distance is larger!
        ];
        
        const result = createMileageStats(tests);
        expect(result.mileageSummary).not.toContain(`⚠️ Anomaly Detected`);
        expect(result.mileageSummary).toContain(`🏎️ Current: 100,000 mi`);
    });

    test('handles real anomaly even with mixed units', () => {
        const tests = [
            { completedDate: '2022-01-01T10:00:00Z', odometerValue: '100000', odometerUnit: 'MI' }, 
            { completedDate: '2023-01-01T10:00:00Z', odometerValue: '100000', odometerUnit: 'KM' }, // ~62,137 miles, this IS a decrease!
        ];
        
        const result = createMileageStats(tests);
        expect(result.mileageSummary).toContain(`⚠️ Anomaly Detected: Mileage decreased from 100,000 mi (2022) to 100,000 km (2023)`);
    });
});
