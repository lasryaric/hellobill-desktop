'use strict';

String.prototype.capitalize = function() { //to capitalize first letter of string
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function loginbut() {
  return new Promise((yes,no) => {
    document.querySelector('button[type="submit"]').disabled = "";
    yes();
  })
}

function gourl(data) {
  const date = data.date;
  const moment = window.__hellobill.utils.moment;
  const url = document.querySelector('div.jsAccountingFilterPanel').getAttribute("data-url");
  console.log(url);
  const start = moment(date,"YYYY-MM").startOf('month').format("YYYY-MM-DD");
  const end = moment(date,"YYYY-MM").endOf('month').format("YYYY-MM-DD");
  const link = url.concat("/"+start+"-"+end+"/ALL");
  console.log(link)
  return new Promise((yes,no) => {
    yes(link)
  })
}

function download(date, offset, done, next) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;

  const okElements = document.querySelectorAll('table#trxTable tr');
  if (offset >= okElements.length) {
    done();
    return ;
  }
  var a = okElements[offset];
  console.log("A"+a);
  var b = a.querySelector('a');
  console.log("B"+b);
  if (b === undefined || b === null) {
    next();
  } else {
    var c = b.getAttribute('data-invoice');
    console.log("C"+c);
    if (c) {
      window.location = c;
    } else {
      next();
    }
  }
}

module.exports = {
  download: download,
  loginbut: loginbut,
  gourl: gourl,
}
