'use strict';

function download(date, offset, done) {
  offset = offset || 0;
  const okElements = document.querySelectorAll('a[href*="/pdf"]');

  if (offset >= okElements.length) {
    done();
    return ;
  }
  okElements[offset].click();
}

module.exports = {
  download: download
}
