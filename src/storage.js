/**
 * Nippori (https://github.com/wtetsu/nippori/)
 * Copyright 2018-present wtetsu
 * Licensed under MIT
 */
export default {
  async get(keys) {
    return new Promise(resolve => {
      chrome.storage.local.get(keys, r => {
        resolve(r);
      });
    });
  },
  async set(data) {
    return new Promise(resolve => {
      chrome.storage.local.set(data, () => {
        resolve();
      });
    });
  },
  async getDatum(key) {
    return new Promise(resolve => {
      chrome.storage.local.get([key], r => {
        resolve(r[key]);
      });
    });
  }
};
