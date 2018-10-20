<template>
  <div style="width:450px;height:580px;overflow:hidden;">
    <input type="button" value="前の動画へ" @click="gotoPrev()" />
    <input type="button" value="次の動画へ" @click="gotoNext()" />
    <input type="button" value="更新" @click="fetchRecords()" />

    <br />

    <input type="text" v-model="searchText" v-on:keyup="searchTextChanged()" @change="searchTextChanged()" ref="searchText" />
    {{searchResult}}

    <paginate v-model="currentPage" :page-count="pageCount" :click-handler="onClickPagination" :prev-text="'Prev'"
      :next-text="'Next'" :active-class="'current'" :container-class="'pagination'" :page-range="7">
    </paginate>

    <div style="width:100%;height:100px;overflow-y:scroll;">
      <span v-html="description"></span>
    </div>

    <div style="height:350px;overflow-y:scroll;">
      <div v-for="dateRecords in filteredRecords" :key="dateRecords.date">
        <!-- <div>{{dateRecords.date}}</div> -->
        <span>{{dateRecords.date}}</span>
        <span v-for="r in dateRecords.records" :key="r.contentId">
          <a @click=" jumpToTheMovie(r.contentId)">
            <img class="img" v-bind:src="r.thumbnailUrl" v-on:mouseover="mouseover(r.description)" style="cursor:pointer;" width="52" height="40" />
          </a>
          <span v-bind:title="r.description">
            <!-- {{ r.title }} -->
          </span>
        </span>
      </div>
    </div>
  </div> 
</template>

<script>
import storage from "./storage";
import record from "./record";
import fetcher from "./fetcher";

const BASE_URL = "https://www.nicovideo.jp/watch/";

let _startTime = null;

export default {
  data: function() {
    return {
      searchText: "",
      currentPage: 1,
      pageSize: 80,
      pageCount: 1,
      description: "ここに動画の説明が表示されます。",
      searchResult: "-",
      recordCount: 0
    };
  },
  async created() {
    await record.initialize(2009, 2018);
    this.pageCount = Math.ceil(record.search().length / this.pageSize);
    this.currentPage = 1;

    chrome.tabs.getSelected(null, tab => {
      let contentId = null;
      if (tab.url.startsWith(BASE_URL)) {
        const relativeUrl = tab.url.replace(BASE_URL, "");
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
  },
  mounted() {
    if (this.$refs.searchText) {
      this.$refs.searchText.focus();
    }
  },
  updated() {
    if (_startTime !== null) {
      const elapsed = performance.now() - _startTime;
      const time = Math.round(elapsed * 100) / 100;
      this.searchResult = `${this.recordCount}件(${time}ms)`;
      _startTime = null;
    }
  },
  methods: {
    onClickPagination(pageNum) {
      this.currentPage = pageNum;
    },
    searchTextChanged() {
      chrome.storage.local.set({
        searchText: this.searchText
      });
      this.currentPage = 1;
      this.description = "";
    },
    mouseover(description) {
      this.description = description;
    },
    gotoPrev() {
      if (!this.activeContentId) {
        return;
      }
      const records = record.search();
      const index = records.findIndex(a => a.contentId === this.activeContentId);
      const newContentId = records[index + 1].contentId;
      this.jumpToTheMovie(newContentId);
    },
    gotoNext() {
      if (!this.activeContentId) {
        return;
      }
      const records = record.search();
      const index = records.findIndex(a => a.contentId === this.activeContentId);
      const newContentId = records[index - 1].contentId;
      this.jumpToTheMovie(newContentId);
    },

    jumpToTheMovie(contentId) {
      if (!contentId) {
        return;
      }
      const url = BASE_URL + contentId;
      chrome.tabs.update({
        url: url
      });
      this.activeContentId = contentId;
    },
    fetchRecords() {
      fetcher.fetch();
    }
  },
  computed: {
    filteredRecords() {
      _startTime = performance.now();

      const startTime = performance.now();
      const startPosition = this.pageSize * (this.currentPage - 1);

      const filteredRecords = record.search(this.searchText);

      this.recordCount = filteredRecords.length;
      this.pageCount = Math.ceil(this.recordCount / this.pageSize);
      const computedRecords = filteredRecords.slice(startPosition, startPosition + this.pageSize);

      return computedRecords;
    }
  }
};
</script>


