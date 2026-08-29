const store = {};

const asyncStorageMock = {
  setItem: jest.fn(async (key, value) => {
    store[key] = String(value);
    return null;
  }),
  getItem: jest.fn(async (key) => {
    return store[key] !== undefined ? store[key] : null;
  }),
  removeItem: jest.fn(async (key) => {
    delete store[key];
    return null;
  }),
  clear: jest.fn(async () => {
    for (const k in store) delete store[k];
    return null;
  })
};

module.exports = asyncStorageMock;
