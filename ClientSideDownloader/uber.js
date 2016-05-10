'use strict';

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;

  const okElements = document.querySelectorAll('#data-invoice-btn-download');

  if (offset >= okElements.length) {
    done();
    return ;
  }
  if (okElements[offset].className.match('hidden')) {

    done();
  } else {

    okElements[offset].click();
  }
}

module.exports = {
  download: download
}
