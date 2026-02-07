const commonConfig = require('./jest.config.common');

module.exports = {
  ...commonConfig,
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
  moduleNameMapper: {
    ...commonConfig.moduleNameMapper,
    '^uuid$': 'uuid',
  },
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
};
