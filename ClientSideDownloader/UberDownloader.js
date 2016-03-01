'use strict';

function download(date, offset) {
  //date: 2016-01
  offset = offset || 0;

  function downloadNextHandler() {
    download(date, offset + 1);
  }

  window.__hellobill.ipc.once('downloadNext', downloadNextHandler);

  const okElements = document.querySelectorAll('#data-invoice-btn-download');

  if (offset >= okElements.length) {

    window.__hellobill.ipc.send('doneDownloading');
    return ;
  }
  if (okElements[offset].className.match('hidden')) {

    window.__hellobill.ipc.send('doneDownloading');
  } else {

    okElements[offset].click();
  }
}

module.exports = {
  download: download
}
