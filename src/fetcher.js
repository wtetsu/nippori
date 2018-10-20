import axios from "axios";

const normalizeTitleText = str => {
  return str
    .replace("スパIIX 西日暮里バーサス火曜東西戦", "")
    .replace("ハイパーストII 西日暮里バーサス火曜東西戦", "")
    .trim();
};

const fetchRecords = () => {
  const apiEndpoint = "http://api.search.nicovideo.jp/api/v2/video/contents/search";
  const searchTag = "%E3%82%B9%E3%83%912X%E6%9D%B1%E8%A5%BF%E6%88%A6";
  const fields = "title,contentId,description,startTime,thumbnailUrl,viewCounter";
  const apiUrl = `${apiEndpoint}?q=${searchTag}&targets=tags&_sort=-startTime&fields=${fields}`;

  return axios
    .get(apiUrl)
    .then(r => {
      if (r.data.meta.status !== 200) {
        return;
      }

      //r.meta.totalCount;
      const data = r.data.data.map(a => {
        const o = Object.assign({}, a);
        //o.title = normalizeTitleText(o.title);

        console.info(o);

        return o;
      });
      //this.records = data;
      return data;
    })
    .catch(function(error) {
      console.log(error);
    })
    .then(function() {
      // always executed
    });
};

export default {
  fetch: fetchRecords
};
