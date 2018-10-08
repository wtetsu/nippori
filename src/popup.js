//import swal from "sweetalert2";
import tippy from "tippy.js";
// import "tippy.js/dist/tippy.css";
import axios from "axios";
import Vue from "vue";
import App from "./app";

import Paginate from "vuejs-paginate";
Vue.component("paginate", Paginate);

// document.getElementById("btn01").addEventListener("click", () => {
//   //swal("hello!!!");
//   tippy(".img", {
//     arrow: true,
//     arrowType: "round",
//     size: "large"
//   });
// });

// http://site.nicovideo.jp/search-api-docs/search.html
// http://api.search.nicovideo.jp/api/v2/video/contents/search?q=スパ2X東西戦&targets=tags&_sort=-viewCounter&fields=title

const normalizeTitleText = str => {
  return str
    .replace("スパIIX 西日暮里バーサス火曜東西戦", "")
    .replace("ハイパーストII 西日暮里バーサス火曜東西戦", "")
    .trim();
};

const loadAllTheInitialData = async () => {
  const records = [];

  for (let year = 2009; year <= 2018; year++) {
    const newRecords = await registerDict(`/data/data_${year}.json`);
    records.push(...newRecords);
  }
  const sortedRecords = records.sort((a, b) => {
    if (a.startTime < b.startTime) return 1;
    if (a.startTime > b.startTime) return -1;
    return 0;
  });
  return sortedRecords;
};

const registerDict = async fname => {
  const url = chrome.extension.getURL(fname);
  const response = await fetch(url);
  const data = await response.json();
  return data.records;
};

new Vue({
  el: "#app",
  data: {
    searchText: "",
    records: [],
    currentPage: 1,
    pageSize: 200,
    pageCount: 1
  },
  async created() {
    this.records = await loadAllTheInitialData();
    this.pageCount = Math.ceil(this.records.length / this.pageSize);

    chrome.tabs.getSelected(null, tab => {
      let contentId = null;
      const baseUrl = "http://www.nicovideo.jp/watch/";
      if (tab.url.startsWith(baseUrl)) {
        const relativeUrl = tab.url.replace(baseUrl, "");
        if (relativeUrl.startsWith("sm")) {
          contentId = relativeUrl;
        }
      }
      this.activeContentId = contentId;
    });

    chrome.storage.local.get(["searchText"], r => {
      if (r.searchText) {
        this.searchText = r.searchText;
      }
    });
  },
  mounted() {
    this.$refs.searchText.focus();
  },
  components: { App },
  methods: {
    update() {
      this.message += "!!";
    },
    fetchRecords() {
      const apiEndpoint = "http://api.search.nicovideo.jp/api/v2/video/contents/search";
      const searchTag = "%E3%82%B9%E3%83%912X%E6%9D%B1%E8%A5%BF%E6%88%A6";
      const fields = "title,contentId,description,startTime,thumbnailUrl,viewCounter";
      const apiUrl = `${apiEndpoint}?q=${searchTag}&targets=tags&_sort=-startTime&fields=${fields}`;

      axios.get(apiUrl).then(r => {
        if (r.data.meta.status !== 200) {
          return;
        }
        //r.meta.totalCount;
        const data = r.data.data.map(a => {
          const o = Object.assign({}, a);
          o.title = normalizeTitleText(o.title);
          return o;
        });
        this.records = data;
      });
    },
    searchTextChanged() {
      chrome.storage.local.set({
        searchText: this.searchText
      });
    },
    gotoPrev() {
      if (!this.activeContentId) {
        return;
      }
      const index = this.records.findIndex(a => a.contentId === this.activeContentId);
      const newContentId = this.records[index + 1].contentId;
      this.jumpToTheMovie(newContentId);
    },
    gotoNext() {
      if (!this.activeContentId) {
        return;
      }
      const index = this.records.findIndex(a => a.contentId === this.activeContentId);
      const newContentId = this.records[index - 1].contentId;
      this.jumpToTheMovie(newContentId);
    },

    jumpToTheMovie(contentId) {
      if (!contentId) {
        return;
      }
      const url = `http://www.nicovideo.jp/watch/${contentId}`;
      chrome.tabs.update({
        url: url
      });
      this.activeContentId = contentId;
    },
    btnTestPushed() {
      loadAllTheInitialData();
    },
    onClickPagination(pageNum) {
      console.info(pageNum);
      this.currentPage = pageNum;
    }
  },
  computed: {
    filteredRecords() {
      const searchText = this.searchText.trim();
      const startPosition = this.pageSize * (this.currentPage - 1);

      let filteredRecords;
      if (searchText) {
        filteredRecords = this.records.filter(a => {
          return a.description.includes(searchText);
        });
      } else {
        filteredRecords = this.records;
      }

      this.pageCount = Math.ceil(filteredRecords.length / this.pageSize);
      this.currentPage = 1;

      const computedRecords = filteredRecords.slice(startPosition, startPosition + this.pageSize);
      return computedRecords;
    }
  }
});
