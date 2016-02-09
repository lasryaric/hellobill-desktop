'use strict';

function download(date, offset) {
  //date: 2016-01
  offset = offset || 0;

  const okElements = document.querySelectorAll("#downloadMonthlyStatement a");
  if (offset >= okElements.length) {
    window.__hellobill.ipc.send('doneDownloading');

    return ;
  }

  const a = okElements[offset];

  function downloadNextHandler() {
    download(date, offset + 1);
  }
  window.__hellobill.ipc.once('downloadNext', downloadNextHandler);

  a.click();
}

module.exports = {
  download: download
}
