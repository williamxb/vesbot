const { calculateColour } = require('/helpers/formatting/calculateColour');

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