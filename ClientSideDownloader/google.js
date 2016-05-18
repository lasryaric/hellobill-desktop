'use strict';

function download(date, offset, done) {
  offset = offset || 0;
  const okElements = document.querySelectorAll('a[href*="PDF_INVOICE"], a[href*="CSV_INVOICE"]');

  if (offset >= okElements.length) {
    done();
    return ;
  }
  okElements[offset].click();

}

module.exports = {
  download: download
}
