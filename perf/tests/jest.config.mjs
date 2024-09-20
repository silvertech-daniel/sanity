import {createJestConfig} from '../../test/config.mjs'

export default createJestConfig({
  // ignore performance tests
  testPathIgnorePatterns: ['tests'],
  displayName: 'sanity-perf-tests',
})
