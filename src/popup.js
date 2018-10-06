import swal from "sweetalert2";
import axios from "axios";

document.getElementById("btn01").addEventListener("click", () => {
  swal("hello!!!");
});

const apiUrl =
  "http://api.search.nicovideo.jp/api/v2/video/contents/search?q=%E3%82%B9%E3%83%912X%E6%9D%B1%E8%A5%BF%E6%88%A6&targets=tags&_sort=-startTime&fields=title,contentId,description,startTime,thumbnailUrl,viewCounter";

document.getElementById("btn02").addEventListener("click", () => {
  axios.get(apiUrl).then(r => {
    if (r.data.meta.status !== 200) {
      return;
    }
    //r.meta.totalCount;
    //swal(r.data.message);
    let html = "";
    const data = r.data.data;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      html += "<div>";
      // html += `<a href="http://www.nicovideo.jp/watch/${d.contentId}>${
      //   d.title
      // }</a>`;
      html += `<a href="http://www.nicovideo.jp/watch/sm33930078">${
        d.title
      }</a>`;
      html += d.contentId;
      html += "</div>";
      html += "<pre>";
      html += d.description;
      html += "</pre>";
    }
    document.getElementById("pre01").innerHTML = html;
  });
});

// http://api.search.nicovideo.jp/api/v2/video/contents/search?q=スパ2X東西戦&targets=tags&_sort=-viewCounter&fields=title

document.getElementById("btn03").addEventListener("click", () => {
  const url = "http://www.nicovideo.jp/watch/sm33930078";
  chrome.tabs.update({
    url: url
  });
});
