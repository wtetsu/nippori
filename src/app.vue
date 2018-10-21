<template>
  <div style="width:450px;height:580px;overflow:hidden;">
    <input type="button" value="前の動画へ" @click="gotoPrev()" />
    <input type="button" value="次の動画へ" @click="gotoNext()" />
    <input type="button" value="更新" @click="fetchRecords()" />
    <span style="color:#555555;font-size:smaller;">{{lastUpdated}}</span>

    <img src="loading.gif" v-if="loading" width="12" height="12"/>

    <br />

    <input type="text" v-model="searchText" v-on:keyup="searchTextChanged()" @change="searchTextChanged()" ref="searchText"  maxlength="50" />
    {{searchResult}}

    <paginate v-model="currentPage" :page-count="pageCount" :click-handler="onClickPagination" :prev-text="'←'"
      :next-text="'→'" :active-class="'current'" :container-class="'pagination'" :page-range="7"
      >
    </paginate>

    <div style="height:450px;overflow-y:scroll;">
      <div v-for="dateRecords in filteredRecords" :key="dateRecords.date">
        <span>{{dateRecords.date}}</span>
        <span v-for="r in dateRecords.records" :key="r.contentId" class="imgWrap">
          <a @click=" jumpToTheMovie(r.contentId)">
            <img class="img" v-bind:src="r.thumbnailUrl" v-on:mouseover="mouseover(r.descriptionHtml)" style="cursor:pointer;" width="52" height="40" />
          </a>
          <span v-bind:title="r.description">
          </span>
        </span>
      </div>
      <div style="height:250px;"></div>
    </div>

    <div style="width:430px;position:absolute;bottom:0px;font-size:small;color:#F5F5F5;background-color:#303030;opacity:0.90">
      <span v-html="descriptionHtml"></span>
    </div>

  </div> 
</template>

<script>
import storage from "./storage";
import record from "./record";
import fetcher from "./fetcher";
import text from "./text";

const BASE_URL = "https://www.nicovideo.jp/watch/";

let _startTime = null;

const emphasize = (dateRecords, rawtext) => {
  const textList = rawtext.split(/ +/);
  const replacer = t => '<span class="hit">' + t + "</span>";

  for (let i = 0; i < dateRecords.length; i++) {
    const records = dateRecords[i].records;

    for (let j = 0; j < records.length; j++) {
      const r = records[j];
      r.descriptionHtml = text.replace(r.description, textList, replacer);
    }
  }
};

export default {
  data: function() {
    return {
      searchText: "",
      currentPage: 1,
      pageSize: 70,
      pageCount: 1,
      descriptionHtml: "",
      searchResult: "-",
      recordCount: 0,
      loading: false,
      lastUpdated: ""
    };
  },
  async created() {
    await record.initialize(2009, 2018);
    this.pageCount = Math.ceil(record.search().length / this.pageSize);
    this.currentPage = 1;

    chrome.tabs.getSelected(null, tab => {
      let contentId = null;
      if (tab.url && tab.url.startsWith(BASE_URL)) {
        const relativeUrl = tab.url.replace(BASE_URL, "");
        if (relativeUrl.startsWith("sm")) {
          contentId = relativeUrl;
        }
      }
      this.activeContentId = contentId;
    });

    chrome.storage.local.get(["lastUpdated"], r => {
      const lastUpdated = r.lastUpdated;
      if (lastUpdated) {
        this.lastUpdated = "最終更新:" + lastUpdated;
      }
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
      this.descriptionHtml = "";
    },
    mouseover(descriptionHtml) {
      this.descriptionHtml = descriptionHtml;
    },
    gotoPrev() {
      if (!this.activeContentId) {
        return;
      }
      const records = record.getRawRecords();
      const index = records.findIndex(a => a.contentId === this.activeContentId);
      if (index >= 1 && index < records.length - 1) {
        const newContentId = records[index + 1].contentId;
        this.jumpToTheMovie(newContentId);
      }
    },
    gotoNext() {
      if (!this.activeContentId) {
        return;
      }
      const records = record.getRawRecords();
      const index = records.findIndex(a => a.contentId === this.activeContentId);
      if (index >= 0) {
        const newContentId = records[index - 1].contentId;
        this.jumpToTheMovie(newContentId);
      }
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
    async fetchRecords() {
      this.loading = true;

      try {
        const latestContentId = record.getLatestContentId();
        const records = await fetcher.fetch(latestContentId);
        record.saveRecords(records);

        const lastUpdated = text.format(new Date());
        chrome.storage.local.set({
          lastUpdated: lastUpdated
        });
        this.lastUpdated = "最終更新:" + lastUpdated;
      } finally {
        this.loading = false;
      }

      const orgText = this.searchText;
      this.searchText = "";
      this.searchText = orgText;
    }
  },
  computed: {
    filteredRecords() {
      _startTime = performance.now();
      const startPosition = this.pageSize * (this.currentPage - 1);
      const filteredRecords = record.search(this.searchText);
      this.recordCount = filteredRecords.length;
      this.pageCount = Math.ceil(this.recordCount / this.pageSize);
      const computedRecords = filteredRecords.slice(startPosition, startPosition + this.pageSize);

      emphasize(computedRecords, this.searchText.trim());

      return computedRecords;
    }
  }
};
</script>


