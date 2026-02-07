const commonConfig = require('./jest.config.common');

module.exports = {
  ...commonConfig,
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/*.entity.ts',
    '!**/*.dto.ts',
    '!**/main.ts',
  ],
  coverageDirectory: '../coverage',
};
