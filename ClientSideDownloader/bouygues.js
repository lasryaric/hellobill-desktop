'use strict';

function download(date, offset, done {
  offset = offset || 0;
  const okElements = document.querySelectorAll(".btn.download-facture");

  if (offset >= okElements.length) {
    done();
    return ;
  }
  okElements[offset].click();

}

module.exports = {
  download: download
}
