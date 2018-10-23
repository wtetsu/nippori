<template>
  <div style="width:450px;height:580px;overflow:hidden;">

    <div  style="position: absolute; top:3px; right:3px;">
      <span style="color:#555555;font-size:smaller;">{{lastUpdated}}</span>
    </div>

    <div style="height:35px;margin-top:10px;">
      <a v-if="enablePrevText" class="square_btn" @click="gotoPrev()">{{prevText}}</a>
      <a v-if="enableNextText" class="square_btn" @click="gotoNext()">{{nextText}}</a>

      <span style="float: right">
        <img src="loading.gif" v-if="loading" width="12" height="12"/>
        <a class="square_btn2" @click="fetchRecords()">最新データ取得</a>
      </span>
    </div>

    <hr/>

    <input type="search" v-model="searchText" v-on:keyup="searchTextChanged()" @change="searchTextChanged()" ref="searchText"  maxlength="50" />
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
            <img class="img" v-bind:src="r.thumbnailUrl" v-on:mouseover="mouseover(r.descriptionHtml)"
              :class="{currentImage:(activeContentId==r.contentId), normalImage:(activeContentId!=r.contentId)}"
              style="cursor:pointer;" width="52" height="40" />
          </a>
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
      searchResult: "",
      recordCount: 0,
      loading: false,
      lastUpdated: "",
      prevText: "-",
      nextText: "-",
      enablePrevText: false,
      enableNextText: false,
      activeContentId: null,
      searchTextChangedCount: 0,
      initializing: true
    };
  },
  async created() {
    this.pageCount = Math.ceil(record.search().length / this.pageSize);
    this.currentPage = 1;

    await record.initialize(2009, 2018);

    const orgSearchText = this.searchText;
    this.searchText = " ";
    this.searchText = orgSearchText;

    chrome.tabs.getSelected(null, tab => {
      let contentId = null;
      if (tab.url && tab.url.startsWith(BASE_URL)) {
        const relativeUrl = tab.url.replace(BASE_URL, "");
        if (relativeUrl.startsWith("sm")) {
          contentId = relativeUrl;
        }
      }
      this.activeContentId = contentId;
      this.updateLinkText(contentId);
    });

    const lastUpdated = await storage.getDatum("lastUpdated");
    if (lastUpdated) {
      this.lastUpdated = "最終更新:" + lastUpdated;
    }

    const searchText = await storage.getDatum("searchText");
    this.initializing = false;
    if (searchText) {
      this.searchText = searchText;
    }
  },
  async mounted() {
    if (this.$refs.searchText) {
      this.$refs.searchText.focus();
    }
  },
  updated() {
    if (_startTime !== null && this.searchTextChangedCount >= 1) {
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
      if (this.searchTextChangedCount >= 1) {
        storage.set({
          searchText: this.searchText
        });
      }
      this.currentPage = 1;
      this.descriptionHtml = "";
      this.searchTextChangedCount += 1;
    },
    mouseover(descriptionHtml) {
      this.descriptionHtml = descriptionHtml;
    },
    gotoPrev() {
      const r = record.getRelativeRecord(this.activeContentId, +1);
      if (r) {
        this.jumpToTheMovie(r.contentId);
      }
    },
    gotoNext() {
      const r = record.getRelativeRecord(this.activeContentId, -1);
      if (r) {
        this.jumpToTheMovie(r.contentId);
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
      this.updateLinkText(contentId);
    },

    updateLinkText(contentId) {
      const recPrev = record.getRelativeRecord(contentId, +1);
      if (recPrev) {
        this.prevText = this.createLinkText(recPrev);
        this.enablePrevText = true;
      } else {
        this.enablePrevText = false;
        this.prevText = "-";
      }

      const recNext = record.getRelativeRecord(contentId, -1);
      if (recNext) {
        this.nextText = this.createLinkText(recNext);
        this.enableNextText = true;
      } else {
        this.enableNextText = false;
        this.nextText = "";
      }
    },

    createLinkText(rec) {
      const index = rec.title.indexOf(rec.date);
      let text;
      if (index >= 0) {
        text = rec.title.substring(index) + "に移動";
      } else {
        text = rec.date;
      }
      return text;
    },

    async fetchRecords() {
      this.loading = true;

      try {
        const latestContentId = record.getLatestContentId();
        const records = await fetcher.fetch(latestContentId);
        await record.saveRecords(records);

        const lastUpdated = text.format(new Date());
        storage.set({
          lastUpdated: lastUpdated
        });
        this.lastUpdated = "最終更新:" + lastUpdated;
      } catch (e) {
        alert(e.message);
      } finally {
        this.loading = false;
      }

      const orgText = this.searchText;
      this.searchText = " ";
      this.searchText = orgText;
      this.descriptionHtml = "";
    }
  },
  computed: {
    filteredRecords() {
      if (this.initializing) {
        return [];
      }
      this.descriptionHtml = "";
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


