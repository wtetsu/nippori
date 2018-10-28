/**
 * Nippori (https://github.com/wtetsu/nippori/)
 * Copyright 2018-present wtetsu
 * Licensed under MIT
 */
import storage from "./storage";
import text from "./text";

let _bundledRecords = [];
let _fetchedRecords = [];

const loadBundledData = async (from, to) => {
  const records = [];

  for (let year = from; year <= to; year++) {
    const newRecords = await loadFile(`/data/data_${year}.json`);
    records.push(...newRecords);
  }

  const sortedRecords = records.sort((a, b) => {
    if (a.startTime < b.startTime) return 1;
    if (a.startTime > b.startTime) return -1;
    return 0;
  });

  return sortedRecords;
};

const loadFile = async fname => {
  const url = chrome.extension.getURL(fname);
  const response = await fetch(url);
  const data = await response.json();
  return data.records;
};

const filter = (initialRecords, aSearchText) => {
  const searchText = aSearchText ? aSearchText.trim() : "";
  const searchTextList = searchText.split(/ +/);

  const filteredRecords = [];

  let dateRecords = null;

  for (let i = 0; i < initialRecords.length; i++) {
    const rec = initialRecords[i];
    if (dateRecords == null || dateRecords.date !== rec.date) {
      if (dateRecords && hit(dateRecords.records, searchTextList)) {
        filteredRecords.push(dateRecords);
      }
      dateRecords = {
        date: rec.date,
        records: []
      };
    }
    dateRecords.records.unshift(rec);
  }

  if (dateRecords && hit(dateRecords.records, searchTextList)) {
    filteredRecords.push(dateRecords);
  }

  return filteredRecords;
};

const hit = (records, searchTextList) => {
  let hitCount = 0;
  for (let i = 0; i < searchTextList.length; i++) {
    const searchText = searchTextList[i];
    for (let j = 0; j < records.length; j++) {
      if (records[j].description.toLowerCase().includes(searchText.toLowerCase())) {
        hitCount += 1;
        break;
      }
    }
  }
  return hitCount >= searchTextList.length;
};

const REPLACE_RULES = [
  {
    type: "r",
    search: /PV■.+?<br \/><br \/><br \/>/,
    new: ""
  },
  {
    type: "r",
    search: "@game_versus　毎週(火)21:00～<br />",
    new: ""
  },
  {
    type: "r",
    search: "@game_versus　毎週(火)21:00～<br>",
    new: ""
  },
  {
    type: "r",
    search: "旧一mylist/16982144 旧二mylist/35480493 新mylist/56023270",
    new: ""
  },
  {
    type: "a",
    search: "東西戦マイリスト"
  },
  {
    type: "a",
    search: "マイリスト"
  },
  {
    type: "r",
    search: /^<br \/>/,
    new: ""
  }
];

const mergeRecords = (currentRecords, newRecords) => {
  let topContentNumber = 0;
  if (currentRecords && currentRecords[0]) {
    topContentNumber = text.convertContentIdToNumber(currentRecords[0].contentId);
  }

  const appends = [];
  for (let i = 0; i < newRecords.length; i++) {
    const r = newRecords[i];
    const contentNumber = text.convertContentIdToNumber(r.contentId);
    if (contentNumber <= topContentNumber) {
      break;
    }
    appends.push(r);
  }

  return appends.concat(currentRecords);
};

export default {
  async initialize(from, to) {
    const bundledRecords = await loadBundledData(from, to);
    for (let i = 0; i < bundledRecords.length; i++) {
      const rec = bundledRecords[i];
      rec.description = text.replaceByRule(rec.description, REPLACE_RULES);
    }
    const fetchedRecords = await storage.getDatum("fetchedRecords");
    _bundledRecords = bundledRecords;
    if (fetchedRecords) {
      _fetchedRecords = fetchedRecords;
    }
  },
  getRawRecords() {
    const latestContentIdOfBundledRecords = _bundledRecords && _bundledRecords[0] && _bundledRecords[0].contentId;
    if (!latestContentIdOfBundledRecords) {
      return [];
    }
    const fetchedRecords = [];
    if (_fetchedRecords) {
      for (let i = 0; i < _fetchedRecords.length; i++) {
        const r = _fetchedRecords[i];
        if (r.contentId === latestContentIdOfBundledRecords) {
          break;
        }
        fetchedRecords.push(r);
      }
    }

    const mergedRecords = [];
    for (let i = 0; i < fetchedRecords.length; i++) {
      const rec = Object.assign({}, fetchedRecords[i]);
      rec.description = text.replaceByRule(rec.description, REPLACE_RULES);
      mergedRecords.push(rec);
    }
    mergedRecords.push(..._bundledRecords);
    return mergedRecords;
  },

  search(searchText) {
    const mergedRecords = this.getRawRecords();
    return filter(mergedRecords, searchText);
  },

  getLatestContentId() {
    if (_fetchedRecords && _fetchedRecords[0] && _fetchedRecords[0].contentId) {
      return _fetchedRecords[0].contentId;
    }
    if (_bundledRecords && _bundledRecords[0] && _bundledRecords[0].contentId) {
      return _bundledRecords[0].contentId;
    }
    return null;
  },

  getRelativeRecord(contentId, offset) {
    if (!contentId) {
      return null;
    }
    let result = null;
    const records = this.getRawRecords();
    const index = records.findIndex(a => a.contentId === contentId);
    if (index >= 0) {
      result = records[index + offset];
    }
    return result;
  },

  async saveRecords(newRecords) {
    if (!newRecords || newRecords.length == 0) {
      return;
    }
    const mergedRecords = mergeRecords(_fetchedRecords, newRecords);
    await storage.set({
      fetchedRecords: mergedRecords
    });
    _fetchedRecords = mergedRecords;
  },

  mergeRecords: mergeRecords
};
