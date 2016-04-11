'use strict';

function download(date, offset) {
  
  offset = offset || 0;
  const okElements = document.querySelectorAll('a[href*="/ads/manage/billing_transaction.php"]');

  if (offset >= okElements.length) {
    window.__hellobill.ipc.send('doneDownloading');
    return ;
  }
  function downloadNextHandler() {
    download(date, offset + 1);
  }

  window.__hellobill.ipc.once('downloadNext', downloadNextHandler);
  okElements[offset].click();

}

module.exports = {
  download: download
}
