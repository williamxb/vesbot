const { createVehicleYear } = require('/helpers/formatting/createVehicleYear');

describe('createVehicleStatus', () => {
  describe('should handle empty input', () => {
    test('input = null', () => {
      const vehicle = null;
      const result = createVehicleYear(vehicle);
      expect(result).toStrictEqual({"year": "Unknown Year "});
    });

    test('input = undefined', () => {
      const vehicle = undefined;
      const result = createVehicleYear(vehicle);
      expect(result).toStrictEqual({"year": "Unknown Year "});
    });
  });

  describe('should handle correct inputs', () => {
    test('should get year from mot.manufactureDate', () => {
      const vehicle = {"mot":{"manufactureDate":"1951-12-31"}}
      const result = createVehicleYear(vehicle)
      expect(result).toStrictEqual({"year": "1951 "})
    });

    test('should get year from mot.manufactureYear', () => {
      const vehicle = {"mot":{"manufactureYear":"1951"},}
      const result = createVehicleYear(vehicle)
      expect(result).toStrictEqual({"year": "1951 "})
    });
    
    test('should get year from ves.yearOfManufacture', () => {
      const vehicle = {"ves":{"yearOfManufacture":1951}}
      const result = createVehicleYear(vehicle)
      expect(result).toStrictEqual({"year": "1951 "})
    });
    
    test('should get year from vin.plate_lookup.year', () => {
      const vehicle = {"vin":{"plate_lookup":{"year":"1951"}}}
      const result = createVehicleYear(vehicle)
      expect(result).toStrictEqual({"year": "1951 "})
    })
  });
});
