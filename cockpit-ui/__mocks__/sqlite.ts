// Mock for sqlite native module in CI environment
// Prevents building native binaries during tests

export default {
  verbose: () => ({}),
  Database: class MockDatabase {
    constructor() {}
    prepare() {
      return {
        get: () => ({}),
        all: () => [],
        run: () => ({ changes: 0, lastInsertRowid: 0 }),
      };
    }
    exec() {}
    close() {}
  },
};
