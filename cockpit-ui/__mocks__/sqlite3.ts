// Mock for sqlite3 native module in CI environment
// Prevents building native binaries during tests

export default {
  verbose: () => ({
    Database: class MockDatabase {
      constructor(_filename: string, _callback?: () => void) {
        if (_callback) _callback();
      }
      run(_sql: string, _params?: any, _callback?: () => void) {
        if (_callback) _callback();
      }
      get(_sql: string, _params?: any, _callback?: (err: any, row: any) => void) {
        if (_callback) _callback(null, {});
      }
      all(_sql: string, _params?: any, _callback?: (err: any, rows: any[]) => void) {
        if (_callback) _callback(null, []);
      }
      exec(_sql: string, _callback?: () => void) {
        if (_callback) _callback();
      }
      close(_callback?: () => void) {
        if (_callback) _callback();
      }
    },
  }),
};
