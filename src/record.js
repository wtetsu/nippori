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
      if (dateRecords) {
        if (hit(dateRecords.records, searchTextList)) {
          filteredRecords.push(dateRecords);
        }
      }
      dateRecords = {
        date: rec.date,
        records: []
      };
    }

    dateRecords.records.unshift(rec);
  }

  if (hit(dateRecords.records, searchTextList)) {
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

export default {
  async initialize(from, to) {
    _bundledRecords = await loadBundledData(from, to);
  },
  search(searchText) {
    const latestContentId = _bundledRecords && _bundledRecords[0] && _bundledRecords[0].contentId;
    if (!latestContentId) {
      return [];
    }

    const fetchedRecords = [];

    if (_fetchedRecords) {
      for (let i = 0; i < _fetchedRecords.length; i++) {
        const r = _fetchedRecords[i];
        if (r.contentId === latestContentId) {
          break;
        }
        fetchedRecords.push(r);
      }
    }

    const mergedRecords = fetchedRecords.concat(_bundledRecords);

    return filter(mergedRecords, searchText);
  },
  getLatestContentId() {
    return _bundledRecords && _bundledRecords[0] && _bundledRecords[0].contentId;
  },
  saveRecords(newRecords) {
    _fetchedRecords = newRecords;
  }
};
