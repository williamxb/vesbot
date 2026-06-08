import { jest } from '@jest/globals';
import { createTaxStatus  } from '#helpers/formatting/createTaxStatus.js';


describe('createTaxStatus', () => {
  beforeEach(() => {
    // Mock system time
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-10-17T12:00:00.000Z'));
  });

  describe('should handle missing inputs', () => {
    test('should handle missing input', () => {
      const ves = {};
      const result = createTaxStatus(ves);
      expect(result).toStrictEqual({
        taxStatus: 'Status is unavailable',
        taxTitle: 'Tax status unknown',
      });
    });

    test('should handle missing taxStatus', () => {
      const ves = {
        // taxStatus: 'Valid', test missing taxStatus
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
        taxStatus: 'Status is unavailable',
        taxTitle: 'Tax status unknown',
      });
    });

    test('should handle missing taxDueDate', () => {
      const ves = {
        taxStatus: 'Valid',
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
        taxStatus: 'Could not determine expiry',
        taxTitle: '✅ Tax valid',
      });
    });
  });

  test('should handle vehicles on SORN', () => {
    const ves = {
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
      taxStatus: "Vehicle is off the road",
      taxTitle: "⚠️ SORN",
    });
  });

  test('should handle taxed vehicles', () => {
    const ves = {
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
      taxStatus: 'Expires in about 1 year',
      taxTitle: '✅ Tax valid',
    });
  });

  test('should handle untaxed vehicles', () => {
    const ves = {
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
      taxStatus: 'Expired 4 days ago',
      taxTitle: '❌ Tax expired',
    });
  });

  test('should handle vehicle with tax expiring today', () => {
    const ves = {
      taxStatus: 'Valid',
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
      taxStatus: 'Expires today',
      taxTitle: '✅ Tax valid',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });
});