const { calculateColour, createVehicleStatus, detectImportedVehicle, createTaxCost, createTaxStatus, createMotStatus } = require('../../helpers/formatting');

describe('calculateColour', () => {
  test('should return emoji for known colours', () => {
    expect(calculateColour('WHITE')).toBe('⚪️');
    expect(calculateColour('BLACK')).toBe('⚫️');
    expect(calculateColour('RED')).toBe('🔴');
    expect(calculateColour('BLUE')).toBe('🔵');
    expect(calculateColour('BROWN')).toBe('🟤');
    expect(calculateColour('ORANGE')).toBe('🟠');
    expect(calculateColour('GREEN')).toBe('🟢');
    expect(calculateColour('YELLOW')).toBe('🟡');
    expect(calculateColour('PURPLE')).toBe('🟣');
  });

  test('should return original input if unknown', () => {
    expect(calculateColour('MULTIPLE')).toBe('MULTIPLE');
    expect(calculateColour('PINK')).toBe('PINK');
  });

  test('should handle undefined and null input', () => {
    expect(calculateColour('')).toBe('');
    expect(calculateColour(null)).toBe(null);
    expect(calculateColour(undefined)).toBe(undefined);
  });
});

describe('createVehicleStatus', () => {
  test('should return clean status', () => {
    const vehicle = {
      scrapped: false,
      stolen: false,
      writeOffCategory: 'none',
    };
    const result = createVehicleStatus(vehicle);
    expect(result.vehicleStatus).toBe('Clean ✨');
    expect(result.embedColour).toBe(0x00b67a);
  });

  test('should return scrapped status', () => {
    const vehicle = {
      scrapped: true,
      stolen: false,
      writeOffCategory: 'none',
    };
    const result = createVehicleStatus(vehicle);
    expect(result.vehicleStatus).toBe('**Scrapped**');
    expect(result.embedColour).toBe(0xb11212);
  });

  test('should return stolen status', () => {
    const vehicle = {
      scrapped: false,
      stolen: true,
      writeOffCategory: 'none',
    };
    const result = createVehicleStatus(vehicle);
    expect(result.vehicleStatus).toBe('**Stolen**');
    expect(result.embedColour).toBe(0xb11212);
  });

  test('should return write off status', () => {
    const vehicle = {
      scrapped: false,
      stolen: false,
      writeOffCategory: 'S',
    };
    const result = createVehicleStatus(vehicle);
    expect(result.vehicleStatus).toBe('**Write-off - CAT S**');
    expect(result.embedColour).toBe(0xb11212);
  });

  describe('should handle combinations', () => {
    test('scrapped + write off', () => {
      const vehicle = {
        scrapped: true,
        stolen: false,
        writeOffCategory: 'B',
      };
      const result = createVehicleStatus(vehicle);
      expect(result.vehicleStatus).toBe('**Scrapped**, **Write-off - CAT B**');
      expect(result.embedColour).toBe(0xb11212);
    });

    test('scrapped + stolen', () => {
      const vehicle = {
        scrapped: true,
        stolen: true,
        writeOffCategory: 'none',
      };
      const result = createVehicleStatus(vehicle);
      expect(result.vehicleStatus).toBe('**Stolen**, **Scrapped**');
      expect(result.embedColour).toBe(0xb11212);
    });

    test('stolen + write off', () => {
      const vehicle = {
        scrapped: false,
        stolen: true,
        writeOffCategory: 'N',
      };
      const result = createVehicleStatus(vehicle);
      expect(result.vehicleStatus).toBe('**Stolen**, **Write-off - CAT N**');
      expect(result.embedColour).toBe(0xb11212);
    });

    test('scrapped + stolen + write off', () => {
      const vehicle = {
        scrapped: true,
        stolen: true,
        writeOffCategory: 'A',
      };
      const result = createVehicleStatus(vehicle);
      expect(result.vehicleStatus).toBe('**Stolen**, **Scrapped**, **Write-off - CAT A**');
      expect(result.embedColour).toBe(0xb11212);
    });
  });
});

describe('detectImportedVehicle', () => {
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
    const result = detectImportedVehicle(vehicle);
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
    const result = detectImportedVehicle(vehicle);
    expect(result).toStrictEqual({ isImported: `` });
    expect(result.isImported).toBe('');
  });

  test('should return empty if input is empty', () => {
    const vehicle = {};
    const result = detectImportedVehicle(vehicle);
    expect(result).toStrictEqual({ isImported: `` });
    expect(result.isImported).toBe('');
  });
});

describe('createTaxCost', () => {
  test('should return unknown if tax status unavailable', () => {
    const ves = {},
      mot = {};
    const result = createTaxCost(ves, mot);
    expect(result).toStrictEqual({ taxCost: 'Unknown' });
  });

  test('should return unknown if date of registration is unavailable', () => {
    const ves = {
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
      // monthOfFirstRegistration: '2012-04', test for missing monthOfFirstRegistration
    };
    const mot = {
      registration: 'FE12YMX',
      make: 'FORD',
      model: 'GALAXY',
      firstUsedDate: '2012-04-03',
      fuelType: 'Diesel',
      primaryColour: 'Black',
      // registrationDate: '2012-04-03', test for missing registrationDate
      manufactureDate: '2012-04-03',
      engineSize: '1997',
      hasOutstandingRecall: 'Unavailable',
      motTests: [],
    };
    const result = createTaxCost(ves, mot);
    expect(result).toStrictEqual({ taxCost: 'Unknown' });
  });

  test('should use monthOfFirstRegistration as fallback registration date', () => {
    const ves = {
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
    const mot = {
      registration: 'FE12YMX',
      make: 'FORD',
      model: 'GALAXY',
      firstUsedDate: '2012-04-03',
      fuelType: 'Diesel',
      primaryColour: 'Black',
      // registrationDate: '2012-04-03', test for missing registrationDate
      manufactureDate: '2012-04-03',
      engineSize: '1997',
      hasOutstandingRecall: 'Unavailable',
      motTests: [],
    };
    const result = createTaxCost(ves, mot);
    expect(result).toStrictEqual({ taxCost: '£215' });
  });

  test('should return Light Goods Vehicle (TC39) rate for imported vehicles', () => {
    const mot = {},
      ves = {
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
    const result = createTaxCost(ves, mot);
    expect(result).toStrictEqual({ taxCost: '(TC39) £345' });
  });

  test('should return unknown if 2001-2017 && co2Emissions not present', () => {
    ves = {
      taxStatus: 'Taxed',
      taxDueDate: '2026-08-01',
      motStatus: 'Valid',
      make: 'FORD',
      yearOfManufacture: 2012,
      engineCapacity: 1997,
      // co2Emissions: 149, test for missing co2Emissions
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
    const result = createTaxCost(ves);
    expect(result).toStrictEqual({ taxCost: 'Unknown' });
  });

  describe('vehicle is >2017', () => {
    test('should not show luxury tax as vehicle is older than 5 years', () => {
      const mot = {
        make: 'MERCEDES-BENZ',
        model: 'GLA',
        firstUsedDate: '2018-09-26',
        fuelType: 'Diesel',
        primaryColour: 'Grey',
        registrationDate: '2018-09-26',
        manufactureDate: '2018-09-26',
        engineSize: '2143',
        hasOutstandingRecall: 'Unknown',
        motTests: [[Object], [Object], [Object], [Object], [Object]],
      };
      const ves = {
        taxStatus: 'Taxed',
        taxDueDate: '2026-05-01',
        motStatus: 'Valid',
        make: 'MERCEDES-BENZ',
        yearOfManufacture: 2018,
        engineCapacity: 2143,
        co2Emissions: 130,
        fuelType: 'DIESEL',
        markedForExport: false,
        colour: 'GREY',
        typeApproval: 'M1',
        revenueWeight: 2090,
        dateOfLastV5CIssued: '2025-05-21',
        motExpiryDate: '2026-04-07',
        wheelplan: '2 AXLE RIGID BODY',
        monthOfFirstRegistration: '2018-09',
      };
      const result = createTaxCost(ves, mot);
      expect(result).toStrictEqual({ taxCost: '£195' });
    });

    test('should show luxury tax as vehicle is newer than 5 years', () => {
      const ves = {
        engineCapacity: 2143,
        co2Emissions: 130,
        monthOfFirstRegistration: '2024-09',
      };
      const mot = {
        registrationDate: '2024-09-26',
        engineSize: '2143',
      };
      const result = createTaxCost(ves, mot);
      expect(result).toStrictEqual({ taxCost: '£195 / £620' });
    });
  });

  describe('vehicle is <2017 && >2001', () => {
    test.each`
      co2    | expected
      ${80}  | ${{ taxCost: '£20' }}
      ${100} | ${{ taxCost: '£20' }}
      ${101} | ${{ taxCost: '£20' }}
      ${110} | ${{ taxCost: '£20' }}
      ${111} | ${{ taxCost: '£35' }}
      ${120} | ${{ taxCost: '£35' }}
      ${121} | ${{ taxCost: '£165' }}
      ${130} | ${{ taxCost: '£165' }}
      ${131} | ${{ taxCost: '£195' }}
      ${140} | ${{ taxCost: '£195' }}
      ${141} | ${{ taxCost: '£215' }}
      ${150} | ${{ taxCost: '£215' }}
      ${151} | ${{ taxCost: '£265' }}
      ${165} | ${{ taxCost: '£265' }}
      ${166} | ${{ taxCost: '£315' }}
      ${175} | ${{ taxCost: '£315' }}
      ${176} | ${{ taxCost: '£345' }}
      ${185} | ${{ taxCost: '£345' }}
      ${186} | ${{ taxCost: '£395' }}
      ${200} | ${{ taxCost: '£395' }}
      ${201} | ${{ taxCost: '£430' }}
      ${225} | ${{ taxCost: '£430' }}
      ${226} | ${{ taxCost: '£735' }}
      ${255} | ${{ taxCost: '£735' }}
      ${256} | ${{ taxCost: '£760' }}
      ${299} | ${{ taxCost: '£760' }}
      ${499} | ${{ taxCost: '£760' }}
    `('should return correct cost for each band', ({ co2, expected }) => {
      const ves = {
        engineCapacity: 4799,
        co2Emissions: co2,
        monthOfFirstRegistration: '2007-12',
      };
      const result = createTaxCost(ves);
      expect(result).toStrictEqual(expected);
    });

    describe('vehicle is <2006 && >2001', () => {
      test.each`
        co2    | expected
        ${80}  | ${{ taxCost: '£20' }}
        ${100} | ${{ taxCost: '£20' }}
        ${101} | ${{ taxCost: '£20' }}
        ${110} | ${{ taxCost: '£20' }}
        ${111} | ${{ taxCost: '£35' }}
        ${120} | ${{ taxCost: '£35' }}
        ${121} | ${{ taxCost: '£165' }}
        ${130} | ${{ taxCost: '£165' }}
        ${131} | ${{ taxCost: '£195' }}
        ${140} | ${{ taxCost: '£195' }}
        ${141} | ${{ taxCost: '£215' }}
        ${150} | ${{ taxCost: '£215' }}
        ${151} | ${{ taxCost: '£265' }}
        ${165} | ${{ taxCost: '£265' }}
        ${166} | ${{ taxCost: '£315' }}
        ${175} | ${{ taxCost: '£315' }}
        ${176} | ${{ taxCost: '£345' }}
        ${185} | ${{ taxCost: '£345' }}
        ${186} | ${{ taxCost: '£395' }}
        ${200} | ${{ taxCost: '£395' }}
        ${201} | ${{ taxCost: '£430' }}
        ${225} | ${{ taxCost: '£430' }}
        ${226} | ${{ taxCost: '(K) £430' }}
        ${255} | ${{ taxCost: '(K) £430' }}
        ${256} | ${{ taxCost: '(K) £430' }}
        ${299} | ${{ taxCost: '(K) £430' }}
        ${499} | ${{ taxCost: '(K) £430' }}
      `('should return correct cost for each band', ({ co2, expected }) => {
        const ves = {
          engineCapacity: 4799,
          co2Emissions: co2,
          monthOfFirstRegistration: '2004-12',
        };
        const result = createTaxCost(ves);
        expect(result).toStrictEqual(expected);
      });
    });
  });
});

// handle cutoff dates correctly:
// post 2017
// 2017-04-30 / 2017-05-01 // post 2017 cutoff
// 2006-02-28 / 2006-03-01 // band K max cutoff
// 2001-02-28 / 2001-03-01 // post 2001 cutoff
// pre 2001

// handle post 2017 flat rate
// handle post 2017 potential luxury car tax

// handle post 2001 pre 2017 co2 based
// handle pre 2006 band K max

// handle pre 2001 cc based
// });
// describe('createTaxStatus')
// describe('createMotStatus')
