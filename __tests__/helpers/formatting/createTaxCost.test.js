const { createTaxCost } = require('/helpers/formatting/createTaxCost');


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

  test('lower rate PLG', () => {
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
    expect(result).toStrictEqual({ taxCost: '£360' });
  });

  describe('imported vehicle', () => {
    test('higher rate PLG', () => {
      const mot = {},
        ves = {
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
      expect(result).toStrictEqual({ taxCost: '£220' });
    });
  
    test('should fall back to PLG if co2Emissions unknown', () => {
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
      expect(result).toStrictEqual({ taxCost: '£360' });
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
        ${226} | ${{ taxCost: '£430 (Band K cap)' }}
        ${255} | ${{ taxCost: '£430 (Band K cap)' }}
        ${256} | ${{ taxCost: '£430 (Band K cap)' }}
        ${299} | ${{ taxCost: '£430 (Band K cap)' }}
        ${499} | ${{ taxCost: '£430 (Band K cap)' }}
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
      expect(result).toStrictEqual({ taxCost: '£360' });
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
      expect(result).toStrictEqual({ taxCost: '£360' });
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
      expect(result).toStrictEqual({ taxCost: '£360' });
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
      expect(result).toStrictEqual({ taxCost: '£220' });
    });
  });

  describe('should handle cutoff dates correctly', () => {
    describe('1 April 2017', () => {
      test('should handle 2017-01-04 correctly', () => {
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
        expect(result).toStrictEqual({ taxCost: '£195' });
      });

      test('should handle 2017-03-30 correctly', () => {
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
        expect(result).toStrictEqual({ taxCost: '£760' });
      });
    });

    describe('1 March 2001', () => {
      test('should handle 2017-01-04 correctly', () => {
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
        expect(result).toStrictEqual({ taxCost: '£430 (Band K cap)' });
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
        expect(result).toStrictEqual({ taxCost: '£360' });
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
        expect(result).toStrictEqual({ taxCost: '£220' });
      });
    });
  });
});