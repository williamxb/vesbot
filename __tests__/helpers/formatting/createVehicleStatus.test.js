const { createVehicleStatus } = require('/helpers/formatting/createVehicleStatus');

describe('createVehicleStatus', () => {
  describe('should handle empty input', () => {
    test('input = null', () => {
      const vehicle = null;
      const result = createVehicleStatus(vehicle);
      expect(result.vehicleStatus).toBe('Unknown');
      expect(result.embedColour).toBe(0x0000ff);
    });

    test('input = undefined', () => {
      const vehicle = undefined;
      const result = createVehicleStatus(vehicle);
      expect(result.vehicleStatus).toBe('Unknown');
      expect(result.embedColour).toBe(0x0000ff);
    });
  });

  test('should return clean status', () => {
    const vehicle = {
      scrapped: false,
      stolen: false,
      writeOffCategory: 'none',
    };
    const registration = 'AB12CDE';
    const result = createVehicleStatus(vehicle, registration);
    expect(result.vehicleStatus).toBe('Clean ✨');
    expect(result.embedColour).toBe(0x00b67a);
  });

  test('should return scrapped status', () => {
    const vehicle = {
      scrapped: true,
      stolen: false,
      writeOffCategory: 'none',
    };
    const registration = 'AB12CDE';
    const result = createVehicleStatus(vehicle, registration);
    expect(result.vehicleStatus).toBe('**Scrapped**');
    expect(result.embedColour).toBe(0xb11212);
  });

  test('should return stolen status', () => {
    const vehicle = {
      scrapped: false,
      stolen: true,
      writeOffCategory: 'none',
    };
    const registration = 'AB12CDE';
    const result = createVehicleStatus(vehicle, registration);
    expect(result.vehicleStatus).toBe('**Stolen**');
    expect(result.embedColour).toBe(0xb11212);
  });

  test.each([
    ['A', '**Write-off - CAT A**', 0xb11212],
    ['B', '**Write-off - CAT B**', 0xb11212],
    ['C', '**Write-off - CAT C**', 0xb11212],
    ['D', '**Write-off - CAT D**', 0xb11212],
    ['S', '**Write-off - CAT S**', 0xb11212],
    ['N', '**Write-off - CAT N**', 0xb11212],
  ])(
    'should return write off status for CAT %s',
    (category, expectedVehicleStatus, expectedEmbedColour) => {
      const vehicle = {
        scrapped: false,
        stolen: false,
        writeOffCategory: category,
      };
      const registration = 'AB12CDE';
      const result = createVehicleStatus(vehicle, registration);
      expect(result.vehicleStatus).toBe(expectedVehicleStatus);
      expect(result.embedColour).toBe(expectedEmbedColour);
    }
  )

  test('should handle Q plated vehicles', () => {
    const vehicle = {
      scrapped: false,
      stolen: false,
      writeOffCategory: 'none'
    }
    const registration = 'Q123ABC';
    const result = createVehicleStatus(vehicle, registration);
    expect(result.vehicleStatus).toBe('**Q Plate**');
    expect(result.embedColour).toBe(0xb11212);
  });

  describe('should handle combinations', () => {
    test('scrapped + write off', () => {
      const vehicle = {
        scrapped: true,
        stolen: false,
        writeOffCategory: 'B',
      };
      const registration = 'AB12CDE';
      const result = createVehicleStatus(vehicle, registration);
      expect(result.vehicleStatus).toBe('**Scrapped**, **Write-off - CAT B**');
      expect(result.embedColour).toBe(0xb11212);
    });

    test('scrapped + stolen', () => {
      const vehicle = {
        scrapped: true,
        stolen: true,
        writeOffCategory: 'none',
      };
      const registration = 'AB12CDE';
      const result = createVehicleStatus(vehicle, registration);
      expect(result.vehicleStatus).toBe('**Stolen**, **Scrapped**');
      expect(result.embedColour).toBe(0xb11212);
    });

    test('stolen + write off', () => {
      const vehicle = {
        scrapped: false,
        stolen: true,
        writeOffCategory: 'N',
      };
      const registration = 'AB12CDE';
      const result = createVehicleStatus(vehicle, registration);
      expect(result.vehicleStatus).toBe('**Stolen**, **Write-off - CAT N**');
      expect(result.embedColour).toBe(0xb11212);
    });

    test('scrapped + stolen + write off', () => {
      const vehicle = {
        scrapped: true,
        stolen: true,
        writeOffCategory: 'A',
      };
      const registration = 'AB12CDE';
      const result = createVehicleStatus(vehicle, registration);
      expect(result.vehicleStatus).toBe(
        '**Stolen**, **Scrapped**, **Write-off - CAT A**',
      );
      expect(result.embedColour).toBe(0xb11212);
    });
  });
});