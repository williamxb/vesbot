const {
	validateRegistration,
	sanitiseInput,
} = require('../../helpers/validation');

describe('validateRegistration', () => {
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

	describe('test valid registrations', () => {
		test('should accept current format', () => {
			expect(validateRegistration('AB51ABC')).toBe(true);
		});
		test('should accept prefix format', () => {
			expect(validateRegistration('A123ABC')).toBe(true);
			expect(validateRegistration('A12ABC')).toBe(true);
			expect(validateRegistration('A1ABC')).toBe(true);
		});
		test('should accept suffix format', () => {
			expect(validateRegistration('ABC123A')).toBe(true);
			expect(validateRegistration('ABC12A')).toBe(true);
			expect(validateRegistration('ABC1A')).toBe(true);
		});
		test('should accept dateless format', () => {
			expect(validateRegistration('1ABC')).toBe(true);
			expect(validateRegistration('ABC1')).toBe(true);
			expect(validateRegistration('1234A')).toBe(true);
			expect(validateRegistration('A1234')).toBe(true);
			expect(validateRegistration('1234AB')).toBe(true);
			expect(validateRegistration('AB1234')).toBe(true);
			expect(validateRegistration('123ABC')).toBe(true);
			expect(validateRegistration('ABC123')).toBe(true);
		});
		test("should accept Northern Ireland's format", () => {
			expect(validateRegistration('ABC123')).toBe(true);
			expect(validateRegistration('ABC1234')).toBe(true);
		});
	});

	describe('test invalid registration formats', () => {
		test('should reject empty string', () => {
			expect(validateRegistration('')).toBe(false);
		});
		test('should reject too many characters', () => {
			expect(validateRegistration('AA123AAA')).toBe(false);
			expect(validateRegistration('AAAA123456')).toBe(false);
			expect(validateRegistration('ABCDEFGHIJK')).toBe(false);
			expect(validateRegistration('123456789')).toBe(false);
		});
		test('should reject too few characters', () => {
			expect(validateRegistration('1')).toBe(false);
			expect(validateRegistration('A')).toBe(false);
		});
		test('should reject diplomatic registration format', () => {
			// these do not appear on public APIs, despite being a valid format
			expect(validateRegistration('123A456')).toBe(false);
		});
	});
});
