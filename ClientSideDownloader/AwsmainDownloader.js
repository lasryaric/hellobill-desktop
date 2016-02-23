'use strict';

function download(date, offset) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;


  if (offset === 0) {
    var linksA = document.querySelectorAll(".view-invoices-link");
    for (var i = 0; i < linksA.length; i++) {
      linksA[i].click();
    }
  }

  function downloadNextHandler() {
    download(date, offset + 1);
  }

  window.__hellobill.ipc.once('downloadNext', downloadNextHandler);

  const okElements = document.querySelectorAll('.bills-invoice-download');
  
  if (offset >= okElements.length) {
    window.__hellobill.ipc.send('doneDownloading');
    return ;
  }
  okElements[offset].click();

}

module.exports = {
  download: download
}
