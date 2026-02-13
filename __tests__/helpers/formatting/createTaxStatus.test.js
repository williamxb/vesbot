const { createTaxStatus } = require('/helpers/formatting/createTaxStatus');


describe('createTaxStatus', () => {
  beforeEach(() => {
    // Mock system time
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-10-17T12:00:00.000Z'));
  });

  describe('should handle missing inputs', () => {
    test('should handle missing input', () => {
      ves = {};
      const result = createTaxStatus(ves);
      expect(result).toStrictEqual({
        taxDue: 'Unknown',
        taxStatus: 'Unknown',
      });
    });

    test('should handle missing taxStatus', () => {
      ves = {
        // taxStatus: 'Taxed', test missing taxStatus
        taxDueDate: '2026-11-01',
        motStatus: 'Valid',
        make: 'BMW',
        yearOfManufacture: 2013,
        engineCapacity: 2993,
        co2Emissions: 164,
        fuelType: 'DIESEL',
        markedForExport: false,
        colour: 'WHITE',
        typeApproval: 'M1',
        dateOfLastV5CIssued: '2024-11-01',
        motExpiryDate: '2025-12-26',
        wheelplan: '2 AXLE RIGID BODY',
        monthOfFirstRegistration: '2013-03',
      };
      const result = createTaxStatus(ves);
      expect(result).toStrictEqual({
        taxDue: 'Unknown',
        taxStatus: 'Unknown',
      });
    });

    test('should handle missing taxDueDate', () => {
      ves = {
        taxStatus: 'Taxed',
        // taxDueDate: '2026-11-01', test missing taxDueDate
        motStatus: 'Valid',
        make: 'BMW',
        yearOfManufacture: 2013,
        engineCapacity: 2993,
        co2Emissions: 164,
        fuelType: 'DIESEL',
        markedForExport: false,
        colour: 'WHITE',
        typeApproval: 'M1',
        dateOfLastV5CIssued: '2024-11-01',
        motExpiryDate: '2025-12-26',
        wheelplan: '2 AXLE RIGID BODY',
        monthOfFirstRegistration: '2013-03',
      };
      const result = createTaxStatus(ves);
      expect(result).toStrictEqual({
        taxDue: 'Unknown',
        taxStatus: 'Taxed',
      });
    });
  });

  test('should handle vehicles on SORN', () => {
    ves = {
      taxStatus: 'SORN',
      taxDueDate: '2026-11-01',
      motStatus: 'Valid',
      make: 'BMW',
      yearOfManufacture: 2013,
      engineCapacity: 2993,
      co2Emissions: 164,
      fuelType: 'DIESEL',
      markedForExport: false,
      colour: 'WHITE',
      typeApproval: 'M1',
      dateOfLastV5CIssued: '2024-11-01',
      motExpiryDate: '2025-12-26',
      wheelplan: '2 AXLE RIGID BODY',
      monthOfFirstRegistration: '2013-03',
    };
    const result = createTaxStatus(ves);
    expect(result).toStrictEqual({
      taxDue: 'N/A',
      taxStatus: 'SORN',
    });
  });

  test('should handle taxed vehicles', () => {
    ves = {
      taxStatus: 'Valid',
      taxDueDate: '2026-11-01',
      motStatus: 'Valid',
      make: 'BMW',
      yearOfManufacture: 2013,
      engineCapacity: 2993,
      co2Emissions: 164,
      fuelType: 'DIESEL',
      markedForExport: false,
      colour: 'WHITE',
      typeApproval: 'M1',
      dateOfLastV5CIssued: '2024-11-01',
      motExpiryDate: '2025-12-26',
      wheelplan: '2 AXLE RIGID BODY',
      monthOfFirstRegistration: '2013-03',
    };
    const result = createTaxStatus(ves);
    expect(result).toStrictEqual({
      taxDue: 'Expires in about 1 year',
      taxStatus: 'Valid',
    });
  });

  test('should handle untaxed vehicles', () => {
    ves = {
      taxStatus: 'Untaxed',
      taxDueDate: '2025-10-13',
      motStatus: 'Valid',
      make: 'MINI',
      yearOfManufacture: 2014,
      engineCapacity: 1499,
      co2Emissions: 105,
      fuelType: 'PETROL',
      markedForExport: false,
      colour: 'ORANGE',
      typeApproval: 'M1',
      dateOfLastV5CIssued: '2025-10-13',
      motExpiryDate: '2025-11-23',
      wheelplan: '2 AXLE RIGID BODY',
      monthOfFirstRegistration: '2014-09',
    };
    const result = createTaxStatus(ves);
    expect(result).toStrictEqual({
      taxDue: 'Expired 4 days ago',
      taxStatus: 'Untaxed',
    });
  });

  test('should handle vehicle with tax expiring today', () => {
    ves = {
      taxStatus: 'Taxed',
      taxDueDate: '2025-10-17',
      motStatus: 'Valid',
      make: 'MINI',
      yearOfManufacture: 2014,
      engineCapacity: 1499,
      co2Emissions: 105,
      fuelType: 'PETROL',
      markedForExport: false,
      colour: 'ORANGE',
      typeApproval: 'M1',
      dateOfLastV5CIssued: '2025-10-13',
      motExpiryDate: '2025-11-23',
      wheelplan: '2 AXLE RIGID BODY',
      monthOfFirstRegistration: '2014-09',
    };
    const result = createTaxStatus(ves);
    expect(result).toStrictEqual({
      taxDue: 'Expires today',
      taxStatus: 'Taxed',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });
});