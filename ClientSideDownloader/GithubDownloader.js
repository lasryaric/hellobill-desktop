'use strict';

function download(date, offset) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;

  const regStr = moment(date, "YYYY-MM").format("YYYY-MM");


  const okElements = document.querySelectorAll(".payment-history time[title^='"+regStr+"']");
  // const okElements = _.filter(allElements, function(elem) {
  //   const dateText = elem.querySelector('.billingDate').textContent;
  //   if (dateText === null) {
  //     return false;
  //   }
  //
  //   return dateText.match(regStr)
  // });
  if (offset >= okElements.length) {
    window.__hellobill.ipc.send('doneDownloading');
    return ;
  }

  var a = okElements[offset];
  a = a && a.parentElement;
  a = a && a.parentElement;
  a = a && a.querySelector('.receipt a');

  function downloadNextHandler() {
    download(date, offset + 1);
  }

  window.__hellobill.ipc.once('downloadNext', downloadNextHandler);

  if (a) {
    a.click();
  } else {
    window.__hellobill.ipc.removeListener('downloadNext', downloadNextHandler);
    downloadNextHandler();
  }
}

module.exports = {
  download: download
}