const { processMotDefects } = require('../../helpers/mot');

describe('processMotDefects', () => {
	test('should handle undefined and null inputs', () => {
		const motTests = [];
		result = processMotDefects(motTests);
		expect(result).toStrictEqual({ motDefectsSummary: '❔ No MOT history' });
	});

	test('should detect if vehicle has had no major, dangerous or PRS defects', () => {
		const motTests = [
			{
				registrationAtTimeOfTest: null,
				motTestNumber: '364439172537',
				completedDate: '2024-11-20T15:06:51.000Z',
				expiryDate: '2025-11-23',
				odometerValue: '86928',
				odometerUnit: 'MI',
				odometerResultType: 'READ',
				testResult: 'PASSED',
				dataSource: 'DVSA',
				defects: [],
			},
			{
				registrationAtTimeOfTest: null,
				motTestNumber: '475664603188',
				completedDate: '2023-11-22T10:44:10.000Z',
				expiryDate: '2024-11-23',
				odometerValue: '75557',
				odometerUnit: 'MI',
				odometerResultType: 'READ',
				testResult: 'PASSED',
				dataSource: 'DVSA',
				defects: [],
			},
			{
				registrationAtTimeOfTest: null,
				motTestNumber: '529390644903',
				completedDate: '2022-11-21T15:26:08.000Z',
				expiryDate: '2023-11-23',
				odometerValue: '74355',
				odometerUnit: 'MI',
				odometerResultType: 'READ',
				testResult: 'PASSED',
				dataSource: 'DVSA',
				defects: [],
			},
		];
		const result = processMotDefects(motTests);
		expect(result).toStrictEqual({ motDefectsSummary: '✅ No MOT fails' });
	});

	test('should return other for unmatched categories', () => {
		const motTests = [
			{
				completedDate: '2025-11-21T15:26:08.000Z',
				defects: [
					{
						dangerous: false,
						text: 'Manually typed uncategorised advisory',
						type: 'MAJOR',
					},
				],
			},
		];
		const result = processMotDefects(motTests);
		expect(result.motDefectsSummary).toStrictEqual(`2025 - 1x Other\n`);
	});

	test('should ignore minor and advisory defects', () => {
		const motTests = [
			{
				completedDate: '2024-11-20T15:06:51.000Z',
				defects: [],
			},
			{
				completedDate: '2023-11-22T10:44:10.000Z',
				defects: [
					{
						dangerous: false,
						text: 'Nearside Front Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii))',
						type: 'ADVISORY',
					},
					{
						dangerous: false,
						text: 'Offside Front Tyre slightly damaged/cracking or perishing (5.2.3 (d) (ii))',
						type: 'ADVISORY',
					},
					{
						dangerous: false,
						text: 'Front Both coil springs have corrosion',
						type: 'ADVISORY',
					},
					{
						dangerous: false,
						text: 'Nearside Rear Brake pipe corroded, covered in grease or other material (1.1.11 (c))',
						type: 'ADVISORY',
					},
					{
						dangerous: false,
						text: 'Offside Rear Brake pipe corroded, covered in grease or other material (1.1.11 (c))',
						type: 'ADVISORY',
					},
				],
			},
			{
				completedDate: '2022-11-21T15:26:08.000Z',
				defects: [
					{
						dangerous: false,
						text: 'Front Coil spring corroded  BOTH (5.3.1 (b) (i))',
						type: 'ADVISORY',
					},
					{
						dangerous: false,
						text: "Windscreen damaged but not adversely affecting driver's view Chips centre and nearside (3.2 (a) (i))",
						type: 'MINOR',
					},
				],
			},
		];
		const result = processMotDefects(motTests);
		expect(result).toStrictEqual({ motDefectsSummary: '✅ No MOT fails' });
	});

	test('should output a summary if vehicle has failed an MOT', () => {
		const motTests = [
			{
				completedDate: '2025-11-21T15:26:08.000Z',
				defects: [
					{
						dangerous: false,
						text: 'Nearside Rear Suspension arm pin or bush excessively worn (5.3.4 (a) (i))',
						type: 'MAJOR',
					},
					{
						dangerous: false,
						text: 'Offside Rear Suspension arm pin or bush excessively worn (5.3.4 (a) (i))',
						type: 'MAJOR',
					},
					{
						dangerous: false,
						text: 'Nearside Rear Registration plate lamp inoperative in the case of multiple lamps or light sources (4.7.1 (b) (i))',
						type: 'MINOR',
					},
					{
						dangerous: false,
						text: 'Offside Front Position lamp not working (4.2.1 (a) (ii))',
						type: 'MAJOR',
					},
					{
						dangerous: false,
						text: 'Front Inner Brake disc worn, but not excessively (1.1.14 (a) (i))',
						type: 'ADVISORY',
					},
					{
						dangerous: false,
						text: 'Nearside Rear Inner Brake pad(s) wearing thin (1.1.13 (a) (ii))',
						type: 'ADVISORY',
					},
				],
			},
		];
		const result = processMotDefects(motTests);
		expect(result).toStrictEqual({
			motDefectsSummary: `2025 - 2x Axles, wheels, tyres and suspension, 1x Lamps, reflectors and electrical equipment\n`,
		});
	});

	test('test all defect categories', () => {
		const motTests = [
			{
				completedDate: '2025-06-01T12:00:00.000Z',
				defects: [
					{
						dangerous: true,
						text: 'Number plate missing or so insecure that it is likely to fall off	(0.1 (a))',
						type: 'MAJOR',
					},
					{
						dangerous: true,
						text: 'Significant brake effort recorded with no brake applied indicating a binding brake	(1.2.1 (f))',
						type: 'DANGEROUS',
					},
				],
			},
			{
				completedDate: '2024-06-01T12:00:00.000Z',
				defects: [
					{
						dangerous: true,
						text: 'Free play in the steering, measured at the rim of the steering wheel is excessive	(2.3 (a)(i))',
						type: 'MAJOR',
					},
					{
						dangerous: true,
						text: 'Wiper not operating or missing	(3.4 (a))',
						type: 'MAJOR',
					},
				],
			},
			{
				completedDate: '2023-06-01T12:00:00.000Z',
				defects: [
					{
						dangerous: false,
						text: 'Nearside Rear Suspension arm pin or bush excessively worn (5.3.4 (a) (i))',
						type: 'MAJOR',
					},
					{
						dangerous: true,
						text: 'Body has an unsafe modification	(6.2.1 (d)(i))',
						type: 'MAJOR',
					},
				],
			},
			{
				completedDate: '2019-06-01T12:00:00.000Z',
				defects: [
					{
						dangerous: true,
						text: 'A statutory seat belt missing	(7.1.1 (a))',
						type: 'MAJOR',
					},
					{
						dangerous: true,
						text: 'Exhaust noise levels in excess of those permitted	(8.1.1  (a))',
						type: 'MAJOR',
					},
				],
			},
			{
				completedDate: '2017-06-01T12:00:00.000Z',
				defects: [
					{
						dangerous: true,
						text: 'An emergency exit defective in operation	(9.1.2 (a))',
						type: 'MAJOR',
					},
					{
						dangerous: true,
						text: 'An anchorage insecure	(10.2 (d))',
						type: 'MAJOR',
					},
				],
			},
		];
		const result = processMotDefects(motTests);
		expect(result.motDefectsSummary).toBe(
			`2025 - 1x Identification of the vehicle, 1x Brakes\n2024 - 1x Steering, 1x Visibility\n2023 - 1x Axles, wheels, tyres and suspension, 1x Body, structure and attachments\n`,
		);
	});
});
