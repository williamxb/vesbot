const { createVehicleStatus, calculateColour } = require('../../helpers/formatting');

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
