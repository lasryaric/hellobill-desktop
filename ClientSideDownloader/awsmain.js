'use strict';

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;

  if (offset === 0) {
    var linksA = document.querySelectorAll(".view-invoices-link");
    for (var i = 0; i < linksA.length; i++) {
      linksA[i].click();
    }
  }

  const okElements = document.querySelectorAll('.bills-invoice-download');

  if (offset >= okElements.length) {
    done();
    return ;
  }
  okElements[offset].click();
}

module.exports = {
  download: download
}
