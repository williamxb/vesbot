import { createTaxCost, RATES  } from '#helpers/formatting/createTaxCost.js';

/**
 * @param {Number} co2 
 * @returns {Object} taxCost object to be used in tests
 */
const getRate = (co2) => ({ taxCost: `£${RATES.POST_2001_BANDS.find(r => co2 <= r.co2).rate}` });

/**
 * @param {Number} co2 
 * @returns {Object} taxCost object to be used in tests between 2001-2006, to handle Band K cap
 */
const getRateCapped = (co2) => {
  const r = RATES.POST_2001_BANDS.find(r => co2 <= r.co2).rate;
  return { taxCost: r > RATES.BAND_K_CAP ? RATES.BAND_K_CAP_TEXT : `£${r}` };
};

describe('createTaxCost', () => {
  test('should return unknown if tax status unavailable', () => {
    const ves = {},
      mot = {};
    const result = createTaxCost(ves, mot);
    expect(result).toStrictEqual({ taxCost: 'Unknown' });
  });

  test('should return Cannot calculate if typeApproval is not M1', () => {
    const ves = { typeApproval: 'L1e' };
    const mot = {};
    const result = createTaxCost(ves, mot);
    expect(result).toStrictEqual({ taxCost: 'Cannot calculate' });
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
    expect(result).toStrictEqual(getRate(149));
  });

  test('lower rate PLG', () => {
    const mot = {};
      const ves = {
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
    expect(result).toStrictEqual({ taxCost: RATES.PRE_2001_LARGE_ENGINE });
  });

  describe('imported vehicle', () => {
    test('higher rate PLG', () => {
      const mot = {};
      const ves = {
          taxStatus: 'SORN',
          motStatus: 'Valid',
          make: 'BMW',
          yearOfManufacture: 2009,
          engineCapacity: 999,
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
      expect(result).toStrictEqual({ taxCost: RATES.PRE_2001_SMALL_ENGINE });
    });
  
    test('should fall back to PLG if co2Emissions unknown', () => {
      const ves = {
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
      expect(result).toStrictEqual({ taxCost: RATES.PRE_2001_LARGE_ENGINE });
    });

  })

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
      expect(result).toStrictEqual({ taxCost: RATES.POST_2017_FLAT });
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
      expect(result).toStrictEqual({ taxCost: RATES.POST_2017_FLAT_ECS });
    });
  });

  describe('vehicle is <2017 && >2001', () => {
    test.each`
      co2    | expected
      ${80} | ${getRate(80)}
      ${100} | ${getRate(100)}
      ${101} | ${getRate(101)}
      ${110} | ${getRate(110)}
      ${111} | ${getRate(111)}
      ${120} | ${getRate(120)}
      ${121} | ${getRate(121)}
      ${130} | ${getRate(130)}
      ${131} | ${getRate(131)}
      ${140} | ${getRate(140)}
      ${141} | ${getRate(141)}
      ${150} | ${getRate(150)}
      ${151} | ${getRate(151)}
      ${165} | ${getRate(165)}
      ${166} | ${getRate(166)}
      ${175} | ${getRate(175)}
      ${176} | ${getRate(176)}
      ${185} | ${getRate(185)}
      ${186} | ${getRate(186)}
      ${200} | ${getRate(200)}
      ${201} | ${getRate(201)}
      ${225} | ${getRate(225)}
      ${226} | ${getRate(226)}
      ${255} | ${getRate(255)}
      ${256} | ${getRate(256)}
      ${299} | ${getRate(299)}
      ${499} | ${getRate(499)}
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
        ${80} | ${getRateCapped(80)}
        ${100} | ${getRateCapped(100)}
        ${101} | ${getRateCapped(101)}
        ${110} | ${getRateCapped(110)}
        ${111} | ${getRateCapped(111)}
        ${120} | ${getRateCapped(120)}
        ${121} | ${getRateCapped(121)}
        ${130} | ${getRateCapped(130)}
        ${131} | ${getRateCapped(131)}
        ${140} | ${getRateCapped(140)}
        ${141} | ${getRateCapped(141)}
        ${150} | ${getRateCapped(150)}
        ${151} | ${getRateCapped(151)}
        ${165} | ${getRateCapped(165)}
        ${166} | ${getRateCapped(166)}
        ${175} | ${getRateCapped(175)}
        ${176} | ${getRateCapped(176)}
        ${185} | ${getRateCapped(185)}
        ${186} | ${getRateCapped(186)}
        ${200} | ${getRateCapped(200)}
        ${201} | ${getRateCapped(201)}
        ${225} | ${getRateCapped(225)}
        ${226} | ${getRateCapped(226)}
        ${255} | ${getRateCapped(255)}
        ${256} | ${getRateCapped(256)}
        ${299} | ${getRateCapped(299)}
        ${499} | ${getRateCapped(499)}
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

  describe('vehicle is <2001', () => {
    test('should handle MOT missing engine capacity', () => {
      const ves = {
        engineCapacity: 2143,
        monthOfFirstRegistration: '1999-09',
      };
      const mot = {
        registrationDate: '1999-09-26',
        // engineSize: '2143', test missing engineSize
      };
      const result = createTaxCost(ves, mot);
      expect(result).toStrictEqual({ taxCost: RATES.PRE_2001_LARGE_ENGINE });
    });

    test('should handle VES missing engine capacity', () => {
      const ves = {
        // engineCapacity: 2143, test missing engineCapacity
        monthOfFirstRegistration: '1999-09',
      };
      const mot = {
        registrationDate: '1999-09-26',
        engineSize: '2143',
      };
      const result = createTaxCost(ves, mot);
      expect(result).toStrictEqual({ taxCost: RATES.PRE_2001_LARGE_ENGINE });
    });

    test('should return unknown if engine capacity is missing(ALL)', () => {
      const ves = {
        // engineCapacity: 2143, test missing engineCapacity
        monthOfFirstRegistration: '1999-09',
      };
      const mot = {
        registrationDate: '1999-09-26',
        // engineSize: '2143', test missing engineSize
      };
      const result = createTaxCost(ves, mot);
      expect(result).toStrictEqual({ taxCost: 'Unknown' });
    });

    test('should return correct cost for >= 1549cc ', () => {
      const ves = {
        engineCapacity: 2999,
        monthOfFirstRegistration: '1999-09',
      };
      const mot = {
        registrationDate: '1999-09-26',
        engineSize: '2999',
      };
      const result = createTaxCost(ves, mot);
      expect(result).toStrictEqual({ taxCost: RATES.PRE_2001_LARGE_ENGINE });
    });

    test('should return correct cost for < 1548cc ', () => {
      const ves = {
        engineCapacity: 999,
        monthOfFirstRegistration: '1999-09',
      };
      const mot = {
        registrationDate: '1999-09-26',
        engineSize: '999',
      };
      const result = createTaxCost(ves, mot);
      expect(result).toStrictEqual({ taxCost: RATES.PRE_2001_SMALL_ENGINE });
    });
  });

  describe('should handle cutoff dates correctly', () => {
    describe('1 April 2017', () => {
      test('should handle 2017-04-01 correctly', () => {
        const ves = {
          engineCapacity: 2143,
          co2Emissions: 999,
          monthOfFirstRegistration: '2017-04',
        };
        const mot = {
          registrationDate: '2017-04-01',
          engineSize: '2143',
        };
        const result = createTaxCost(ves, mot);
        expect(result).toStrictEqual({ taxCost: RATES.POST_2017_FLAT });
      });

      test('should handle 2017-03-31 correctly', () => {
        const ves = {
          engineCapacity: 2143,
          co2Emissions: 999,
          monthOfFirstRegistration: '2017-04',
        };
        const mot = {
          registrationDate: '2017-03-31',
          engineSize: '2143',
        };
        const result = createTaxCost(ves, mot);
        expect(result).toStrictEqual({ taxCost: getRate(999).taxCost });
      });
    });

    describe('1 March 2001', () => {
      test('should handle 2017-04-01 correctly', () => {
        const ves = {
          engineCapacity: 2143,
          co2Emissions: 999,
          monthOfFirstRegistration: '2001-03',
        };
        const mot = {
          registrationDate: '2001-03-01',
          engineSize: '2143',
        };
        const result = createTaxCost(ves, mot);
        expect(result).toStrictEqual({ taxCost: RATES.BAND_K_CAP_TEXT });
      });

      test('should handle 2001-02-28 correctly (large engine)', () => {
        const ves = {
          engineCapacity: 2143,
          co2Emissions: 999,
          monthOfFirstRegistration: '2001-02',
        };
        const mot = {
          registrationDate: '2001-02-28',
          engineSize: '2143',
        };
        const result = createTaxCost(ves, mot);
        expect(result).toStrictEqual({ taxCost: RATES.PRE_2001_LARGE_ENGINE });
      });

      test('should handle 2001-02-28 correctly (small engine)', () => {
        const ves = {
          engineCapacity: 999,
          co2Emissions: 999,
          monthOfFirstRegistration: '2001-02',
        };
        const mot = {
          registrationDate: '2001-02-28',
          engineSize: '2143',
        };
        const result = createTaxCost(ves, mot);
        expect(result).toStrictEqual({ taxCost: RATES.PRE_2001_SMALL_ENGINE });
      });
    });
  });
});