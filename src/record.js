let initialRecords = [];

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

export default {
  async initialize(from, to) {
    initialRecords = await loadInitialData(from, to);
  },
  search() {
    return initialRecords;
  }
};
