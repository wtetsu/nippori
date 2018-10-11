<template>
  <div style="min-width:500px;min-height:500px;">
    <input type="button" value="前の動画へ" @click="gotoPrev()" />
    <input type="button" value="次の動画へ" @click="gotoNext()" />

    <br />

    <input type="text" v-model="searchText" v-on:keyup="searchTextChanged()" @change="searchTextChanged()" ref="searchText" />
    <input type="button" value="更新" @click="fetchRecords()" />

    <paginate v-model="currentPage" :page-count="pageCount" :click-handler="onClickPagination" :prev-text="'Prev'"
      :next-text="'Next'" :active-class="'current'" :container-class="'pagination'" :page-range="7">
    </paginate>


  <div style="height:400px;overflow-y:scroll;">
      <div v-for="r in filteredRecords" :key="r.contentId">
        <a @click=" jumpToTheMovie(r.contentId)">
          <img class="img" v-bind:src="r.thumbnailUrl" style="cursor:pointer;" width="65" height="50" />
        </a>
        <span v-bind:title="r.description">
          {{ r.title }}
        </span>
      </div>
    </div>
  </div> 
</template>

<script>
import loadInitialData from "./loadinitialdata";
import storage from "./storage";

const normalizeTitleText = str => {
  return str
    .replace("スパIIX 西日暮里バーサス火曜東西戦", "")
    .replace("ハイパーストII 西日暮里バーサス火曜東西戦", "")
    .trim();
};

export default {
  data: function() {
    return {
      searchText: "",
      records: [],
      currentPage: 1,
      pageSize: 200,
      pageCount: 1
    };
  },
  async created() {
    this.records = await loadInitialData(2009, 2018);
    //this.records = [];
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

    const r = await storage.get(["searchText"]);
    if (r.searchText) {
      this.searchText = r.searchText;
    }

    // chrome.storage.local.get(["searchText"], r => {
    //   if (r.searchText) {
    //     this.searchText = r.searchText;
    //   }
    // });
  },
  mounted() {
    this.$refs.searchText.focus();
  },
  // props: {
  //   searchText: String,
  //   pageCount: Number,
  //   currentPage: Number,
  //   message: String,
  //   records: Array
  // },
  methods: {
    onClickPagination(pageNum) {
      console.info(pageNum);
      this.currentPage = pageNum;
    },
    searchTextChanged() {
      chrome.storage.local.set({
        searchText: this.searchText
      });
      this.currentPage = 1;
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
    }
  },
  computed: {
    filteredRecords() {
      const searchText = this.searchText ? this.searchText.trim() : "";
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
      // if (this.currentPage > this.pageCount) {
      //   this.currentPage = this.pageCount;
      // }

      const computedRecords = filteredRecords.slice(startPosition, startPosition + this.pageSize);
      return computedRecords.map(a => {
        a.title = normalizeTitleText(a.title);
        return a;
      });
    }
  }
};
</script>


