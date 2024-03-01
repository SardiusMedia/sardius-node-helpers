module.exports = {
  roots: ['./src'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },
  setupFiles: ['./setupBeforeEnv.js'],
  setupFilesAfterEnv: ['./setupAfterEnv.js'],
};
