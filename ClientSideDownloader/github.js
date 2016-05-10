'use strict';

function download(date, offset, done, next) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;

  const regStr = moment(date, "YYYY-MM").format("YYYY-MM");


  const okElements = document.querySelectorAll(".payment-history time[title^='"+regStr+"']");
  if (offset >= okElements.length) {
    done();
    return ;
  }

  var a = okElements[offset];
  a = a && a.parentElement;
  a = a && a.parentElement;
  a = a && a.querySelector('.receipt a');

  if (a) {
    a.click();
  } else {
    next();
  }
}

module.exports = {
  download: download
}
