const { createMotStatus } = require('../../../helpers/formatting/createMotStatus');


describe('createMotStatus', () => {
  beforeEach(() => {
    // Mock system time
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-10-17T12:00:00.000Z'));
  });

  describe('should handle missing inputs', () => {
    test('should handle missing input', () => {
      ves = {};
      const result = createMotStatus(ves);
      expect(result).toStrictEqual({
        motDue: 'Unknown',
        motStatus: 'Unknown',
      });
    });

    test('should handle missing motStatus', () => {
      ves = {
        taxStatus: 'Taxed',
        taxDueDate: '2026-11-01',
        // motStatus: 'Valid', test missing motStatus
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
      const result = createMotStatus(ves);
      expect(result).toStrictEqual({
        motDue: 'Unknown',
        motStatus: 'Unknown',
      });
    });

    test('should handle missing motExpiryDate', () => {
      ves = {
        taxStatus: 'Taxed',
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
        // motExpiryDate: '2025-12-26', test missing motExpiryDate
        wheelplan: '2 AXLE RIGID BODY',
        monthOfFirstRegistration: '2013-03',
      };
      const result = createMotStatus(ves);
      expect(result).toStrictEqual({
        motDue: 'Unknown',
        motStatus: 'Valid',
      });
    });
  });

  test('should handle vehicles with current MOT', () => {
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
    const result = createMotStatus(ves);
    expect(result).toStrictEqual({
      motDue: 'Expires in 2 months',
      motStatus: 'Valid',
    });
  });

  test('should handle vehicles MOT expiring today', () => {
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
      motExpiryDate: '2025-10-17',
      wheelplan: '2 AXLE RIGID BODY',
      monthOfFirstRegistration: '2013-03',
    };
    const result = createMotStatus(ves);
    expect(result).toStrictEqual({
      motDue: 'Expires today',
      motStatus: 'Valid',
    });
  });

  test('should handle vehicles with expired MOT', () => {
    ves = {
      taxStatus: 'Untaxed',
      taxDueDate: '2025-10-13',
      motStatus: 'Not valid',
      make: 'MINI',
      yearOfManufacture: 2014,
      engineCapacity: 1499,
      co2Emissions: 105,
      fuelType: 'PETROL',
      markedForExport: false,
      colour: 'ORANGE',
      typeApproval: 'M1',
      dateOfLastV5CIssued: '2025-10-13',
      motExpiryDate: '2024-11-23',
      wheelplan: '2 AXLE RIGID BODY',
      monthOfFirstRegistration: '2014-09',
    };
    const result = createMotStatus(ves);
    expect(result).toStrictEqual({
      motDue: 'Expired 11 months ago',
      motStatus: 'Not valid',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });
});