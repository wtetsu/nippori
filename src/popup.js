/**
 * Nippori (https://github.com/wtetsu/nippori/)
 * Copyright 2018-present wtetsu
 * Licensed under MIT
 */
import Vue from "vue";
import App from "./app";

import Paginate from "vuejs-paginate";
Vue.component("paginate", Paginate);

new Vue({
  el: "#app",
  components: { App },
  template: "<app></app>"
});
