//import swal from "sweetalert2";
// import tippy from "tippy.js";
// import "tippy.js/dist/tippy.css";
import axios from "axios";
import Vue from "vue";
import App from "./app";

import Paginate from "vuejs-paginate";
Vue.component("paginate", Paginate);

new Vue({
  el: "#app",
  components: { App },
  template: "<app></app>"
});
