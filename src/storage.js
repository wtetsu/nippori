export default {
  async get(keys) {
    return new Promise(resolve => {
      chrome.storage.local.get(keys, r => {
        resolve(r);
      });
    });
  },
  async set() {}
};
