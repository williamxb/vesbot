const { sanitiseInput } = require('/helpers/validation/sanitiseInput');

describe('test input sanitization', () => {
    test('remove special characters', () => {
      expect(sanitiseInput('A-A-1-2-A-A-A')).toBe('AA12AAA');
      expect(sanitiseInput(`AA12BBB"; function doBadThings() { }`)).toBe(
        'AA12BBBFUNCTIONDOBADTHINGS',
      );
      expect(sanitiseInput(`AB12CDE' or 1=1--`)).toBe('AB12CDEOR11');
    });
    test('remove spaces', () => {
      expect(sanitiseInput('AB12 CDE')).toBe('AB12CDE');
      expect(sanitiseInput('A 1')).toBe('A1');
    });
  });