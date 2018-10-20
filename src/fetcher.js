import axios from "axios";

// const normalizeTitleText = str => {
//   return str
//     .replace("スパIIX 西日暮里バーサス火曜東西戦", "")
//     .replace("ハイパーストII 西日暮里バーサス火曜東西戦", "")
//     .trim();
// };

// http://site.nicovideo.jp/search-api-docs/search.html
const API_ENDPOINT = "https://api.search.nicovideo.jp/api/v2/video/contents/search";
const SEARCH_TAG = "%E3%82%B9%E3%83%912X%E6%9D%B1%E8%A5%BF%E6%88%A6";
const FIELDS = "title,contentId,description,startTime,thumbnailUrl,viewCounter";

const fetchRecords = async offset => {
  const apiUrl = `${API_ENDPOINT}?q=${SEARCH_TAG}&targets=tags&_sort=-startTime&fields=${FIELDS}&_offset=${offset}&_limit=10`;

  return axios.get(apiUrl).then(r => {
    if (r.data.meta.status !== 200) {
      return;
    }
    //r.meta.totalCount;
    const data = r.data.data.map(a => {
      const o = Object.assign({}, a);
      //o.title = normalizeTitleText(o.title);
      return o;
    });
    return data;
  });
};

export default {
  fetch: async latestContentId => {
    if (!latestContentId) {
      return [];
    }
    const records = [];
    for (let offset = 0; offset <= 1000; offset += 10) {
      const fetchedRecords = await fetchRecords(offset);
      const index = fetchedRecords.findIndex(r => r.contentId === latestContentId);
      if (index >= 0) {
        records.push(...fetchedRecords.slice(0, index));
        break;
      }
      records.push(...fetchedRecords);
    }
    let processedRecords = records.filter(r => r.title.includes("西日暮里バーサス火曜東西戦"));

    processedRecords.map(r => {
      const m = r.title.match(/([0-9]+\/[0-9]+\/[0-9]+)/);
      if (m) {
        r.date = m[1];
        r.year = r.date.substring(0, 4);
      }
    });
    return processedRecords;
  }
};
