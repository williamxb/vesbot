import { jest } from '@jest/globals';
import { createMileageStats } from '#helpers/formatting/createMileageStats.js';

describe('createMileageStats', () => {
    beforeAll(() => {
        global.fetch = jest.fn(() => Promise.reject(new Error('Network disabled in test')));
    });

    test('returns empty if no tests', async () => {
        expect(await createMileageStats([])).toStrictEqual({ mileageSummary: '', currentMileage: 'Unknown', mileageGraphUrl: null });
        expect(await createMileageStats(null)).toStrictEqual({ mileageSummary: '', currentMileage: 'Unknown', mileageGraphUrl: null });
    });

    test('returns empty if no valid odometer readings', async () => {
        const tests = [{ completedDate: '2022-01-01', odometerValue: null }];
        expect(await createMileageStats(tests)).toStrictEqual({ mileageSummary: '', currentMileage: 'Unknown', mileageGraphUrl: null });
    });

    test('calculates current, average, most and least correctly for standard miles', async () => {
        const tests = [
            { completedDate: '2022-01-01T10:00:00Z', odometerValue: '100000', odometerUnit: 'MI' },
            { completedDate: '2023-01-01T10:00:00Z', odometerValue: '110000', odometerUnit: 'MI' }, // gap: 10k
            { completedDate: '2024-01-01T10:00:00Z', odometerValue: '112000', odometerUnit: 'MI' }, // gap: 2k
            { completedDate: '2025-01-01T10:00:00Z', odometerValue: '127000', odometerUnit: 'MI' }  // gap: 15k
        ];

        const result = await createMileageStats(tests);
        expect(result.currentMileage).toBe('127,000 mi');
        expect(result.mileageSummary).toContain(`- Last known: 127,000 mi`);
        expect(result.mileageSummary).toContain(`- Average: ~9,000 mi/yr`);
        expect(result.mileageSummary).toContain(`- Most in a year: ~15,000 mi (2025)`);
        expect(result.mileageSummary).toContain(`- Least in a year: ~2,000 mi (2024)`);
        expect(result.mileageGraphUrl).toContain('quickchart.io');
    });

    test('detects blatant tampering anomaly', async () => {
        const tests = [
            { completedDate: '2022-01-01T10:00:00Z', odometerValue: '100000', odometerUnit: 'MI' },
            { completedDate: '2023-01-01T10:00:00Z', odometerValue: '60000', odometerUnit: 'MI' }, // Clocked
            { completedDate: '2024-01-01T10:00:00Z', odometerValue: '70000', odometerUnit: 'MI' },
        ];

        const result = await createMileageStats(tests);
        expect(result.mileageSummary).toContain(`- Last known: 70,000 mi`);
        expect(result.mileageSummary).toContain(`- ⚠️ Warning: Mileage appears to have been tampered. Mileage decreased from 100,000 mi (2022) to 60,000 mi (2023)`);
    });

    test('ignores small typos within buffer', async () => {
        const tests = [
            { completedDate: '2022-01-01T10:00:00Z', odometerValue: '100000', odometerUnit: 'MI' },
            { completedDate: '2023-01-01T10:00:00Z', odometerValue: '99500', odometerUnit: 'MI' }, // 500 mile typo, ignored
        ];

        const result = await createMileageStats(tests);
        expect(result.mileageSummary).not.toContain(`⚠️ Warning`);
    });

    test('handles KM to MI conversion without falsely flagging anomalies', async () => {
        const tests = [
            { completedDate: '2022-01-01T10:00:00Z', odometerValue: '160000', odometerUnit: 'KM' }, // ~99,419 mi
            { completedDate: '2023-01-01T10:00:00Z', odometerValue: '100000', odometerUnit: 'MI' }, // Number is smaller, but actual distance is larger!
        ];

        const result = await createMileageStats(tests);
        expect(result.mileageSummary).not.toContain(`⚠️ Warning`);
        expect(result.mileageSummary).toContain(`- Last known: 100,000 mi`);
    });

    test('handles real anomaly even with mixed units', async () => {
        const tests = [
            { completedDate: '2022-01-01T10:00:00Z', odometerValue: '100000', odometerUnit: 'MI' },
            { completedDate: '2023-01-01T10:00:00Z', odometerValue: '100000', odometerUnit: 'KM' }, // ~62,137 miles
        ];

        const result = await createMileageStats(tests);
        expect(result.mileageSummary).toContain(`- ⚠️ Warning: Mileage appears to have been tampered. Mileage decreased from 100,000 mi (2022) to 100,000 km (2023)`);
    });

    describe('mileage extrapolation for first 3 years of life', () => {
        test('extrapolates to year of manufacture at 0 mileage when prior to first MOT with dual-dataset structure', async () => {
            const tests = [
                { completedDate: '2021-01-01T10:00:00Z', odometerValue: '25000', odometerUnit: 'MI' },
                { completedDate: '2022-01-01T10:00:00Z', odometerValue: '35000', odometerUnit: 'MI' }
            ];
            const result = await createMileageStats(tests, 2018);
            expect(result.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify(['2018', '2019', '2020', '2021', '2022'])));
            expect(result.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify([0, 8333, 16667, 25000, null])));
            expect(result.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify([null, null, null, 25000, 35000])));
        });

        test('handles full date string or string year representation with correct dual-dataset parsing', async () => {
            const tests = [
                { completedDate: '2021-01-01T10:00:00Z', odometerValue: '25000', odometerUnit: 'MI' }
            ];

            const resultDateStr = await createMileageStats(tests, '2018-05-12');
            expect(resultDateStr.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify(['2018', '2019', '2020', '2021'])));
            expect(resultDateStr.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify([0, 8333, 16667, 25000])));
            expect(resultDateStr.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify([null, null, null, 25000])));

            const resultYearStr = await createMileageStats(tests, '2018');
            expect(resultYearStr.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify(['2018', '2019', '2020', '2021'])));
            expect(resultYearStr.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify([0, 8333, 16667, 25000])));
            expect(resultYearStr.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify([null, null, null, 25000])));
        });

        test('does not extrapolate if manufacture year is equal to or after first MOT', async () => {
            const tests = [
                { completedDate: '2021-01-01T10:00:00Z', odometerValue: '25000', odometerUnit: 'MI' }
            ];
            const resultSame = await createMileageStats(tests, 2021);
            expect(resultSame.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify(['2021'])));
            expect(resultSame.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify([25000])));

            const resultAfter = await createMileageStats(tests, 2022);
            expect(resultAfter.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify(['2021'])));
            expect(resultAfter.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify([25000])));
        });

        test('does not extrapolate if manufacture year is invalid or not provided', async () => {
            const tests = [
                { completedDate: '2021-01-01T10:00:00Z', odometerValue: '25000', odometerUnit: 'MI' }
            ];
            const resultNull = await createMileageStats(tests, null);
            expect(resultNull.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify(['2021'])));
            expect(resultNull.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify([25000])));

            const resultInvalid = await createMileageStats(tests, 'not-a-year');
            expect(resultInvalid.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify(['2021'])));
            expect(resultInvalid.mileageGraphUrl).toContain(encodeURIComponent(JSON.stringify([25000])));
        });
    });
});
