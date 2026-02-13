const { createImportStatus } = require('/helpers/formatting/createImportStatus');

describe('createImportStatus', () => {
	test('should detect an imported vehicle', () => {
		const vehicle = {
			taxStatus: 'SORN',
			motStatus: 'Valid',
			make: 'BMW',
			yearOfManufacture: 2009,
			engineCapacity: 3000,
			co2Emissions: 0,
			fuelType: 'PETROL',
			markedForExport: false,
			colour: 'WHITE',
			dateOfLastV5CIssued: '2025-09-29',
			motExpiryDate: '2026-09-09',
			wheelplan: '2 AXLE RIGID BODY',
			monthOfFirstRegistration: '2009-09',
			monthOfFirstDvlaRegistration: '2025-10',
		};
		const result = createImportStatus(vehicle);
		expect(result).toStrictEqual({ isImported: `**Imported vehicle**\n` });
		expect(result.isImported).toBe('**Imported vehicle**\n');
	});

	test('should return empty for a domestic vehicle', () => {
		const vehicle = {
			taxStatus: 'Taxed',
			taxDueDate: '2026-08-01',
			motStatus: 'Valid',
			make: 'FORD',
			yearOfManufacture: 2012,
			engineCapacity: 1997,
			co2Emissions: 149,
			fuelType: 'DIESEL',
			markedForExport: false,
			colour: 'BLACK',
			typeApproval: 'M1',
			revenueWeight: 2505,
			dateOfLastV5CIssued: '2020-03-13',
			motExpiryDate: '2026-02-27',
			wheelplan: '2 AXLE RIGID BODY',
			monthOfFirstRegistration: '2012-04',
		};
		const result = createImportStatus(vehicle);
		expect(result).toStrictEqual({ isImported: `` });
		expect(result.isImported).toBe('');
	});

	test('should return empty if input is empty', () => {
		const vehicle = {};
		const result = createImportStatus(vehicle);
		expect(result).toStrictEqual({ isImported: `` });
		expect(result.isImported).toBe('');
	});
});