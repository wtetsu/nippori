<template>
  <div style="width:450px;height:550px;overflow:hidden;">
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

    <div style="height:300px;overflow-y:scroll;">
      <div v-for="dateRecords in filteredRecords" :key="dateRecords.date">
        <!-- <div>{{dateRecords.date}}</div> -->
        <span>{{dateRecords.date}}</span>
        <span v-for="r in dateRecords.records" :key="r.contentId">
          <a @click=" jumpToTheMovie(r.contentId)">
            <img class="img" v-bind:src="r.thumbnailUrl" v-on:mouseover="mouseover(r.description)" style="cursor:pointer;" width="65" height="50" />
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
      currentPage: 1,
      pageSize: 100,
      pageCount: 1,
      description: "ここに動画の説明が表示されます。",
      searchResult: "100 ms"
    };
  },
  async created() {
    this.records = [];
    await record.initialize(2009, 2018);
    this.pageCount = Math.ceil(record.search().length / this.pageSize);

    chrome.tabs.getSelected(null, tab => {
      let contentId = null;
      const baseUrl = "https://www.nicovideo.jp/watch/";
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
  },
  mounted() {
    if (this.$refs.searchText) {
      this.$refs.searchText.focus();
    }
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
      const url = `https://www.nicovideo.jp/watch/${contentId}`;
      chrome.tabs.update({
        url: url
      });
      this.activeContentId = contentId;
    },
    fetchRecords() {
      // const apiEndpoint = "http://api.search.nicovideo.jp/api/v2/video/contents/search";
      // const searchTag = "%E3%82%B9%E3%83%912X%E6%9D%B1%E8%A5%BF%E6%88%A6";
      // const fields = "title,contentId,description,startTime,thumbnailUrl,viewCounter";
      // const apiUrl = `${apiEndpoint}?q=${searchTag}&targets=tags&_sort=-startTime&fields=${fields}`;
      // axios.get(apiUrl).then(r => {
      //   if (r.data.meta.status !== 200) {
      //     return;
      //   }
      //   //r.meta.totalCount;
      //   const data = r.data.data.map(a => {
      //     const o = Object.assign({}, a);
      //     o.title = normalizeTitleText(o.title);
      //     return o;
      //   });
      //   this.records = data;
      // });
    }
  },
  computed: {
    filteredRecords() {
      console.info("filteredRecords");
      const startTime = performance.now();
      const searchText = this.searchText ? this.searchText.trim() : "";
      const startPosition = this.pageSize * (this.currentPage - 1);

      const result = [];
      let dateRecords = null;
      let thisDateRecordsHit = false;
      let dateCount = 0;
      const records = record.search();
      let len = records.length;
      for (let i = 0; i < len; i++) {
        const rec = records[i];
        if (dateRecords == null || dateRecords.date !== rec.date) {
          if (thisDateRecordsHit) {
            result.push(dateRecords);
            dateCount += 1;
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
        dateRecords.records.push(rec);
      }
      if (thisDateRecordsHit) {
        result.push(dateRecords);
      }

      this.pageCount = Math.ceil(result.length / this.pageSize);
      const computedRecords = result.slice(startPosition, startPosition + this.pageSize);

      const elapsed = performance.now() - startTime;
      const time = Math.round(elapsed * 100) / 100;
      this.searchResult = `${result.length}件(${time}ms)`;

      return computedRecords;
    }
  }
};
</script>


