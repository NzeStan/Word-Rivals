// Just enough of the phone's modules for the networking code to run in Node.
const store = new Map();

module.exports = {
  __esModule: true,
  Platform: { OS: 'android' },
  default: { expoConfig: { hostUri: 'localhost:8081' } },
  getItemAsync: async (key) => store.get(key) ?? null,
  setItemAsync: async (key, value) => void store.set(key, value),
  deleteItemAsync: async (key) => void store.delete(key),
};
