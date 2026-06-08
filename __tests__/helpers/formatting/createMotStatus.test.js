import { jest } from '@jest/globals';
import { createMotStatus } from '#helpers/formatting/createMotStatus.js';

describe('createMotStatus', () => {
  beforeEach(() => {
    // Mock system time
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-10-17T12:00:00.000Z'));
  });

  describe('should handle missing inputs', () => {
    test('should handle missing input', () => {
      const ves = {};
      const result = createMotStatus(ves);
      expect(result).toStrictEqual({
        motStatus: 'Could not determine expiry',
        motTitle: '❔ MOT Status Unknown',
      });
    });

    test('should handle missing motStatus', () => {
      const ves = {
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
        motStatus: 'Expires in 2 months',
        motTitle: '❔ MOT Status Unknown',
      });
    });

    test('should handle missing motExpiryDate', () => {
      const ves = {
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
        motStatus: 'Could not determine expiry',
        motTitle: '✅ MOT Valid'
      });
    });
  });

  test('should handle vehicles with current MOT', () => {
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
    const result = createMotStatus(ves);
    expect(result).toStrictEqual({
      motStatus: 'Expires in 2 months',
      motTitle: '✅ MOT Valid',
    });
  });

  test('should handle vehicles MOT expiring today', () => {
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
      motExpiryDate: '2025-10-17',
      wheelplan: '2 AXLE RIGID BODY',
      monthOfFirstRegistration: '2013-03',
    };
    const result = createMotStatus(ves);
    expect(result).toStrictEqual({
      motStatus: 'Expires today',
      motTitle: '✅ MOT Valid',
    });
  });

  test('should handle vehicles with expired MOT', () => {
    const ves = {
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
      motStatus: 'Expired 11 months ago',
      motTitle: '❌ MOT Expired',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });
});