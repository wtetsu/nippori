let _initialRecords = [];

const loadInitialData = async (from, to) => {
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

  const filteredRecords = [];

  let dateRecords = null;
  let thisDateRecordsHit = false;
  for (let i = 0; i < initialRecords.length; i++) {
    const rec = initialRecords[i];
    if (dateRecords == null || dateRecords.date !== rec.date) {
      if (thisDateRecordsHit) {
        filteredRecords.push(dateRecords);
        thisDateRecordsHit = false;
      }
      dateRecords = {
        date: rec.date,
        records: []
      };
    }
    if (rec.description.toLowerCase().includes(searchText.toLowerCase())) {
      thisDateRecordsHit = true;
    }
    dateRecords.records.unshift(rec);
  }
  if (thisDateRecordsHit) {
    filteredRecords.push(dateRecords);
  }

  return filteredRecords;
};

export default {
  async initialize(from, to) {
    _initialRecords = await loadInitialData(from, to);
  },
  search(searchText) {
    return filter(_initialRecords, searchText);
  }
};
