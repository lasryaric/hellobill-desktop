'use strict';

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;

  const okElements = document.querySelectorAll("#downloadMonthlyStatement a");
  if (offset >= okElements.length) {
    done();

    return ;
  }
  const a = okElements[offset];
  a.click();
}

module.exports = {
  download: download
}
