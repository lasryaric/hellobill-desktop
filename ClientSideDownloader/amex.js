'use strict';

function gurl() {
  return new Promise((yes,no) => {
    yes(document.querySelector('a#lbxAccountSummary').href)
  })
}

var QueryString = function () {
  // This function is anonymous, is executed immediately and
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
}();

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const lang = QueryString.Face[0].concat(QueryString.Face[1]) //get the language parameter for moment date
  console.log(lang)
  const moment = window.__hellobill.utils.moment;
  const elements = document.querySelectorAll('.orderprev .pdf_statement');
  const regStr = moment(date, "YYYY-MM").locale(lang).format("MMMM YYYY");
  const okElements = _.filter(elements, (elem) => {
    const dateText = elem.textContent;
    if (dateText === null) {
      return false;
    }
    return dateText.match(regStr)
  });
  if (offset >= okElements.length) {
    done()
    return ;
  }
  var a = okElements[offset].querySelector('a');
  console.log(a);
  var pdfForm;
  pdfForm= document.forms['EStmtImageInfoPage_form'];
  pdfForm.method="post";
  pdfForm.action = "https://global.americanexpress.com/myca/intl/pdfstmt/emea/statementPDFDownload.do?request_type=&Face="+QueryString.Face+"&sorted_index="+QueryString.sorted_index;
  console.log(pdfForm.action)
  pdfForm.sorted_index.value = QueryString.sorted_index;
  pdfForm.Face.value = QueryString.Face;
  pdfForm.PDFIndex.value = a.onclick.toString()[153];
  console.log(pdfForm.PDFIndex.value)
  console.log("@@@@@@@@@@@@@@ SUBMITTING")
  pdfForm.submit();
  //okElements[offset].querySelector('a').click();
}

module.exports = {
  download: download,
  gurl: gurl,
  }
