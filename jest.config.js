module.exports = {
	testEnvironment: 'node',
	coverageDirectory: 'coverage',
	collectCoverageFrom: ['commands/**/*.js', 'helpers/*.js'],
	testMatch: ['**/__tests__/**/*.test.js'],
	reporters: ['default', 'jest-junit'],
};