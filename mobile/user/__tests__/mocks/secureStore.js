const storage = new Map();

module.exports = {
  setItemAsync: jest.fn(async (key, value) => {
    storage.set(key, String(value));
  }),
  getItemAsync: jest.fn(async (key) => {
    return storage.has(key) ? storage.get(key) : null;
  }),
  deleteItemAsync: jest.fn(async (key) => {
    storage.delete(key);
  }),
  isAvailableAsync: jest.fn(async () => true),
};
