export default {
	testEnvironment: 'node',
	coverageDirectory: 'coverage',
	collectCoverageFrom: ['commands/**/*.js', 'helpers/*.js'],
	moduleNameMapper: {
		'^#helpers/(.*)$': '<rootDir>/helpers/$1',
	},
	testMatch: ['**/__tests__/**/*.test.js'],
	reporters: ['default', 'jest-junit'],
};
