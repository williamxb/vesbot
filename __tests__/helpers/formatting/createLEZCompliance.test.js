const { createLEZCompliance } = require('/helpers/formatting/createLEZCompliance');

describe('missing or malformed data', () => {
  test('should handle no data', () => {
    expect(createLEZCompliance()).toStrictEqual({lezTitle: 'LEZ ❓', lezStatus: 'Unknown'})
  })

  describe('missing fuel type', () => {
    test('should handle VES missing fuel type', () => {
      const vehicle = {/*'ves':{fuelType: 'DIESEL'},*/'mot':{fuelType: 'Diesel'}, 'euro':{ euroStatus: 'EURO 5'}};
      expect(createLEZCompliance(vehicle)).toStrictEqual({lezTitle: 'LEZ ❌', lezStatus: 'Euro 5 Diesel\nNon-compliant'})
    });
    test('should handle MOT missing fuel type', () => {
      const vehicle = {'ves':{fuelType: 'DIESEL'},/*'mot':{fuelType: 'Diesel'},*/ 'euro':{ euroStatus: 'EURO 5'}};
      expect(createLEZCompliance(vehicle)).toStrictEqual({lezTitle: 'LEZ ❌', lezStatus: 'Euro 5 Diesel\nNon-compliant'})
    });
    test('should handle no fuel type', () => {
      const vehicle = {/*'ves':{fuelType: 'DIESEL'},'mot':{fuelType: 'Diesel'},*/ 'euro':{ euroStatus: 'EURO 5'}};
      expect(createLEZCompliance(vehicle)).toStrictEqual({lezTitle: 'LEZ ❓', lezStatus: 'Unknown'})
    });
  });

  describe('missing manufacture date', () => {
    test('should handle MOT missing manufacture date', () => {
      const vehicle = {'ves':{fuelType: 'DIESEL', monthOfFirstRegistration: '2013-03'},'mot':{fuelType: 'Diesel'}};
      expect(createLEZCompliance(vehicle)).toStrictEqual({lezTitle: 'LEZ ❌', lezStatus: 'Pre-Euro 6 Diesel\nNon-compliant'})
    });

    test('should handle VES missing manufacture date', () => {
      const vehicle = {'ves':{fuelType: 'DIESEL'},'mot':{fuelType: 'Diesel', registrationDate: '2013-03-20'}};
      expect(createLEZCompliance(vehicle)).toStrictEqual({lezTitle: 'LEZ ❌', lezStatus: 'Pre-Euro 6 Diesel\nNon-compliant'})
    });
  })
});

describe('with HPI EURO API', () => {
  describe('test non-compliance', () => {
    test.each([
      ['Diesel', 'EURO 1', 'LEZ ❌', 'Euro 1 Diesel\nNon-compliant'],
      ['Diesel', 'EURO 2', 'LEZ ❌', 'Euro 2 Diesel\nNon-compliant'],
      ['DIESEL', 'EURO 3', 'LEZ ❌', 'Euro 3 Diesel\nNon-compliant'],
      ['DIESEL', 'EURO 4', 'LEZ ❌', 'Euro 4 Diesel\nNon-compliant'],
      ['Diesel', 'EURO 5', 'LEZ ❌', 'Euro 5 Diesel\nNon-compliant'],
    ])(
      'return non-compliant for %s %s',
      (fuel, euroStandard, expectedTitle, expectedStatus) => {
        const vehicle = {
          'ves': { 'fuelType': fuel },
          'mot': { 'fuelType': fuel },
          'euro': { 'euroStatus': euroStandard }
        }
        expect(createLEZCompliance(vehicle)).toStrictEqual({'lezTitle': expectedTitle, 'lezStatus': expectedStatus})
      }
    );

    test.each([
      ['Petrol', 'EURO 1', 'LEZ ❌', 'Euro 1 Petrol\nNon-compliant'],
      ['PETROL', 'EURO 2', 'LEZ ❌', 'Euro 2 Petrol\nNon-compliant'],
      ['PETROL', 'EURO 3', 'LEZ ❌', 'Euro 3 Petrol\nNon-compliant'],
    ])(
      'return non-compliant for %s %s',
      (fuel, euroStandard, expectedTitle, expectedStatus) => {
        const vehicle = {
          'ves': { 'fuelType': fuel },
          'mot': { 'fuelType': fuel },
          'euro': { 'euroStatus': euroStandard }
        }
        expect(createLEZCompliance(vehicle)).toStrictEqual({'lezTitle': expectedTitle, 'lezStatus': expectedStatus})
      }
    );
  });

  describe('test compliance', () => {
    test.each([
      ['Diesel', 'EURO 6', 'LEZ ✅', 'Euro 6 Diesel\nCompliant'],
    ])(
      'return compliant for %s %s',
      (fuel, euroStandard, expectedTitle, expectedStatus) => {
        const vehicle = {
          'ves': { 'fuelType': fuel },
          'mot': { 'fuelType': fuel },
          'euro': { 'euroStatus': euroStandard }
        }
        expect(createLEZCompliance(vehicle)).toStrictEqual({'lezTitle': expectedTitle, 'lezStatus': expectedStatus})
      }
    );

    test.each([
      ['Petrol', 'EURO 4', 'LEZ ✅', 'Euro 4 Petrol\nCompliant'],
      ['PETROL', 'EURO 5', 'LEZ ✅', 'Euro 5 Petrol\nCompliant'],
      ['PETROL', 'EURO 6', 'LEZ ✅', 'Euro 6 Petrol\nCompliant'],
    ])(
      'return compliant for %s %s',
      (fuel, euroStandard, expectedTitle, expectedStatus) => {
        const vehicle = {
          'ves': { 'fuelType': fuel },
          'mot': { 'fuelType': fuel },
          'euro': { 'euroStatus': euroStandard }
        }
        expect(createLEZCompliance(vehicle)).toStrictEqual({'lezTitle': expectedTitle, 'lezStatus': expectedStatus})
      }
    );
  });
});

describe('without HPI EURO API', () => {
  describe('test using VES data', () => {
    test.each([
      ['DIESEL', '1990-03', 'LEZ ❌', 'Pre-Euro 6 Diesel\nNon-compliant'],
      ['DIESEL', '2013-03', 'LEZ ❌', 'Pre-Euro 6 Diesel\nNon-compliant'],
      ['DIESEL', '2016-03', 'LEZ ✅⚠️', 'Euro 5/6 Diesel\nPotentially compliant'],
      ['DIESEL', '2023-03', 'LEZ ✅', 'Post-Euro 6 Diesel\nCompliant'],
      ['PETROL', '1990-03', 'LEZ ❌', 'Pre-Euro 4 Petrol\nNon-compliant'],
      ['PETROL', '2004-03', 'LEZ ❌', 'Pre-Euro 4 Petrol\nNon-compliant'],
      ['PETROL', '2005-03', 'LEZ ✅⚠️', 'Euro 3/4 Petrol\nPotentially compliant'],
      ['PETROL', '2006-03', 'LEZ ✅', 'Post-Euro 4 Petrol\nCompliant'],
      ['PETROL', '2023-03', 'LEZ ✅', 'Post-Euro 4 Petrol\nCompliant'],
    ])(
      'return compliant for %s %s',
      (fuel, registrationDate, expectedTitle, expectedStatus) => {
        const vehicle = {
          'ves': { 'fuelType': fuel, 'monthOfFirstRegistration': registrationDate },
          'mot': { 'fuelType': fuel },
        }
        expect(createLEZCompliance(vehicle)).toStrictEqual({'lezTitle': expectedTitle, 'lezStatus': expectedStatus})
      }
    );
  });

  describe('test using MOT data', () => {
    test.each([
      ['Diesel', '1990-03-01', 'LEZ ❌', 'Pre-Euro 6 Diesel\nNon-compliant'],
      ['Diesel', '2013-03-01', 'LEZ ❌', 'Pre-Euro 6 Diesel\nNon-compliant'],
      ['Diesel', '2016-03-01', 'LEZ ✅⚠️', 'Euro 5/6 Diesel\nPotentially compliant'],
      ['Diesel', '2023-03-01', 'LEZ ✅', 'Post-Euro 6 Diesel\nCompliant'],
      ['Petrol', '1990-03-01', 'LEZ ❌', 'Pre-Euro 4 Petrol\nNon-compliant'],
      ['Petrol', '2004-03-01', 'LEZ ❌', 'Pre-Euro 4 Petrol\nNon-compliant'],
      ['Petrol', '2005-03-01', 'LEZ ✅⚠️', 'Euro 3/4 Petrol\nPotentially compliant'],
      ['Petrol', '2006-03-01', 'LEZ ✅', 'Post-Euro 4 Petrol\nCompliant'],
      ['Petrol', '2023-03-01', 'LEZ ✅', 'Post-Euro 4 Petrol\nCompliant'],
    ])(
      'return compliant for %s %s',
      (fuel, registrationDate, expectedTitle, expectedStatus) => {
        const vehicle = {
          'ves': { 'fuelType': fuel },
          'mot': { 'fuelType': fuel, 'registrationDate': registrationDate },
        }
        expect(createLEZCompliance(vehicle)).toStrictEqual({'lezTitle': expectedTitle, 'lezStatus': expectedStatus})
      }
    );
  });
});
